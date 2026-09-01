import { NextRequest, NextResponse } from 'next/server';
import { createStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendCreditOrderNotification, sendCreditPurchaseConfirmation, sendStrandedPaymentAlert } from '@/lib/email';
import { buildWithdrawUrl } from '@/lib/cancel-token';
import { sendPaymentReceiptOnce } from '@/lib/bookings/payment-receipt';

async function handleBookingPaid(admin: ReturnType<typeof createAdminClient>, groupId: string, coins: number, paymentIntentId: string | undefined, locale: string) {
  const { data: updated, error } = await admin
    .from('bookings')
    // Payment is what promotes the hold: the booking was inserted as `pending`
    // with an expiry, and clearing hold_expires_at makes the slot permanent.
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      hold_expires_at: null,
      coins_awarded: coins,
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq('booking_group_id', groupId)
    // Never resurrect a hold that lapsed or that the customer cancelled — the
    // slot may already belong to someone else.
    .neq('status', 'cancelled')
    .select('id');

  if (error) {
    console.error(`Failed to mark booking group ${groupId} as paid (coins: ${coins}) after Stripe checkout.session.completed:`, error);
    return;
  }

  if (!updated?.length) {
    // Money arrived for a booking that is no longer live. Stripe refuses
    // expired sessions so this should not happen, but it is real money and
    // must not be swallowed — staff refunds it by hand.
    console.error(`Stripe payment received for booking group ${groupId} but no live booking remained — needs a manual refund.`);
    sendStrandedPaymentAlert({ groupId, paymentIntentId }).catch(() => {});
    return;
  }

  await sendPaymentReceiptOnce(groupId, { locale, notifyAdmin: true });
}

async function handleCreditPaid(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  coins: number,
  paymentIntentId: string | undefined,
  locale: string,
) {
  const { data: order, error } = await admin
    .from('credit_orders')
    // payment_intent_id is what a later 14-day withdrawal refunds against.
    .update({ payment_status: 'paid', coins_awarded: coins, stripe_payment_intent_id: paymentIntentId })
    .eq('id', orderId)
    .select('id, reference, customer_name, customer_email, total_amount, expires_at, clutchzone_account')
    .single();

  if (error || !order) {
    console.error(`Failed to mark credit order ${orderId} as paid after Stripe checkout.session.completed:`, error);
    return;
  }

  // Stripe retries webhooks, and these two e-mails were previously re-sent on
  // every delivery. Claim before sending, same as bookings.
  const { data: claimed, error: claimErr } = await admin
    .from('credit_orders')
    .update({ payment_confirmed_email_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('payment_confirmed_email_at', null)
    .select('id');

  if (claimErr) {
    console.error(`Failed to claim credit order ${orderId} confirmation e-mails:`, claimErr);
    return;
  }
  if (!claimed?.length) return;

  const { data: items } = await admin.from('credit_order_items').select('station_type, hours, quantity').eq('order_id', orderId);

  // Unsigned (missing secret) must not stop the confirmation email going out —
  // the customer can still withdraw by writing in, per VOP §11.5.
  let withdrawUrl: string | null = null;
  try {
    withdrawUrl = await buildWithdrawUrl(locale, orderId);
  } catch (err) {
    console.error('Withdrawal link not signed:', err);
  }

  const emailData = {
    reference: order.reference,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    totalAmount: order.total_amount,
    expiresAt: order.expires_at,
    clutchzoneAccount: order.clutchzone_account,
    items: (items ?? []).map((i) => ({ stationType: i.station_type as 'pc' | 'ps5', hours: i.hours, quantity: i.quantity })),
    withdrawUrl,
  };
  sendCreditOrderNotification(emailData).catch(() => {});
  sendCreditPurchaseConfirmation(emailData).catch(() => {});
}

export async function POST(request: NextRequest) {
  const body = await request.text(); // raw body — do NOT call request.json() first, it breaks signature verification
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const stripe = createStripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object; // Stripe.Checkout.Session
    const parsedCoins = parseInt(session.metadata?.coins ?? '0', 10);
    const coins = Number.isFinite(parsedCoins) ? parsedCoins : 0;
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    const admin = createAdminClient();

    if (session.metadata?.kind === 'credit') {
      const orderId = session.metadata?.creditOrderId;
      const locale = session.metadata?.locale || 'cs';
      if (orderId) await handleCreditPaid(admin, orderId, coins, paymentIntentId, locale);
    } else {
      // Metadata key is named bookingId for historical reasons — it now holds
      // the booking_group_id, since a checkout can cover several stations.
      const groupId = session.metadata?.bookingId;
      const locale = session.metadata?.locale || 'cs';
      if (groupId) await handleBookingPaid(admin, groupId, coins, paymentIntentId, locale);
    }
  }

  return NextResponse.json({ received: true });
}
