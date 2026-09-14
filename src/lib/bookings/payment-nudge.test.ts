import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isNudgeDue, NUDGE_DELAY_MINUTES, runPaymentNudgeBatch } from './payment-nudge';

const NOW = new Date('2026-09-14T18:00:00.000Z');

/** Minutes before NOW, as an ISO string. */
function minutesAgo(n: number): string {
  return new Date(NOW.getTime() - n * 60_000).toISOString();
}
/** Minutes after NOW, as an ISO string. */
function minutesFromNow(n: number): string {
  return new Date(NOW.getTime() + n * 60_000).toISOString();
}

/** A card booking sitting on an abandoned checkout, past the nudge mark. */
function dueBooking(overrides: Partial<Parameters<typeof isNudgeDue>[0]> = {}) {
  return {
    status: 'pending',
    paymentStatus: 'unpaid',
    paysWithCredit: false,
    checkoutStartedAt: minutesAgo(NUDGE_DELAY_MINUTES),
    // Real release is ~33 minutes after the click, so at minute 15 there are
    // still ~18 minutes of hold left.
    holdExpiresAt: minutesFromNow(18),
    nudgeSentAt: null,
    now: NOW,
    ...overrides,
  };
}

test('at the 15-minute mark with a live hold, the nudge is due', () => {
  assert.equal(isNudgeDue(dueBooking()), true);
});

test('under 15 minutes is not due yet', () => {
  assert.equal(isNudgeDue(dueBooking({ checkoutStartedAt: minutesAgo(14) })), false);
});

test('well past 15 minutes is still due while the hold is live', () => {
  assert.equal(isNudgeDue(dueBooking({ checkoutStartedAt: minutesAgo(25) })), true);
});

test('a hold that already lapsed gets no nudge', () => {
  // The load-bearing case. If a run lags, the slot is already back on sale and
  // "we are holding your spot until HH:MM" would be a lie.
  assert.equal(isNudgeDue(dueBooking({ holdExpiresAt: minutesAgo(1) })), false);
});

test('a hold expiring exactly now gets no nudge', () => {
  assert.equal(isNudgeDue(dueBooking({ holdExpiresAt: NOW.toISOString() })), false);
});

test('a booking with no hold at all gets no nudge', () => {
  assert.equal(isNudgeDue(dueBooking({ holdExpiresAt: null })), false);
});

test('an already paid booking gets no nudge', () => {
  assert.equal(isNudgeDue(dueBooking({ paymentStatus: 'paid' })), false);
});

test('a cancelled booking gets no nudge', () => {
  assert.equal(isNudgeDue(dueBooking({ status: 'cancelled' })), false);
});

test('a confirmed booking gets no nudge', () => {
  // The webhook promotes pending → confirmed on payment; chasing one would
  // mean asking a paying customer to pay again.
  assert.equal(isNudgeDue(dueBooking({ status: 'confirmed' })), false);
});

test('a booking paid with banked hours gets no nudge', () => {
  // Hours come off the ggLeap account for time played — nothing was ever due.
  assert.equal(isNudgeDue(dueBooking({ paysWithCredit: true })), false);
});

test('a booking already nudged is never nudged again', () => {
  assert.equal(isNudgeDue(dueBooking({ nudgeSentAt: minutesAgo(1) })), false);
});

test('a booking predating the migration has no click time and gets no nudge', () => {
  // checkout_started_at is nullable with no backfill on purpose: there is no
  // honest due-time for a booking whose session opened before this shipped.
  assert.equal(isNudgeDue(dueBooking({ checkoutStartedAt: null })), false);
});

// ─── the claim race ──────────────────────────────────────────────────────────

/**
 * Stub PostgREST client over a single eligible booking group.
 *
 * `claimReturns` is what the conditional UPDATE hands back: a row when this
 * run won the claim, nothing when a concurrent run already took it.
 */
function stubAdmin(claimReturns: { id: string }[]) {
  const row = {
    id: 'b1',
    booking_group_id: 'g1',
    reference: 'CZ-TEST',
    customer_name: 'Jan Novák',
    customer_email: 'jan@example.com',
    date: '2026-09-14',
    start_time: '20:00:00',
    duration_minutes: 120,
    total_price: 300,
    status: 'pending',
    payment_status: 'unpaid',
    pays_with_credit: false,
    checkout_started_at: minutesAgo(NUDGE_DELAY_MINUTES),
    hold_expires_at: minutesFromNow(18),
    payment_nudge_email_at: null,
    stripe_checkout_session_id: 'cs_test_1',
    stations: { label: 'PC-03' },
  };

  const reads = { count: 0 };

  return {
    client: {
      from() {
        const select = {
          eq: () => select, neq: () => select, not: () => select,
          is: () => select, lte: () => select, gt: () => select,
          order: () => select,
          then: (resolve: (r: unknown) => unknown) => {
            reads.count++;
            return resolve({ data: [row], error: null });
          },
        };
        const update = {
          eq: () => update,
          is: () => update,
          select: () => Promise.resolve({ data: claimReturns, error: null }),
          then: (resolve: (r: unknown) => unknown) => resolve({ error: null }),
        };
        return { select: () => select, update: () => update };
      },
    } as never,
    reads,
  };
}

const openSession = {
  checkout: {
    sessions: {
      retrieve: async () => ({
        status: 'open',
        url: 'https://checkout.stripe.com/c/pay/cs_test_1',
        metadata: { locale: 'cs' },
      }),
    },
  },
} as never;

test('a group whose claim wins is counted as sent', async () => {
  const { client } = stubAdmin([{ id: 'b1' }]);
  const summary = await runPaymentNudgeBatch(50, { admin: client, stripe: openSession, now: NOW });
  assert.deepEqual(summary, { considered: 1, sent: 1, skipped: 0 });
});

test('a claim that loses the race sends nothing', async () => {
  // Two cron runs can overlap — a slow run and the next minute's. The claim is
  // a conditional UPDATE precisely so the loser mails nobody, rather than the
  // customer getting the same nudge twice.
  const { client } = stubAdmin([]);
  const summary = await runPaymentNudgeBatch(50, { admin: client, stripe: openSession, now: NOW });
  assert.deepEqual(summary, { considered: 1, sent: 0, skipped: 1 });
});

test('a session that is no longer open is burned, not mailed', async () => {
  // Paid, expired or gone. Stamping it anyway stops the group being
  // reconsidered every minute for the rest of its life.
  const closedSession = {
    checkout: { sessions: { retrieve: async () => ({ status: 'expired', url: null, metadata: {} }) } },
  } as never;
  const { client } = stubAdmin([{ id: 'b1' }]);
  const summary = await runPaymentNudgeBatch(50, { admin: client, stripe: closedSession, now: NOW });
  assert.deepEqual(summary, { considered: 1, sent: 0, skipped: 1 });
});

test('a Stripe outage leaves the claim alone so the next run retries', async () => {
  const brokenStripe = {
    checkout: { sessions: { retrieve: async () => { throw new Error('stripe down'); } } },
  } as never;
  const { client } = stubAdmin([{ id: 'b1' }]);
  const summary = await runPaymentNudgeBatch(50, { admin: client, stripe: brokenStripe, now: NOW });
  assert.deepEqual(summary, { considered: 1, sent: 0, skipped: 1 });
});
