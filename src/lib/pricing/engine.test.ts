import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveDayTypes } from './dayTypes';
import { buildOffers, cheapestCombo, rankOffers } from './engine';
import { buildFixtureConfig, hourTiersFixture, openingHoursFixture, timePassesFixture } from './fixtures';
import type { CalcInput } from './types';

const config = buildFixtureConfig();
const groups = deriveDayTypes(openingHoursFixture, timePassesFixture);
const TUE_THU = groups.find((g) => g.days.includes(2))!.key;
const FRI = groups.find((g) => g.days.includes(5))!.key;

const pcTiers = hourTiersFixture.filter((t) => t.stationType === 'pc');
const ps5Tiers = hourTiersFixture.filter((t) => t.stationType === 'ps5');

// spec §3.2 — PC cheapest combo table
test('cheapestCombo: PC table matches spec §3.2', () => {
  const expected: Record<number, number> = {
    1: 75, 2: 150, 3: 215, 4: 290, 5: 345, 6: 420, 7: 475, 8: 550, 9: 625, 10: 660,
  };
  for (const [hours, amount] of Object.entries(expected)) {
    const combo = cheapestCombo(pcTiers, Number(hours));
    assert.ok(combo, `no combo for ${hours}h`);
    assert.equal(combo!.totalHours, Number(hours));
    assert.equal(combo!.amount, amount, `${hours}h should cost ${amount}`);
  }
});

// spec §3.2 — PS5 cheapest combo table, esp. 6h = 3h+3h (660) beating 5h+1h (680)
test('cheapestCombo: PS5 table matches spec §3.2, 6h picks 3+3 not 5+1', () => {
  const expected: Record<number, number> = { 1: 120, 2: 240, 3: 330, 4: 450, 5: 560, 6: 660 };
  for (const [hours, amount] of Object.entries(expected)) {
    const combo = cheapestCombo(ps5Tiers, Number(hours));
    assert.ok(combo);
    assert.equal(combo!.totalHours, Number(hours));
    assert.equal(combo!.amount, amount);
  }
  const six = cheapestCombo(ps5Tiers, 6)!;
  assert.deepEqual(
    six.breakdown.map((b) => b.label).sort(),
    ['3H'],
  );
  assert.equal(six.breakdown[0].qty, 2);
});

test('hours_upsell: 9h offers 10h for +35 Kč (delta/hour 35 < 75)', () => {
  const input: CalcInput = { stationType: 'pc', dayTypeKey: TUE_THU, startHour: 20, durationHours: 9, stationsCount: 1 };
  const offers = buildOffers(input, config);
  const upsell = offers.find((o) => o.kind === 'hours_upsell');
  assert.ok(upsell, 'expected a 10h upsell offer');
  assert.equal(upsell!.hoursCovered, 10);
  assert.equal(upsell!.totalAmount, 660);
});

// spec §3.2 — pass scenarios (PC)
test('pass: ÚT 14:00 3h → Happy Hours 165, savings 60 vs 3×1h', () => {
  const input: CalcInput = { stationType: 'pc', dayTypeKey: TUE_THU, startHour: 14, durationHours: 3, stationsCount: 1 };
  const result = rankOffers(buildOffers(input, config))!;
  assert.equal(result.recommended.kind, 'pass');
  assert.equal(result.recommended.passId, 'happy-hours');
  assert.equal(result.recommended.totalAmount, 165);
  assert.equal(result.recommended.savingsVsHourly, 60);
});

test('pass: ÚT 14:00 2h → hours 150 recommended, Happy Hours 165 survives as +1h alt', () => {
  const input: CalcInput = { stationType: 'pc', dayTypeKey: TUE_THU, startHour: 14, durationHours: 2, stationsCount: 1 };
  const result = rankOffers(buildOffers(input, config))!;
  assert.equal(result.recommended.kind, 'hours');
  assert.equal(result.recommended.totalAmount, 150);
  const hh = result.alternatives.find((o) => o.passId === 'happy-hours');
  assert.ok(hh, 'Happy Hours should survive the dominance filter (gives +1h)');
  assert.equal(hh!.totalAmount, 165);
  assert.equal(hh!.hoursCovered, 3);
});

test('pass: ÚT 16:00 1h → hours 75 recommended, Happy Hours dominated and filtered out', () => {
  const input: CalcInput = { stationType: 'pc', dayTypeKey: TUE_THU, startHour: 16, durationHours: 1, stationsCount: 1 };
  const result = rankOffers(buildOffers(input, config))!;
  assert.equal(result.recommended.totalAmount, 75);
  assert.ok(!result.all.some((o) => o.passId === 'happy-hours'), 'dominated Happy Hours must not survive');
});

test('pass: ÚT 14:00 5h → hours 345, Happy Hours not offered at all (does not cover 5h)', () => {
  const input: CalcInput = { stationType: 'pc', dayTypeKey: TUE_THU, startHour: 14, durationHours: 5, stationsCount: 1 };
  const offers = buildOffers(input, config);
  assert.ok(!offers.some((o) => o.passId === 'happy-hours'));
  const result = rankOffers(offers)!;
  assert.equal(result.recommended.totalAmount, 345);
});

test('pass: ÚT 19:00 5h → Evening Pass 285, savings 90 vs 5×1h', () => {
  const input: CalcInput = { stationType: 'pc', dayTypeKey: TUE_THU, startHour: 19, durationHours: 5, stationsCount: 1 };
  const result = rankOffers(buildOffers(input, config))!;
  assert.equal(result.recommended.passId, 'evening-pass');
  assert.equal(result.recommended.totalAmount, 285);
  assert.equal(result.recommended.savingsVsHourly, 90);
});

test('pass: PÁ 22:00 5h → Weekend Pass wins outright and covers 6h (better than the 345 Kč 5h credit)', () => {
  const input: CalcInput = { stationType: 'pc', dayTypeKey: FRI, startHour: 22, durationHours: 5, stationsCount: 1 };
  const result = rankOffers(buildOffers(input, config))!;
  assert.equal(result.recommended.passId, 'weekend-pass');
  assert.equal(result.recommended.totalAmount, 340);
  assert.equal(result.recommended.hoursCovered, 6);
});

test('stationsCount multiplies pass and hours prices linearly', () => {
  const input: CalcInput = { stationType: 'pc', dayTypeKey: TUE_THU, startHour: 14, durationHours: 3, stationsCount: 2 };
  const result = rankOffers(buildOffers(input, config))!;
  assert.equal(result.recommended.totalAmount, 330); // 165 * 2
  assert.equal(result.recommended.amountPerStation, 165);
});

test('overflow past closing time is never blocked — hours become credit', () => {
  // Tue–Thu closes at 24:00; asking for 8h from 20:00 only fits 4h today.
  const input: CalcInput = { stationType: 'pc', dayTypeKey: TUE_THU, startHour: 20, durationHours: 8, stationsCount: 1 };
  const result = rankOffers(buildOffers(input, config))!;
  assert.equal(result.recommended.kind, 'hours');
  assert.equal(result.recommended.fitsClosingTime, false);
  assert.equal(result.recommended.hoursCovered, 8);
});
