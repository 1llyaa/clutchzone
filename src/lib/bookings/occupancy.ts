import type { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * A station is occupied in a window if a live booking *or* an admin block
 * covers any part of it.
 *
 * The overlap loop used to be copy-pasted, identically, in three files
 * (public availability, booking creation, the admin grid). Station blocks
 * add a second source of occupancy to every one of them, so the three
 * copies became one place that knows what "busy" means.
 */

/** `HH:MM` or `HH:MM:SS` to minutes from midnight. */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Half-open intervals: `[10:00, 11:00)` and `[11:00, 12:00)` do not overlap.
 * Matches the `'[)'` bound used by bookings_no_overlap and
 * station_blocks_no_overlap, so JS and Postgres never disagree about a
 * booking that ends exactly when the next one starts.
 */
export function rangesOverlap(
  aStartMin: number,
  aEndMin: number,
  bStartMin: number,
  bEndMin: number,
): boolean {
  return bStartMin < aEndMin && bEndMin > aStartMin;
}

/** `YYYY-MM-DD` shifted by whole days, in UTC so DST never moves the date. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Where a club-day start hour lands on the calendar. The pricing calculator
 * counts hours past midnight as 24, 25, … of the evening's day, but bookings
 * are stored as a real date + time, so Friday 25:00 is Saturday 01:00.
 */
export function calendarStart(date: string, startHour: number): { date: string; startTime: string } {
  return calendarStartMinutes(date, startHour * 60);
}

/** Same as calendarStart, for a start given in minutes on the club-day axis. */
export function calendarStartMinutes(date: string, startMinutes: number): { date: string; startTime: string } {
  const dayRoll = Math.floor(startMinutes / 1440);
  const inDay = startMinutes - dayRoll * 1440;
  return {
    date: dayRoll ? addDays(date, dayRoll) : date,
    startTime: `${String(Math.floor(inDay / 60)).padStart(2, '0')}:${String(inDay % 60).padStart(2, '0')}`,
  };
}

interface OccupancyQuery {
  /**
   * The day the window is measured from. `startMinutes`/`endMinutes` may run
   * past 1440 (or below 0) to ask about the small hours of the next day.
   */
  date: string;
  stationIds: string[];
  startMinutes: number;
  endMinutes: number;
  /**
   * Booking ids that must not count as occupancy — the rows being moved by an
   * admin reassignment. A booking otherwise answers "occupied" about its own
   * station, so its current station could never be offered back to it.
   *
   * Bookings only: an admin block is never excluded, and the two tables have
   * separate id spaces.
   */
  excludeBookingIds?: string[];
}

interface TimedRow {
  id?: string;
  date: string;
  station_id: string;
  start_time: string;
  duration_minutes: number;
}

function collectOverlapping(
  rows: TimedRow[] | null,
  into: Set<string>,
  dayOffsets: Map<string, number>,
  startMinutes: number,
  endMinutes: number,
  skipIds?: Set<string>,
): void {
  for (const r of rows ?? []) {
    if (skipIds?.has(r.id ?? '')) continue;
    const offset = dayOffsets.get(r.date);
    if (offset === undefined) continue;
    const start = offset + parseTimeToMinutes(r.start_time);
    if (rangesOverlap(startMinutes, endMinutes, start, start + r.duration_minutes)) {
      into.add(r.station_id);
    }
  }
}

/**
 * Stations busy in `[startMinutes, endMinutes)` on `date` — the union of
 * non-cancelled bookings and admin blocks.
 *
 * Rows from the day before and after are read too and placed on the same
 * minute axis (-1440 / +1440). A Friday 22:00 + 4h booking still holds the
 * station at Saturday 01:00, and a Friday-night window of 25:00 has to see
 * what is stored under Saturday.
 *
 * Returns an empty set on a read error rather than throwing. The callers are
 * an availability counter and a booking pre-check; both have a DB-level
 * backstop behind them (the exclusion constraint and the cross-table
 * triggers), so a failed read must not take the whole request down.
 */
export async function occupiedStationIds(
  admin: AdminClient,
  { date, stationIds, startMinutes, endMinutes, excludeBookingIds }: OccupancyQuery,
): Promise<Set<string>> {
  const occupied = new Set<string>();
  if (!stationIds.length) return occupied;

  const dayOffsets = new Map([
    [addDays(date, -1), -1440],
    [date, 0],
    [addDays(date, 1), 1440],
  ]);
  const dates = [...dayOffsets.keys()];

  const [bookingsRes, blocksRes] = await Promise.all([
    admin
      .from('bookings')
      .select('id, date, station_id, start_time, duration_minutes')
      .in('station_id', stationIds)
      .neq('status', 'cancelled')
      .in('date', dates),
    admin
      .from('station_blocks')
      .select('date, station_id, start_time, duration_minutes')
      .in('station_id', stationIds)
      .in('date', dates),
  ]);

  if (bookingsRes.error) {
    console.error('Occupancy read failed for bookings:', bookingsRes.error);
  }
  if (blocksRes.error) {
    console.error('Occupancy read failed for station blocks:', blocksRes.error);
  }

  const skipIds = excludeBookingIds?.length ? new Set(excludeBookingIds) : undefined;
  collectOverlapping(bookingsRes.data, occupied, dayOffsets, startMinutes, endMinutes, skipIds);
  collectOverlapping(blocksRes.data, occupied, dayOffsets, startMinutes, endMinutes);

  return occupied;
}
