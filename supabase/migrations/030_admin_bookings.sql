-- ============================================================
-- Admin-entered bookings and drag-to-move on the reservations timeline.
--
-- Staff can now create a booking themselves (walk-in, phone call) and drag
-- an existing one to another station and/or start time. Overlap protection
-- needs nothing new: bookings_no_overlap (003) and the station-block trigger
-- (024) fire on INSERT and on UPDATE of station, date and start time alike.
--
-- 1. customer_email becomes nullable. A walk-in often gives a name and
--    nothing else; inventing a placeholder address would mail a stranger.
--    The public route still requires one (zod), so this only opens the door
--    for staff. Every customer-facing sender skips a NULL address.
--
-- 2. source + created_by say who entered the row. 'web' is everything that
--    came through /api/bookings, which is every row before this migration.
--    created_by follows station_blocks.created_by: nullable, SET NULL on
--    profile removal so the booking survives the admin.
--
-- 3. rescheduled_at / rescheduled_by record the last time change, the way
--    028 records the last station change. Latest only, no history table.
--
-- 4. admin_move_booking() applies a drag in one statement. A time change
--    moves the whole group (every station row of a multi-PC reservation
--    keeps one start time, which the emails and receipts assume); a station
--    change moves only the dragged row, as the reassign route always has.
--    One UPDATE means one transaction: either the whole group lands or a
--    23P01 rolls all of it back.
-- ============================================================

ALTER TABLE bookings
  ALTER COLUMN customer_email DROP NOT NULL,
  ADD COLUMN source text NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'admin')),
  ADD COLUMN created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN rescheduled_at timestamptz,
  ADD COLUMN rescheduled_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN bookings.source IS
  'web = made by the customer through /api/bookings; admin = entered by staff.';
COMMENT ON COLUMN bookings.created_by IS
  'Admin who entered the booking (source = admin). NULL for web bookings or once the profile is deleted.';
COMMENT ON COLUMN bookings.rescheduled_at IS
  'When an admin last moved this booking to a different start time.';
COMMENT ON COLUMN bookings.rescheduled_by IS
  'Admin who last moved the start time. NULL once their profile is deleted.';

-- SECURITY INVOKER: the only caller is the service-role client, which already
-- holds every privilege this needs. Definer rights would add nothing but a
-- way around RLS for anyone else who could call it.
CREATE OR REPLACE FUNCTION public.admin_move_booking(
  p_booking_id    uuid,
  p_station_id    uuid,
  p_shift_minutes int,
  p_admin_id      uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_group uuid;
BEGIN
  SELECT COALESCE(booking_group_id, id) INTO v_group
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking % not found', p_booking_id USING ERRCODE = 'P0002';
  END IF;

  -- SET reads the old row on every right-hand side, so date and start_time
  -- are both computed from the pre-move timestamp.
  UPDATE public.bookings b
  SET
    station_id = CASE WHEN b.id = p_booking_id THEN p_station_id ELSE b.station_id END,
    date       = ((b.date + b.start_time) + make_interval(mins => p_shift_minutes))::date,
    start_time = ((b.date + b.start_time) + make_interval(mins => p_shift_minutes))::time,
    station_reassigned_at = CASE
      WHEN b.id = p_booking_id AND p_station_id <> b.station_id THEN now()
      ELSE b.station_reassigned_at END,
    station_reassigned_by = CASE
      WHEN b.id = p_booking_id AND p_station_id <> b.station_id THEN p_admin_id
      ELSE b.station_reassigned_by END,
    rescheduled_at = CASE WHEN p_shift_minutes <> 0 THEN now() ELSE b.rescheduled_at END,
    rescheduled_by = CASE WHEN p_shift_minutes <> 0 THEN p_admin_id ELSE b.rescheduled_by END
  WHERE (b.booking_group_id = v_group OR b.id = v_group)
    AND b.status <> 'cancelled'
    -- A pure station change touches only the dragged row.
    AND (p_shift_minutes <> 0 OR b.id = p_booking_id);
END
$$;

REVOKE ALL ON FUNCTION public.admin_move_booking(uuid, uuid, int, uuid) FROM PUBLIC;

-- Same run-time role guard as 027: the migration check runs on a plain
-- postgres:16 where the Supabase roles do not exist.
DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION public.admin_move_booking(uuid, uuid, int, uuid) FROM %I', r
      );
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_move_booking(uuid, uuid, int, uuid) TO service_role';
  END IF;
END
$$;

-- 5. The timeline refreshes itself when another admin changes something.
--    bookings has been in the publication since 009; blocks share the board.
--    station_blocks_admin_read (027) keeps the events staff-only.
ALTER PUBLICATION supabase_realtime ADD TABLE station_blocks;

-- 6. The 024 overlap triggers name their tables unqualified and had no
--    search_path of their own, so they resolved names with the caller's.
--    admin_move_booking() runs with search_path = '' — inside it, the
--    booking trigger could not find station_blocks and every move failed.
--    Pinning the path on the trigger functions makes them independent of
--    whoever fires them.
ALTER FUNCTION public.station_blocks_reject_booking_overlap() SET search_path = public;
ALTER FUNCTION public.bookings_reject_station_block_overlap() SET search_path = public;
