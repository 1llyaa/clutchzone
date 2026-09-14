import { createAdminClient } from '@/lib/supabase/admin';
import { createStripeClient } from '@/lib/stripe';
import { sendPaymentNudge } from '@/lib/email';

/**
 * How long after opening Checkout the nudge goes out.
 *
 * Fifteen minutes sits comfortably inside the real hold: the checkout route
 * opens the Stripe session at now + (hold + 1) minutes and pushes
 * hold_expires_at two minutes past that, so with the 30-minute Stripe floor
 * the slot survives until roughly minute 33. At minute 15 the session is still
 * open and the slot is still the customer's.
 */
export const NUDGE_DELAY_MINUTES = 15;

/** Cap per run, so one backlog cannot stall the request or fan out 500 Stripe calls. */
export const NUDGE_BATCH_LIMIT = 50;

/**
 * Whether a booking group is owed a nudge right now.
 *
 * Pure, so the eligibility rules are testable without a database and the SQL
 * filter and the in-process check provably agree — the same reason
 * shouldSendPaymentReceipt is extracted.
 */
export function isNudgeDue(b: {
  status: string;
  paymentStatus: string;
  paysWithCredit: boolean;
  checkoutStartedAt: string | null;
  holdExpiresAt: string | null;
  nudgeSentAt: string | null;
  now?: Date;
}): boolean {
  const now = b.now ?? new Date();

  // Already paid, cancelled, or promoted past `pending` — nothing to chase.
  if (b.status !== 'pending') return false;
  if (b.paymentStatus === 'paid') return false;
  // Banked hours are drawn down in person; no money was ever due.
  if (b.paysWithCredit) return false;
  // Send-once: the column is claimed before the mail goes out.
  if (b.nudgeSentAt) return false;
  // Booked before this feature shipped — no click time on record, so there is
  // no honest "held until" to quote.
  if (!b.checkoutStartedAt) return false;

  const dueAt = new Date(b.checkoutStartedAt).getTime() + NUDGE_DELAY_MINUTES * 60_000;
  if (now.getTime() < dueAt) return false;

  // Load-bearing. If a run lags — a deploy, a DB blip, a backlog — a booking
  // whose hold already lapsed must not be told "your slot is held until HH:MM"
  // about a slot that is already back on sale.
  if (!b.holdExpiresAt) return false;
  if (new Date(b.holdExpiresAt).getTime() <= now.getTime()) return false;

  return true;
}

/** Seam for the tests; production callers pass nothing. */
export interface NudgeDeps {
  admin?: ReturnType<typeof createAdminClient>;
  stripe?: Pick<ReturnType<typeof createStripeClient>, 'checkout'>;
  now?: Date;
}

export interface NudgeRunSummary {
  considered: number;
  sent: number;
  skipped: number;
}

interface NudgeRow {
  id: string;
  booking_group_id: string | null;
  reference: string;
  customer_name: string;
  customer_email: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  total_price: number;
  status: string;
  payment_status: string;
  pays_with_credit: boolean;
  checkout_started_at: string | null;
  hold_expires_at: string | null;
  payment_nudge_email_at: string | null;
  stripe_checkout_session_id: string | null;
  stations: { label: string } | { label: string }[] | null;
}

function stationLabelOf(row: NudgeRow): string | undefined {
  const s = row.stations;
  return Array.isArray(s) ? s[0]?.label : s?.label;
}

/**
 * Marks a group nudged without sending anything.
 *
 * Used when the Stripe session is no longer payable. Burning the column stops
 * the group being reconsidered every minute for the rest of its life.
 */
async function burnWithoutSending(
  admin: ReturnType<typeof createAdminClient>,
  groupId: string,
): Promise<void> {
  const { error } = await admin
    .from('bookings')
    .update({ payment_nudge_email_at: new Date().toISOString() })
    .eq('booking_group_id', groupId)
    .is('payment_nudge_email_at', null);
  if (error) {
    console.error(`Failed to burn payment nudge for booking group ${groupId}:`, error);
  }
}

/**
 * Finds abandoned checkouts past the nudge mark and mails each group once.
 *
 * Claim first, send second — exactly as sendPaymentReceiptOnce does. The
 * failure mode being defended against is a duplicate e-mail to a customer who
 * is mid-payment, and two overlapping cron runs are the obvious way to cause
 * one.
 */
export async function runPaymentNudgeBatch(
  limit = NUDGE_BATCH_LIMIT,
  // Injected only by the tests. The claim is a conditional UPDATE and the
  // send decision hangs off its result, so the one behaviour worth proving —
  // that a claim losing the race sends nothing — cannot be reached through the
  // pure predicate alone.
  deps: NudgeDeps = {},
): Promise<NudgeRunSummary> {
  const admin = deps.admin ?? createAdminClient();
  const now = deps.now ?? new Date();
  const dueBefore = new Date(now.getTime() - NUDGE_DELAY_MINUTES * 60_000).toISOString();

  const { data, error } = await admin
    .from('bookings')
    .select(
      'id, booking_group_id, reference, customer_name, customer_email, date, start_time, duration_minutes, total_price, status, payment_status, pays_with_credit, checkout_started_at, hold_expires_at, payment_nudge_email_at, stripe_checkout_session_id, stations(label)',
    )
    .eq('payment_method', 'online')
    .eq('status', 'pending')
    .neq('payment_status', 'paid')
    .eq('pays_with_credit', false)
    .not('stripe_checkout_session_id', 'is', null)
    .is('payment_nudge_email_at', null)
    .lte('checkout_started_at', dueBefore)
    .gt('hold_expires_at', now.toISOString())
    .order('checkout_started_at');

  if (error) {
    console.error('Payment nudge: eligible-booking read failed:', error);
    return { considered: 0, sent: 0, skipped: 0 };
  }

  const rows = (data ?? []) as unknown as NudgeRow[];

  // One mail per booking group, not per station row.
  const byGroup = new Map<string, NudgeRow[]>();
  for (const row of rows) {
    // booking_group_id has been written on every booking since migration 016,
    // and checkout_started_at only exists from migration 025 onward, so a row
    // without a group cannot be eligible. Skip rather than guess a key.
    if (!row.booking_group_id) continue;
    const list = byGroup.get(row.booking_group_id) ?? [];
    list.push(row);
    byGroup.set(row.booking_group_id, list);
  }

  const groups = [...byGroup.entries()].slice(0, limit);
  const summary: NudgeRunSummary = { considered: groups.length, sent: 0, skipped: 0 };

  const stripe = deps.stripe ?? createStripeClient();

  for (const [groupId, groupRows] of groups) {
    const first = groupRows[0];

    // The SQL filter and the predicate should never disagree, but the read and
    // the send are seconds apart and the predicate is the authority.
    if (
      !isNudgeDue({
        status: first.status,
        paymentStatus: first.payment_status,
        paysWithCredit: first.pays_with_credit,
        checkoutStartedAt: first.checkout_started_at,
        holdExpiresAt: first.hold_expires_at,
        nudgeSentAt: first.payment_nudge_email_at,
        now,
      })
    ) {
      summary.skipped++;
      continue;
    }

    let sessionUrl: string | null = null;
    let locale: string | undefined;

    try {
      const session = await stripe.checkout.sessions.retrieve(
        first.stripe_checkout_session_id!,
      );
      if (session.status !== 'open' || !session.url) {
        // Paid, expired, or gone. Nothing to link to.
        await burnWithoutSending(admin, groupId);
        summary.skipped++;
        continue;
      }
      sessionUrl = session.url;
      // The bookings table has no locale column and does not need one — the
      // language the customer checked out in is already in session metadata.
      locale = (session.metadata?.locale as string | undefined) ?? undefined;
    } catch (err) {
      // A Stripe outage must not burn the claim: leaving the column null means
      // the next run retries this group.
      console.error(`Payment nudge: could not retrieve session for group ${groupId}:`, err);
      summary.skipped++;
      continue;
    }

    const { data: claimed, error: claimErr } = await admin
      .from('bookings')
      .update({ payment_nudge_email_at: new Date().toISOString() })
      .eq('booking_group_id', groupId)
      .is('payment_nudge_email_at', null)
      .select('id');

    if (claimErr) {
      console.error(`Failed to claim payment nudge for booking group ${groupId}:`, claimErr);
      summary.skipped++;
      continue;
    }
    if (!claimed?.length) {
      // Another run took it between the read and the claim.
      summary.skipped++;
      continue;
    }

    const stationLabel = groupRows
      .map(stationLabelOf)
      .filter((l): l is string => Boolean(l))
      .join(', ');

    // total_price is stored per station (see api/bookings/route.ts) — sum the group.
    const amountDue = groupRows.reduce((sum, r) => sum + (r.total_price ?? 0), 0);

    // Fire-and-forget, like every other sender here: a mail failure must not
    // fail the cron run, and the claim already prevents a retry storm.
    sendPaymentNudge({
      reference: first.reference,
      stationLabel,
      customerName: first.customer_name,
      customerEmail: first.customer_email,
      date: first.date,
      startTime: first.start_time.slice(0, 5),
      durationMinutes: first.duration_minutes,
      amountDue,
      payUrl: sessionUrl,
      holdExpiresAt: first.hold_expires_at!,
      locale,
    }).catch(() => {});

    summary.sent++;
  }

  return summary;
}
