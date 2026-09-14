import assert from 'node:assert/strict';
import { test } from 'node:test';
import { occupiedStationIds, parseTimeToMinutes, rangesOverlap } from './occupancy';

test('a time parses to minutes from midnight, with or without seconds', () => {
  assert.equal(parseTimeToMinutes('00:00'), 0);
  assert.equal(parseTimeToMinutes('14:30'), 870);
  // Postgres `time` comes back as HH:MM:SS over PostgREST.
  assert.equal(parseTimeToMinutes('14:30:00'), 870);
});

test('touching intervals do not overlap', () => {
  // [10:00, 11:00) and [11:00, 12:00). The '[)' bound on
  // bookings_no_overlap says these are fine, so this must agree — otherwise
  // back-to-back bookings would be refused in JS and accepted by the DB.
  assert.equal(rangesOverlap(600, 660, 660, 720), false);
  assert.equal(rangesOverlap(660, 720, 600, 660), false);
});

test('a partial overlap at either end counts as overlap', () => {
  // Other starts inside ours and runs past the end.
  assert.equal(rangesOverlap(600, 660, 630, 690), true);
  // Other starts before ours and ends inside it.
  assert.equal(rangesOverlap(600, 660, 570, 630), true);
});

test('full containment either way counts as overlap', () => {
  // Ours inside theirs.
  assert.equal(rangesOverlap(610, 650, 600, 660), true);
  // Theirs inside ours.
  assert.equal(rangesOverlap(600, 660, 610, 650), true);
});

test('a duration running past midnight still overlaps correctly', () => {
  // A weekend pass 22:00–04:00 is 1320 → 1680 minutes: the minutes keep
  // counting past 1440 rather than wrapping, exactly as the DB's
  // (date + start_time) + interval does. A 23:00–01:00 window must clash.
  assert.equal(rangesOverlap(1380, 1500, 1320, 1680), true);
  // And a window the following afternoon, well clear of it, must not.
  assert.equal(rangesOverlap(1860, 1920, 1320, 1680), false);
});

// ─── occupiedStationIds over a stubbed PostgREST client ──────────────────────

type Row = { station_id: string; start_time: string; duration_minutes: number };

/**
 * Minimal stand-in for the PostgREST query builder: every filter returns
 * `this`, and awaiting the chain yields the rows for that table. Enough to
 * prove the two reads are unioned; the filters themselves are the DB's job.
 */
function stubAdmin(tables: { bookings?: Row[]; station_blocks?: Row[] }) {
  return {
    from(table: string) {
      const rows = tables[table as keyof typeof tables] ?? [];
      const builder = {
        select: () => builder,
        in: () => builder,
        neq: () => builder,
        eq: () => builder,
        then: (resolve: (r: { data: Row[]; error: null }) => unknown) =>
          resolve({ data: rows, error: null }),
      };
      return builder;
    },
  } as never;
}

const WINDOW = { date: '2026-09-14', stationIds: ['pc-1', 'pc-2'], startMinutes: 840, endMinutes: 900 };

test('a live booking occupies its station', async () => {
  const occupied = await occupiedStationIds(
    stubAdmin({ bookings: [{ station_id: 'pc-1', start_time: '14:00:00', duration_minutes: 60 }] }),
    WINDOW,
  );
  assert.deepEqual([...occupied], ['pc-1']);
});

test('a block removes its station from the available set', async () => {
  // The whole point of the feature: a block with no booking behind it still
  // has to take the station out of circulation.
  const occupied = await occupiedStationIds(
    stubAdmin({ station_blocks: [{ station_id: 'pc-2', start_time: '14:00:00', duration_minutes: 30 }] }),
    WINDOW,
  );
  assert.deepEqual([...occupied], ['pc-2']);
});

test('bookings and blocks are unioned, not chosen between', async () => {
  const occupied = await occupiedStationIds(
    stubAdmin({
      bookings:       [{ station_id: 'pc-1', start_time: '14:00:00', duration_minutes: 60 }],
      station_blocks: [{ station_id: 'pc-2', start_time: '14:30:00', duration_minutes: 60 }],
    }),
    WINDOW,
  );
  assert.deepEqual([...occupied].sort(), ['pc-1', 'pc-2']);
});

test('a cancelled booking does not occupy', async () => {
  // The `.neq('status', 'cancelled')` filter is applied server-side, so the
  // row never reaches us — the stub models that by returning no rows.
  const occupied = await occupiedStationIds(stubAdmin({ bookings: [] }), WINDOW);
  assert.equal(occupied.size, 0);
});

test('a booking outside the window leaves the station free', async () => {
  const occupied = await occupiedStationIds(
    stubAdmin({ bookings: [{ station_id: 'pc-1', start_time: '15:00:00', duration_minutes: 60 }] }),
    WINDOW,
  );
  assert.equal(occupied.size, 0);
});

test('no stations asked for means no queries and no occupancy', async () => {
  const occupied = await occupiedStationIds(stubAdmin({}), { ...WINDOW, stationIds: [] });
  assert.equal(occupied.size, 0);
});
