import { parseTimeToMinutes } from './occupancy';

/**
 * What an admin drag on the reservations timeline does to a booking group,
 * worked out before anything is written. Mirrors admin_move_booking() in
 * migration 030: a time shift moves every live row of the group, a station
 * change moves only the dragged row.
 */

export interface MoveRow {
  id: string;
  station_id: string;
  start_time: string;
  duration_minutes: number;
  status: string;
}

export interface MovePlan {
  /** Rows whose position changes, so they must not block themselves. */
  movingIds: string[];
  /** Stations to check, one per moving row, at its new position. */
  targetStationIds: string[];
  /** Window on the booking's own date axis; may run past 1440. */
  startMinutes: number;
  endMinutes: number;
}

export type MoveError = 'noop' | 'onto-sibling';

export function planMove(
  dragged: MoveRow,
  group: MoveRow[],
  targetStationId: string,
  shiftMinutes: number,
): MovePlan | MoveError {
  const stationChanges = targetStationId !== dragged.station_id;
  if (!stationChanges && shiftMinutes === 0) return 'noop';

  const live = group.filter((r) => r.status !== 'cancelled');
  const moving = shiftMinutes === 0 ? [dragged] : live;
  const movingIds = moving.map((r) => r.id);

  // With a shift every sibling moves by the same amount, so the dragged row
  // landing on a sibling's station always collides with that sibling's new
  // position. Without a shift the sibling stays put and is checked as
  // ordinary occupancy below.
  if (shiftMinutes !== 0 && live.some((r) => r.id !== dragged.id && r.station_id === targetStationId)) {
    return 'onto-sibling';
  }

  const startMinutes = parseTimeToMinutes(dragged.start_time) + shiftMinutes;
  return {
    movingIds,
    targetStationIds: moving.map((r) => (r.id === dragged.id ? targetStationId : r.station_id)),
    startMinutes,
    endMinutes: startMinutes + dragged.duration_minutes,
  };
}
