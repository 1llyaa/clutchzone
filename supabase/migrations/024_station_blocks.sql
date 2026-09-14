-- ============================================================
-- Admin station blocks — take specific stations out of circulation for a
-- bounded window. No customer, no price, no e-mail, no payment state.
--
-- The only existing lever was stations.is_active, a global on/off with no
-- time dimension: it removes the station from every date at once and stays
-- off until someone remembers to flip it back.
--
-- Deliberately a separate table rather than rows in `bookings` carrying a
-- kind = 'block' marker. That alternative buys cross-table atomicity for
-- free — the bookings_no_overlap exclusion constraint from migration 003
-- would cover block-vs-booking — but roughly eighteen code sites query
-- `bookings`: dashboard revenue tiles, the credit-fulfillment queue, the
-- notification badge, payment receipts, cancellation credit math, the
-- Stripe webhook, the ggLeap hours cell. Every one of them, and every
-- query written afterwards, would need a `kind <> 'block'` filter, and a
-- single forgotten filter puts a fake row into a customer-facing number.
-- `bookings` also has customer_name, customer_email and total_price as
-- NOT NULL, so blocks would need sentinel values or relaxed constraints.
--
-- The separate table inverts the cost: three occupancy readers learn to
-- union blocks in, cross-table exclusion needs the triggers below, and no
-- booking, payment, credit or e-mail path can ever see a block.
-- ============================================================

CREATE TABLE IF NOT EXISTS station_blocks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Mirrors booking_group_id: blocking four PCs is four rows sharing one
  -- group, created and deleted as a unit. Unlike bookings there is no
  -- legacy row predating the grouping, so lookups key on this alone —
  -- no `id.eq` fallback anywhere.
  block_group_id   uuid NOT NULL,
  station_id       uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  -- date + start_time + duration_minutes deliberately mirrors `bookings`
  -- after migration 003, so one overlap helper serves both tables and a
  -- duration running past midnight is handled identically.
  date             date NOT NULL,
  start_time       time NOT NULL,
  duration_minutes int  NOT NULL CHECK (duration_minutes > 0),
  -- Staff-facing only. Never rendered on any public surface.
  note             text,
  -- Accountability. Nullable, so a block survives the admin's profile
  -- being removed rather than taking the block down with it.
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- No status column on purpose: a block is deleted outright. There is no
  -- cancelled block worth keeping for history — no money and no customer
  -- is attached to one.
  CONSTRAINT station_blocks_no_overlap EXCLUDE USING gist (
    station_id WITH =,
    tsrange(
      (date + start_time)::timestamp,
      (date + start_time)::timestamp + (duration_minutes * INTERVAL '1 minute'),
      '[)'
    ) WITH &&
  )
);

CREATE INDEX IF NOT EXISTS station_blocks_date_idx  ON station_blocks (date);
CREATE INDEX IF NOT EXISTS station_blocks_group_idx ON station_blocks (block_group_id);

-- Mirrors bookings_admin_read from migration 010: any row in profiles may
-- read. There is deliberately no anon policy at all — the public only ever
-- sees a block as the availability count dropping, which is computed
-- server-side. All writes go through admin routes on the service-role
-- client, which bypasses RLS.
ALTER TABLE station_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "station_blocks_admin_read" ON station_blocks;
CREATE POLICY "station_blocks_admin_read" ON station_blocks
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles));

-- ============================================================
-- Cross-table atomicity.
--
-- Postgres exclusion constraints cannot span two tables, so
-- station_blocks_no_overlap above protects block-vs-block only.
-- Block-vs-booking needs a trigger on each side.
--
-- Both take pg_advisory_xact_lock(hashtext(station_id)) before reading the
-- other table. Taking the same lock key on the same station from both
-- sides serializes the check, closing the window where two concurrent
-- transactions each read "clear" and both insert.
--
-- Both raise SQLSTATE 23P01 (exclusion_violation), matching what the
-- existing exclusion constraint raises, so POST /api/bookings maps a lost
-- race to its existing 409 with no change to that branch.
-- ============================================================

CREATE OR REPLACE FUNCTION station_blocks_reject_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.station_id::text));

  IF EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.station_id = NEW.station_id
      AND b.status <> 'cancelled'
      AND tsrange(
            (b.date + b.start_time)::timestamp,
            (b.date + b.start_time)::timestamp + (b.duration_minutes * INTERVAL '1 minute'),
            '[)'
          ) && tsrange(
            (NEW.date + NEW.start_time)::timestamp,
            (NEW.date + NEW.start_time)::timestamp + (NEW.duration_minutes * INTERVAL '1 minute'),
            '[)'
          )
  ) THEN
    RAISE EXCEPTION 'station_blocks row overlaps a live booking on station %', NEW.station_id
      USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION bookings_reject_station_block_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.station_id::text));

  IF EXISTS (
    SELECT 1
    FROM station_blocks sb
    WHERE sb.station_id = NEW.station_id
      AND tsrange(
            (sb.date + sb.start_time)::timestamp,
            (sb.date + sb.start_time)::timestamp + (sb.duration_minutes * INTERVAL '1 minute'),
            '[)'
          ) && tsrange(
            (NEW.date + NEW.start_time)::timestamp,
            (NEW.date + NEW.start_time)::timestamp + (NEW.duration_minutes * INTERVAL '1 minute'),
            '[)'
          )
  ) THEN
    RAISE EXCEPTION 'booking overlaps a station block on station %', NEW.station_id
      USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS station_blocks_no_booking_overlap_ins ON station_blocks;
CREATE TRIGGER station_blocks_no_booking_overlap_ins
  BEFORE INSERT ON station_blocks
  FOR EACH ROW
  EXECUTE FUNCTION station_blocks_reject_booking_overlap();

DROP TRIGGER IF EXISTS station_blocks_no_booking_overlap_upd ON station_blocks;
CREATE TRIGGER station_blocks_no_booking_overlap_upd
  BEFORE UPDATE ON station_blocks
  FOR EACH ROW
  WHEN (
       OLD.station_id       IS DISTINCT FROM NEW.station_id
    OR OLD.date             IS DISTINCT FROM NEW.date
    OR OLD.start_time       IS DISTINCT FROM NEW.start_time
    OR OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes
  )
  EXECUTE FUNCTION station_blocks_reject_booking_overlap();

-- The INSERT side is a single multi-row statement in POST /api/bookings.
-- The trigger fires per row and each takes its own station's lock, which
-- is correct — a group either lands whole or rolls back whole.
--
-- A cancelled booking occupies nothing, so it is exempt: staff must be
-- able to block a slot that a cancelled booking happens to sit on, and
-- later writes to that cancelled row (a refund stamp, a receipt claim)
-- must not then be rejected by a block that legitimately overlaps it.
DROP TRIGGER IF EXISTS bookings_no_station_block_overlap_ins ON bookings;
CREATE TRIGGER bookings_no_station_block_overlap_ins
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status <> 'cancelled')
  EXECUTE FUNCTION bookings_reject_station_block_overlap();

-- The UPDATE guard is load-bearing for cost as much as correctness. Every
-- routine write to a booking — payment_status, payment_confirmed_email_at,
-- coins_awarded, the hold reaper flipping status to cancelled — leaves
-- occupancy untouched, and must not pay for an advisory lock and a
-- station_blocks scan. Only a write that moves the booking in time, moves
-- it to another station, or brings it back out of `cancelled` re-occupies
-- anything, so only those are checked.
DROP TRIGGER IF EXISTS bookings_no_station_block_overlap_upd ON bookings;
CREATE TRIGGER bookings_no_station_block_overlap_upd
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  WHEN (
    NEW.status <> 'cancelled'
    AND (
         OLD.station_id       IS DISTINCT FROM NEW.station_id
      OR OLD.date             IS DISTINCT FROM NEW.date
      OR OLD.start_time       IS DISTINCT FROM NEW.start_time
      OR OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes
      OR OLD.status           IS DISTINCT FROM NEW.status
    )
  )
  EXECUTE FUNCTION bookings_reject_station_block_overlap();
