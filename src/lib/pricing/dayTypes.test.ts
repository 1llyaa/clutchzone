import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveDayTypes } from './dayTypes';
import { openingHoursFixture, timePassesFixture } from './fixtures';

test('dayTypes: current data collapses into 4 groups (Po closed)', () => {
  const groups = deriveDayTypes(openingHoursFixture, timePassesFixture);
  assert.equal(groups.length, 4);
});

test('dayTypes: Tue–Thu share a signature and merge into one range label', () => {
  const groups = deriveDayTypes(openingHoursFixture, timePassesFixture);
  const tueThu = groups.find((g) => g.days.includes(2));
  assert.ok(tueThu);
  assert.deepEqual([...tueThu!.days].sort(), [2, 3, 4]);
  assert.equal(tueThu!.label, 'ÚT–ČT');
});

test('dayTypes: Friday is its own group (different close time + pass set than Sat)', () => {
  const groups = deriveDayTypes(openingHoursFixture, timePassesFixture);
  const fri = groups.find((g) => g.days.includes(5));
  assert.ok(fri);
  assert.deepEqual(fri!.days, [5]);
  assert.equal(fri!.label, 'PÁ');
  assert.ok(fri!.passIds.includes('happy-hours'));
  assert.ok(fri!.passIds.includes('weekend-pass'));
  assert.ok(!fri!.passIds.includes('evening-pass'));
});

test('dayTypes: Saturday only carries the weekend pass', () => {
  const groups = deriveDayTypes(openingHoursFixture, timePassesFixture);
  const sat = groups.find((g) => g.days.includes(6));
  assert.ok(sat);
  assert.deepEqual(sat!.days, [6]);
  assert.equal(sat!.label, 'SO');
  assert.deepEqual(sat!.passIds, ['weekend-pass']);
});

test('dayTypes: Sunday only carries the evening pass', () => {
  const groups = deriveDayTypes(openingHoursFixture, timePassesFixture);
  const sun = groups.find((g) => g.days.includes(0));
  assert.ok(sun);
  assert.deepEqual(sun!.days, [0]);
  assert.equal(sun!.label, 'NE');
  assert.deepEqual(sun!.passIds, ['evening-pass']);
});

test('dayTypes: Monday (closed) never appears', () => {
  const groups = deriveDayTypes(openingHoursFixture, timePassesFixture);
  assert.ok(!groups.some((g) => g.days.includes(1)));
});
