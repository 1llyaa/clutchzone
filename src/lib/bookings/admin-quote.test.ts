import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adminQuote } from './admin-quote';
import { buildFixtureConfig } from '@/lib/pricing/fixtures';

const config = buildFixtureConfig();
// 2026-10-06 is a Tuesday, 2026-10-05 a Monday (closed in the fixture).
const base = { date: '2026-10-06', startMinutes: 18 * 60, stationType: 'pc' as const, stationsCount: 1 };

test('a whole-hour booking gets the engine price', () => {
  const q = adminQuote(config, { ...base, durationMinutes: 120 });
  assert.equal(q?.amountPerStation, 150);
});

test('a half hour rounds up to the next whole hour', () => {
  const q = adminQuote(config, { ...base, durationMinutes: 90 });
  assert.equal(q?.amountPerStation, 150);
});

test('a half-hour start is priced from the hour it falls in', () => {
  const q = adminQuote(config, { ...base, startMinutes: 18 * 60 + 30, durationMinutes: 60 });
  assert.equal(q?.amountPerStation, 75);
});

test('a closed day has no price to suggest', () => {
  assert.equal(adminQuote(config, { ...base, date: '2026-10-05', durationMinutes: 60 }), null);
});
