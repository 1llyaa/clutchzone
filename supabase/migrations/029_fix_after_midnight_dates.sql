-- ============================================================
-- After-midnight bookings were stored on the wrong calendar day.
--
-- The calculator counts the hours past midnight as 24, 25, … of the
-- evening's day (Friday 25:00). /api/bookings stored `startHour % 24` on
-- that same date, so Friday 25:00 landed as Friday 01:00 — the small hours
-- *before* Friday opened, not the night after it. bookings_no_overlap and
-- every per-date read then compared the wrong window.
--
-- The route now stores the real calendar date (Saturday 01:00). This moves
-- the rows already written the old way: a start time before close_time on a
-- crosses_midnight day can only have come from that evening, because the
-- day before it closes at or before midnight in every schedule we have run.
--
-- Rows move one at a time, latest date first. bookings_no_overlap is not
-- deferrable, so a single UPDATE could transiently put a Friday-night row on
-- Saturday 01:00 while the Saturday-night row stored there is still waiting
-- for its own move to Sunday.
--
-- Cancelled rows move too, so the history reads correctly. Station blocks
-- are left alone: an admin typed their date and time directly.
--
-- Run ONCE, and BEFORE the fixed /api/bookings is deployed. The predicate
-- cannot tell an old Friday 01:00 row from a correctly stored Saturday
-- 01:00 one (Saturday also crosses midnight), so a Friday-night booking
-- made by the new code before this runs would be pushed on to Sunday.
-- ============================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT b.id
    FROM bookings b
    JOIN opening_hours oh
      ON oh.day_of_week = EXTRACT(DOW FROM b.date)::int
    WHERE oh.crosses_midnight
      AND NOT oh.is_closed
      AND oh.close_time IS NOT NULL
      AND b.start_time < oh.close_time
    ORDER BY b.date DESC, b.start_time DESC
  LOOP
    UPDATE bookings SET date = date + 1 WHERE id = r.id;
  END LOOP;
END $$;
