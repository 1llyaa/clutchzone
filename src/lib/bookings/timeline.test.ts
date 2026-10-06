import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boardMinutes, boardRange, checkDrop, isFree, minutesLabel, snapToCell, type BoardItem } from './timeline';
import type { MoveRow } from './move';

const FRI = { is_closed: false, open_time: '14:00:00', close_time: '04:00:00', crosses_midnight: true };
const TUE = { is_closed: false, open_time: '14:00:00', close_time: '24:00:00', crosses_midnight: false };

test('a row on the next calendar date sits past 1440 on the board', () => {
  assert.equal(boardMinutes('2026-10-09', '2026-10-10', { date: '2026-10-09', start_time: '18:00:00' }), 1080);
  assert.equal(boardMinutes('2026-10-09', '2026-10-10', { date: '2026-10-10', start_time: '01:00:00' }), 1500);
  assert.equal(boardMinutes('2026-10-09', '2026-10-10', { date: '2026-10-11', start_time: '01:00:00' }), null);
});

test('the board spans the opening hours, past midnight when the day does', () => {
  assert.deepEqual(boardRange(TUE, []), { start: 840, end: 1440, closed: false });
  assert.deepEqual(boardRange(FRI, []), { start: 840, end: 1680, closed: false });
});

test('a closed day still gets a board', () => {
  assert.deepEqual(boardRange({ is_closed: true, open_time: null, close_time: null, crosses_midnight: false }, []), {
    start: 840, end: 1440, closed: true,
  });
  assert.equal(boardRange(null, []).closed, true);
});

test('a booking outside opening hours widens the board to whole hours', () => {
  const early: BoardItem = { id: 'a', station_id: 'pc-1', start: 12 * 60 + 30, end: 13 * 60 + 30 };
  assert.deepEqual(boardRange(TUE, [early]), { start: 720, end: 1440, closed: false });
});

test('a next-evening row does not stretch tonight\'s board', () => {
  // Saturday 18:00 is fetched with Friday's board but lives at 2520.
  const tomorrow: BoardItem = { id: 'a', station_id: 'pc-1', start: 2520, end: 2640 };
  assert.deepEqual(boardRange(FRI, [tomorrow]), { start: 840, end: 1680, closed: false });
});

test('snapping and labels', () => {
  assert.equal(snapToCell(1094), 1080);
  assert.equal(snapToCell(1096), 1110);
  assert.equal(minutesLabel(1500), '01:00');
  assert.equal(minutesLabel(870), '14:30');
});

const items: BoardItem[] = [
  { id: 'a', station_id: 'pc-1', start: 1080, end: 1200 },
  { id: 'blk', station_id: 'pc-3', start: 1200, end: 1260 },
];

test('isFree honours half-open ranges and ignores the moving rows', () => {
  assert.equal(isFree(items, 'pc-1', 1200, 1260), true);
  assert.equal(isFree(items, 'pc-1', 1170, 1230), false);
  assert.equal(isFree(items, 'pc-1', 1170, 1230, new Set(['a'])), true);
});

const row = (id: string, station: string): MoveRow => ({
  id, station_id: station, start_time: '18:00:00', duration_minutes: 120, status: 'confirmed',
});

const base = {
  targetType: 'pc', draggedType: 'pc', targetActive: true, items, draggedStart: 1080,
};

test('dropping on a free station is fine, on a block is not', () => {
  const a = row('a', 'pc-1');
  assert.deepEqual(checkDrop({ ...base, dragged: a, group: [a], targetStationId: 'pc-2', shiftMinutes: 0 }), {
    ok: true, noop: false, movingIds: ['a'],
  });
  const onBlock = checkDrop({ ...base, dragged: a, group: [a], targetStationId: 'pc-3', shiftMinutes: 60 });
  assert.equal(onBlock.ok, false);
});

test('a booking can slide along its own row over where it was', () => {
  const a = row('a', 'pc-1');
  assert.equal(checkDrop({ ...base, dragged: a, group: [a], targetStationId: 'pc-1', shiftMinutes: 30 }).ok, true);
});

test('wrong type and out-of-service stations are refused', () => {
  const a = row('a', 'pc-1');
  assert.equal(checkDrop({ ...base, dragged: a, group: [a], targetStationId: 'ps-1', targetType: 'ps5', shiftMinutes: 0 }).ok, false);
  assert.equal(checkDrop({ ...base, dragged: a, group: [a], targetStationId: 'pc-9', targetActive: false, shiftMinutes: 0 }).ok, false);
});

test('a time shift checks every sibling at its new time', () => {
  const a = row('a', 'pc-1');
  const b = row('b', 'pc-3');
  const both: BoardItem[] = [...items, { id: 'b', station_id: 'pc-3', start: 1080, end: 1200 }];
  // pc-3 has a block at 20:00–21:00, so shifting the group by an hour hits it
  // through the sibling, not through the row being dragged.
  const r = checkDrop({ ...base, items: both, dragged: a, group: [a, b], targetStationId: 'pc-1', shiftMinutes: 60 });
  assert.equal(r.ok, false);
});
