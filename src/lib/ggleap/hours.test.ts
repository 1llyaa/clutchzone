import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  secondsToMinutes,
  sumRemainingSeconds,
  formatHours,
  checkRateLimit,
  readCache,
  writeCache,
  resetGgLeapState,
  isUserNotFound,
  RATE_LIMIT,
  CACHE_MAX,
} from './hours';

test('secondsToMinutes: zero and non-positive clamp to 0', () => {
  assert.equal(secondsToMinutes(0), 0);
  assert.equal(secondsToMinutes(-90), 0);
  assert.equal(secondsToMinutes(NaN), 0);
});

test('secondsToMinutes: seconds convert down, remainder floors', () => {
  assert.equal(secondsToMinutes(3600), 60);
  assert.equal(secondsToMinutes(5400), 90);
  assert.equal(secondsToMinutes(59), 0);
  assert.equal(secondsToMinutes(119), 1);
});

test('formatHours: under an hour shows minutes only', () => {
  assert.equal(formatHours(0, 'cs'), '0 min');
  assert.equal(formatHours(45, 'cs'), '45 min');
});

test('formatHours: whole hours drop the minutes part', () => {
  assert.equal(formatHours(60, 'cs'), '1 h');
  assert.equal(formatHours(120, 'en'), '2 h');
});

test('formatHours: mixed shows both parts', () => {
  assert.equal(formatHours(750, 'cs'), '12 h 30 min');
  assert.equal(formatHours(750, 'en'), '12 h 30 min');
});

test('formatHours: localised units', () => {
  assert.equal(formatHours(750, 'de'), '12 Std. 30 Min.');
  assert.equal(formatHours(750, 'ua'), '12 год 30 хв');
  assert.equal(formatHours(750, 'xx'), '12 h 30 min');
});

test('checkRateLimit: allows RATE_LIMIT calls then blocks', () => {
  resetGgLeapState();
  const now = 1_000_000;
  for (let i = 0; i < RATE_LIMIT; i++) {
    assert.equal(checkRateLimit('1.2.3.4', now), true, `call ${i + 1} should pass`);
  }
  assert.equal(checkRateLimit('1.2.3.4', now), false);
});

test('checkRateLimit: buckets are per key', () => {
  resetGgLeapState();
  const now = 1_000_000;
  for (let i = 0; i < RATE_LIMIT; i++) checkRateLimit('1.2.3.4', now);
  assert.equal(checkRateLimit('1.2.3.4', now), false);
  assert.equal(checkRateLimit('5.6.7.8', now), true);
});

test('checkRateLimit: window slides', () => {
  resetGgLeapState();
  const now = 1_000_000;
  for (let i = 0; i < RATE_LIMIT; i++) checkRateLimit('1.2.3.4', now);
  assert.equal(checkRateLimit('1.2.3.4', now + 59_999), false);
  assert.equal(checkRateLimit('1.2.3.4', now + 60_001), true);
});

test('cache: hit inside the TTL, miss after it', () => {
  resetGgLeapState();
  const now = 1_000_000;
  writeCache('nick', { status: 'ok', minutes: 90 }, now);
  assert.deepEqual(readCache('nick', now + 30_000), { status: 'ok', minutes: 90 });
  assert.equal(readCache('nick', now + 60_001), null);
});

test('cache: unknown key misses', () => {
  resetGgLeapState();
  assert.equal(readCache('nope', 1_000_000), null);
});

test('cache: evicts the oldest entry at the cap', () => {
  resetGgLeapState();
  const now = 1_000_000;
  for (let i = 0; i < CACHE_MAX; i++) writeCache(`nick-${i}`, { status: 'ok', minutes: i }, now);
  assert.deepEqual(readCache('nick-0', now), { status: 'ok', minutes: 0 });

  writeCache('overflow', { status: 'ok', minutes: 999 }, now);
  assert.equal(readCache('nick-0', now), null, 'oldest entry should be evicted');
  assert.deepEqual(readCache('overflow', now), { status: 'ok', minutes: 999 });
});

// ggLeap answers an unknown nickname with 400 + {"Error":"User not found."},
// not the 404 the status code alone would suggest. Verified live 2026-08-27.
test('isUserNotFound: 400 with "User not found." is a miss, not an outage', () => {
  assert.equal(isUserNotFound(400, '{"Error":"User not found.","CorrelationId":"abc"}'), true);
});

test('isUserNotFound: a plain 404 is a miss too', () => {
  assert.equal(isUserNotFound(404, ''), true);
});

test('isUserNotFound: other 400s are outages, not misses', () => {
  assert.equal(isUserNotFound(400, '{"Error":"Invalid request."}'), false);
  assert.equal(isUserNotFound(400, ''), false);
});

test('isUserNotFound: 500 and 401 are never misses', () => {
  assert.equal(isUserNotFound(500, '{"Error":"An error occurred. User not found."}'), false);
  assert.equal(isUserNotFound(401, ''), false);
});

// Remaining time lives in GamePasses, not in `User.TimeRemaining` (which reads 0
// even for an account with hours). Verified against the live API on 2026-08-28:
// account `1llya` held 5h + 10h unused plus 23m30s left of a 1h pass, and the
// club owner independently confirmed "23 min, then I was given 15 hours".
test('sumRemainingSeconds: real 1llya payload sums to 15h 23m', () => {
  const offers = [
    { Name: '5 Hours ', Seconds: 18000, SecondsUsed: 0 },
    { Name: '10 Hours', Seconds: 36000, SecondsUsed: 0 },
    { Name: '1 Free Hour ', Seconds: 3600, SecondsUsed: 2190 },
  ];
  assert.equal(sumRemainingSeconds(offers), 55410);
  assert.equal(secondsToMinutes(sumRemainingSeconds(offers)), 923);
  assert.equal(formatHours(923, 'cs'), '15 h 23 min');
});

test('sumRemainingSeconds: a fully consumed pass contributes nothing', () => {
  assert.equal(sumRemainingSeconds([{ Seconds: 28800, SecondsUsed: 28800 }]), 0);
});

test('sumRemainingSeconds: SecondsUsed may be absent', () => {
  assert.equal(sumRemainingSeconds([{ Seconds: 3600 }]), 3600);
});

test('sumRemainingSeconds: overuse never goes negative', () => {
  assert.equal(sumRemainingSeconds([{ Seconds: 3600, SecondsUsed: 5000 }]), 0);
});

test('sumRemainingSeconds: empty and malformed input is 0, not a throw', () => {
  assert.equal(sumRemainingSeconds([]), 0);
  assert.equal(sumRemainingSeconds(null), 0);
  assert.equal(sumRemainingSeconds('nope'), 0);
  assert.equal(sumRemainingSeconds([{ Seconds: 'x' }, {}, null]), 0);
});
