-- ============================================================
-- Fix bookings table to support after-midnight end times
-- (Weekend Pass 22:00 – 04:00 crosses midnight)
-- Run this AFTER 001 and 002
-- ============================================================

ALTER TABLE bookings DROP CONSTRAINT bookings_no_overlap;
ALTER TABLE bookings DROP COLUMN end_time;
ALTER TABLE bookings ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 60;

-- New constraint: adds duration to start timestamp, handles midnight crossing correctly
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
EXCLUDE USING gist (
  station_id WITH =,
  tsrange(
    (date + start_time)::timestamp,
    (date + start_time)::timestamp + (duration_minutes * INTERVAL '1 minute'),
    '[)'
  ) WITH &&
) WHERE (status <> 'cancelled');
