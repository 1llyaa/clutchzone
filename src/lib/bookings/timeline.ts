import { parseTimeToMinutes, rangesOverlap } from './occupancy';
import { planMove, type MoveRow } from './move';

/**
 * Geometry of the admin reservations timeline. Everything is in minutes on
 * the board day's axis: 0 = midnight at the start of the board date, 1500 =
 * 01:00 the next calendar day. Rows stored under the next date sit at +1440.
 */

export const CELL_MINUTES = 30;
const DEFAULT_OPEN = 14 * 60;
const DEFAULT_CLOSE = 24 * 60;

export interface OpeningRow {
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  crosses_midnight: boolean;
}

export interface BoardItem {
  id: string;
  station_id: string;
  start: number;
  end: number;
}

/** A stored row's start on the board's axis, or null if it is on another date. */
export function boardMinutes(boardDate: string, nextDate: string, row: { date: string; start_time: string }): number | null {
  const offset = row.date === boardDate ? 0 : row.date === nextDate ? 1440 : null;
  return offset === null ? null : offset + parseTimeToMinutes(row.start_time);
}

/**
 * The span the board shows: the opening hours, widened to whole hours around
 * anything booked outside them (a walk-in logged before opening still has to
 * be visible). A closed or unknown day shows 14:00–24:00.
 */
export function boardRange(opening: OpeningRow | null, items: BoardItem[]): { start: number; end: number; closed: boolean } {
  const closed = !opening || opening.is_closed || !opening.open_time || !opening.close_time;
  let start = DEFAULT_OPEN;
  let end = DEFAULT_CLOSE;
  if (!closed) {
    start = parseTimeToMinutes(opening.open_time!);
    end = parseTimeToMinutes(opening.close_time!) + (opening.crosses_midnight ? 1440 : 0);
    // '24:00' parses to 1440 already; a non-crossing close of 00:00 means midnight.
    if (end <= start) end += 1440;
  }
  // Rows from the next date are fetched for the small hours only. One that
  // starts after tonight's close belongs to tomorrow's board.
  const lastStart = Math.max(end, 1440);
  for (const it of items) {
    if (it.end <= 0 || it.start >= lastStart) continue;
    start = Math.min(start, Math.floor(it.start / 60) * 60);
    end = Math.max(end, Math.ceil(it.end / 60) * 60);
  }
  return { start: Math.max(0, start), end: Math.min(2880, end), closed };
}

export function snapToCell(minutes: number): number {
  return Math.round(minutes / CELL_MINUTES) * CELL_MINUTES;
}

/** `HH:MM`, wrapping past midnight. */
export function minutesLabel(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Whether `[start, end)` on `stationId` is free of every item not in `ignore`. */
export function isFree(items: BoardItem[], stationId: string, start: number, end: number, ignore?: Set<string>): boolean {
  return !items.some(
    (it) => it.station_id === stationId && !ignore?.has(it.id) && rangesOverlap(start, end, it.start, it.end),
  );
}

export type DropCheck =
  | { ok: true; noop: boolean; movingIds: string[] }
  | { ok: false; reason: string };

/**
 * Client-side mirror of the move route's checks, for colouring the drag
 * ghost. The server repeats all of it, and the DB constraint is the last word.
 */
export function checkDrop(params: {
  dragged: MoveRow;
  group: MoveRow[];
  targetStationId: string;
  targetType: string | null;
  targetActive: boolean;
  draggedType: string | null;
  shiftMinutes: number;
  /** Board items: bookings and blocks, already on the board axis. */
  items: BoardItem[];
  /** Board-axis start of the dragged row now. */
  draggedStart: number;
}): DropCheck {
  const { dragged, group, targetStationId, shiftMinutes, items, draggedStart } = params;
  if (!params.targetActive) return { ok: false, reason: 'Stanice je vyřazená z provozu' };
  if (params.draggedType && params.targetType !== params.draggedType) {
    return { ok: false, reason: 'Jen stanice stejného typu' };
  }
  const plan = planMove(dragged, group, targetStationId, shiftMinutes);
  if (plan === 'noop') return { ok: true, noop: true, movingIds: [] };
  if (plan === 'onto-sibling') return { ok: false, reason: 'Stanice z téže rezervace' };

  const start = draggedStart + shiftMinutes;
  const end = start + dragged.duration_minutes;
  const ignore = new Set(plan.movingIds);
  for (const stationId of plan.targetStationIds) {
    if (!isFree(items, stationId, start, end, ignore)) return { ok: false, reason: 'Obsazeno' };
  }
  return { ok: true, noop: false, movingIds: plan.movingIds };
}
