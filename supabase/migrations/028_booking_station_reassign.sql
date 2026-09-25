-- ============================================================
-- Admin station reassignment — who moved a reservation to another PC.
--
-- The station is picked by the server at booking time
-- (free.slice(0, stationsCount) in app/api/bookings/route.ts) and the
-- customer never chooses. Staff, though, have to be able to move someone:
-- a PC breaks, a group wants adjacent machines. Until now the only ways
-- were delete + rebook — which loses the reference, the coins and the
-- paid flag — or a manual UPDATE.
--
-- The move itself needs no new schema: bookings_no_overlap (003) and the
-- bookings_no_station_block_overlap_upd trigger (024) already fire on an
-- UPDATE of station_id, so a collision raises 23P01 exactly as an INSERT
-- would. These two columns exist only for accountability.
--
-- No audit table: this repo records admin actions as attribution columns
-- on the row itself (station_blocks.created_by, bookings.fulfilled_by),
-- and this follows that pattern. Only the most recent move is kept — the
-- question staff actually ask is "who put this customer here", not the
-- full history.
--
-- Nullable, and ON DELETE SET NULL, for the same reason as
-- station_blocks.created_by: the record must survive the admin's profile
-- being removed. No index — these columns are display-only and are never
-- filtered or sorted on.
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN station_reassigned_at timestamptz,
  ADD COLUMN station_reassigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN bookings.station_reassigned_at IS
  'When an admin last moved this booking to a different station. NULL = still on the station assigned at booking time.';
COMMENT ON COLUMN bookings.station_reassigned_by IS
  'Admin who last moved this booking. NULL once their profile is deleted; the timestamp survives.';
