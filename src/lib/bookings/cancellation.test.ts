import assert from 'node:assert/strict';
import { test } from 'node:test';
import { minutesUntil, creditHoursOwedFor } from './cancellation';

const base = { withinFreeWindow: true, paid: true, paysWithCredit: false, creditHours: 4 };

test('credit is owed for a paid booking cancelled inside the free window', () => {
  assert.equal(creditHoursOwedFor(base), 4);
});

test('an unpaid "zaplatím v klubu" booking earns nothing — no money ever came in', () => {
  assert.equal(creditHoursOwedFor({ ...base, paid: false }), 0);
});

test('an abandoned online checkout earns nothing either', () => {
  // Same unpaid state as onsite: the row exists, Stripe never confirmed.
  assert.equal(creditHoursOwedFor({ ...base, paid: false, creditHours: 10 }), 0);
});

test('paying with banked hours returns nothing — they come off only when played', () => {
  assert.equal(creditHoursOwedFor({ ...base, paysWithCredit: true }), 0);
});

test('a late cancel forfeits even when fully paid (VOP §3.4.2)', () => {
  assert.equal(creditHoursOwedFor({ ...base, withinFreeWindow: false }), 0);
});

test('unpaid AND late still forfeits, without going negative', () => {
  assert.equal(creditHoursOwedFor({ ...base, paid: false, withinFreeWindow: false }), 0);
});

test('a paid booking with no banked hours owes nothing to give back', () => {
  assert.equal(creditHoursOwedFor({ ...base, creditHours: 0 }), 0);
});

// Bookings store a naive local date + time and the club is in Europe/Prague,
// so these all pin `now` to a real UTC instant and assert the Prague-local
// difference — the test must not depend on the machine's timezone.

test('counts minutes forward to a booking later today', () => {
  // 2026-07-01 12:00 UTC = 14:00 Prague (CEST, UTC+2)
  const now = new Date('2026-07-01T12:00:00Z');
  assert.equal(minutesUntil('2026-07-01', '15:00', now), 60);
  assert.equal(minutesUntil('2026-07-01', '14:30', now), 30);
});

test('goes negative once the start time has passed', () => {
  const now = new Date('2026-07-01T12:00:00Z'); // 14:00 Prague
  assert.equal(minutesUntil('2026-07-01', '13:00', now), -60);
});

test('handles winter time (CET, UTC+1)', () => {
  // 2026-01-15 12:00 UTC = 13:00 Prague
  const now = new Date('2026-01-15T12:00:00Z');
  assert.equal(minutesUntil('2026-01-15', '14:00', now), 60);
});

test('after-midnight slots stored as 24:00+ roll into the next day', () => {
  // 2026-07-01 21:00 UTC = 23:00 Prague; a '25:00' slot is 01:00 the next day.
  const now = new Date('2026-07-01T21:00:00Z');
  assert.equal(minutesUntil('2026-07-01', '25:00', now), 120);
});

test('spans across dates', () => {
  const now = new Date('2026-07-01T12:00:00Z'); // 14:00 Prague
  assert.equal(minutesUntil('2026-07-02', '14:00', now), 1440);
});

test('the 15-minute free-cancellation boundary lands where expected', () => {
  const now = new Date('2026-07-01T12:00:00Z'); // 14:00 Prague
  // Exactly 15 minutes out is NOT inside the free window (`> windowMinutes`).
  assert.equal(minutesUntil('2026-07-01', '14:15', now), 15);
  assert.equal(minutesUntil('2026-07-01', '14:16', now), 16);
});
