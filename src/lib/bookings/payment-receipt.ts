import { createAdminClient } from '@/lib/supabase/admin';
import { sendBookingPaymentReceipt, sendBookingNotification } from '@/lib/email';
import { buildCancelUrl } from '@/lib/cancel-token';
import { getCancellationWindowMinutes } from '@/lib/bookings/cancellation';

/**
 * Whether a payment receipt is owed at all.
 *
 * Two payment paths can reach `paid` — the Stripe webhook and staff marking an
 * on-site payment — and neither should produce a receipt when no money moved.
 * Kept pure so both callers provably agree.
 */
export function shouldSendPaymentReceipt(booking: {
  paid: boolean;
  paysWithCredit: boolean;
}): boolean {
  if (!booking.paid) return false;
  // Banked ggLeap hours are drawn down in person against time actually played.
  // Nothing was charged, so there is nothing to receipt.
  if (booking.paysWithCredit) return false;
  return true;
}

type ReceiptOutcome = 'sent' | 'not-owed' | 'already-sent' | 'not-found';

/**
 * Sends the payment receipt for a booking group at most once, ever.
 *
 * The claim is a conditional UPDATE rather than a read-then-write: Stripe
 * retries webhooks, and staff can toggle a booking paid → unpaid → paid, so a
 * non-atomic guard would mail the customer several times for one payment.
 *
 * `notifyAdmin` covers online bookings, whose staff notification is deliberately
 * withheld at creation time — an unpaid hold may lapse within the half hour, so
 * it is announced here instead, once the money is real.
 */
export async function sendPaymentReceiptOnce(
  groupId: string,
  opts: { locale?: string; notifyAdmin?: boolean } = {},
): Promise<ReceiptOutcome> {
  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from('bookings')
    .select(
      'reference, customer_name, customer_email, customer_phone, clutchzone_account, date, start_time, duration_minutes, total_price, credit_hours, pays_with_credit, payment_status, payment_method, stations(label)',
    )
    .eq('booking_group_id', groupId);

  if (error || !rows?.length) {
    console.error(`Payment receipt skipped — booking group ${groupId} not readable:`, error);
    return 'not-found';
  }

  const first = rows[0] as unknown as {
    reference: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    clutchzone_account: string | null;
    date: string;
    start_time: string;
    duration_minutes: number;
    pays_with_credit: boolean;
    payment_status: string;
    payment_method: string;
  };

  if (
    !shouldSendPaymentReceipt({
      paid: first.payment_status === 'paid',
      paysWithCredit: first.pays_with_credit,
    })
  ) {
    return 'not-owed';
  }

  // Claim first, send second. If the claim comes back empty another delivery of
  // the same payment already took it.
  const { data: claimed, error: claimErr } = await admin
    .from('bookings')
    .update({ payment_confirmed_email_at: new Date().toISOString() })
    .eq('booking_group_id', groupId)
    .is('payment_confirmed_email_at', null)
    .select('id');

  if (claimErr) {
    console.error(`Failed to claim payment receipt for booking group ${groupId}:`, claimErr);
    return 'not-found';
  }
  if (!claimed?.length) return 'already-sent';

  const stationLabels = rows
    .map((r) => {
      const s = (r as unknown as { stations: { label: string } | { label: string }[] | null }).stations;
      return Array.isArray(s) ? s[0]?.label : s?.label;
    })
    .filter((l): l is string => Boolean(l));
  const stationLabel = stationLabels.join(', ');

  // total_price is stored per station (see api/bookings/route.ts) — sum the group.
  const amountPaid = rows.reduce(
    (sum, r) => sum + ((r as { total_price: number }).total_price ?? 0),
    0,
  );

  let cancelUrl: string | null = null;
  try {
    cancelUrl = await buildCancelUrl(opts.locale ?? 'cs', groupId);
  } catch (err) {
    // Same tolerance as the confirmation email: an unsigned link must not stop
    // the receipt, which is the part with legal weight.
    console.error('Cancellation link not signed for payment receipt:', err);
  }
  const cancellationWindowMinutes = await getCancellationWindowMinutes();

  await sendBookingPaymentReceipt({
    reference: first.reference,
    stationLabel,
    customerName: first.customer_name,
    customerEmail: first.customer_email,
    date: first.date,
    startTime: first.start_time,
    durationMinutes: first.duration_minutes,
    amountPaid,
    paidVia: first.payment_method === 'online' ? 'card' : 'onsite',
    cancelUrl,
    cancellationWindowMinutes,
  });

  if (opts.notifyAdmin) {
    const creditHours = rows.reduce(
      (sum, r) => sum + ((r as { credit_hours: number | null }).credit_hours ?? 0),
      0,
    );
    sendBookingNotification({
      reference: first.reference,
      stationLabel,
      customerName: first.customer_name,
      customerEmail: first.customer_email,
      customerPhone: first.customer_phone,
      date: first.date,
      startTime: first.start_time,
      durationMinutes: first.duration_minutes,
      totalPrice: amountPaid,
      isCredit: creditHours > 0,
      paysWithCredit: first.pays_with_credit,
      clutchzoneAccount: first.clutchzone_account,
      paymentMethod: first.payment_method === 'online' ? 'online' : 'onsite',
    }).catch(() => {});
  }

  return 'sent';
}
