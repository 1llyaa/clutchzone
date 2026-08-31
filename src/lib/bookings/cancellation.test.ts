import assert from 'node:assert/strict';
import { test } from 'node:test';
import { minutesUntil, cancellationSettlementFor } from './cancellation';

const base = {
  withinFreeWindow: true,
  paid: true,
  paysWithCredit: false,
  isPass: false,
  creditHours: 4,
  totalPrice: 215,
};

test('credit is owed for a paid booking cancelled inside the free window', () => {
  assert.deepEqual(cancellationSettlementFor(base), { kind: 'credit', hours: 4 });
});

test('an unpaid "zaplatím v klubu" booking earns nothing — no money ever came in', () => {
  assert.deepEqual(cancellationSettlementFor({ ...base, paid: false }), { kind: 'none' });
});

test('an abandoned online checkout earns nothing either', () => {
  // Same unpaid state as onsite: the row exists, Stripe never confirmed.
  assert.deepEqual(cancellationSettlementFor({ ...base, paid: false, creditHours: 10 }), {
    kind: 'none',
  });
});

test('paying with banked hours returns nothing — they come off only when played', () => {
  assert.deepEqual(cancellationSettlementFor({ ...base, paysWithCredit: true }), { kind: 'none' });
});

test('a late cancel forfeits even when fully paid (VOP §3.4.2)', () => {
  assert.deepEqual(cancellationSettlementFor({ ...base, withinFreeWindow: false }), {
    kind: 'none',
  });
});

test('unpaid AND late still forfeits', () => {
  assert.deepEqual(
    cancellationSettlementFor({ ...base, paid: false, withinFreeWindow: false }),
    { kind: 'none' },
  );
});

test('an offer that banks no hours yields no credit line', () => {
  assert.deepEqual(cancellationSettlementFor({ ...base, creditHours: 0 }), {
    kind: 'credit',
    hours: 0,
  });
});

test('a paid pass is settled in money, not hours — it banks nothing to give back', () => {
  // Happy Hours: flat 165 Kč for the 14:00–17:00 window, credit_hours null.
  // This used to fall through to a zero credit line, so the customer paid and
  // got nothing despite cancelling in time, against VOP §3.4.1.
  assert.deepEqual(
    cancellationSettlementFor({ ...base, isPass: true, creditHours: 0, totalPrice: 165 }),
    { kind: 'refund', amount: 165 },
  );
});

test('a pass cancelled late forfeits like anything else', () => {
  assert.deepEqual(
    cancellationSettlementFor({ ...base, isPass: true, creditHours: 0, withinFreeWindow: false }),
    { kind: 'none' },
  );
});

test('an unpaid pass owes nothing back', () => {
  assert.deepEqual(
    cancellationSettlementFor({ ...base, isPass: true, creditHours: 0, paid: false }),
    { kind: 'none' },
  );
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
