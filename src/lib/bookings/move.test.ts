import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planMove, type MoveRow } from './move';

const row = (id: string, station: string, status = 'confirmed'): MoveRow => ({
  id,
  station_id: station,
  start_time: '18:00:00',
  duration_minutes: 120,
  status,
});

test('nothing changes means nothing to do', () => {
  const r = row('a', 'pc-1');
  assert.equal(planMove(r, [r], 'pc-1', 0), 'noop');
});

test('a station change moves only the dragged row', () => {
  const a = row('a', 'pc-1');
  const b = row('b', 'pc-2');
  assert.deepEqual(planMove(a, [a, b], 'pc-5', 0), {
    movingIds: ['a'],
    targetStationIds: ['pc-5'],
    startMinutes: 1080,
    endMinutes: 1200,
  });
});

test('a time shift moves the whole group, each row on its own station', () => {
  const a = row('a', 'pc-1');
  const b = row('b', 'pc-2');
  assert.deepEqual(planMove(a, [a, b], 'pc-1', 60), {
    movingIds: ['a', 'b'],
    targetStationIds: ['pc-1', 'pc-2'],
    startMinutes: 1140,
    endMinutes: 1260,
  });
});

test('a shift plus a station change moves the dragged row to the new station', () => {
  const a = row('a', 'pc-1');
  const b = row('b', 'pc-2');
  const plan = planMove(a, [a, b], 'pc-7', -30);
  assert.notEqual(typeof plan, 'string');
  assert.deepEqual((plan as Exclude<typeof plan, string>).targetStationIds, ['pc-7', 'pc-2']);
});

test('a shifted drag onto a sibling station is refused before the DB sees it', () => {
  const a = row('a', 'pc-1');
  const b = row('b', 'pc-2');
  assert.equal(planMove(a, [a, b], 'pc-2', 60), 'onto-sibling');
});

test('cancelled siblings stay where they are', () => {
  const a = row('a', 'pc-1');
  const b = row('b', 'pc-2', 'cancelled');
  const plan = planMove(a, [a, b], 'pc-2', 60);
  assert.notEqual(plan, 'onto-sibling');
  assert.deepEqual((plan as Exclude<typeof plan, string>).movingIds, ['a']);
});

test('a shift past midnight keeps counting on the same axis', () => {
  const a = { ...row('a', 'pc-1'), start_time: '23:00:00' };
  const plan = planMove(a, [a], 'pc-1', 120);
  assert.deepEqual(plan, { movingIds: ['a'], targetStationIds: ['pc-1'], startMinutes: 1500, endMinutes: 1620 });
});
