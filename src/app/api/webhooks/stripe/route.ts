import { NextRequest, NextResponse } from 'next/server';
import { createStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendCreditOrderNotification, sendCreditPurchaseConfirmation } from '@/lib/email';

async function handleBookingPaid(admin: ReturnType<typeof createAdminClient>, groupId: string, coins: number, paymentIntentId: string | undefined) {
  const { error } = await admin
    .from('bookings')
    .update({ payment_status: 'paid', coins_awarded: coins, stripe_payment_intent_id: paymentIntentId })
    .eq('booking_group_id', groupId);

  if (error) {
    console.error(`Failed to mark booking group ${groupId} as paid (coins: ${coins}) after Stripe checkout.session.completed:`, error);
  }
}

async function handleCreditPaid(admin: ReturnType<typeof createAdminClient>, orderId: string, coins: number) {
  const { data: order, error } = await admin
    .from('credit_orders')
    .update({ payment_status: 'paid', coins_awarded: coins })
    .eq('id', orderId)
    .select('reference, customer_name, customer_email, total_amount, expires_at, clutchzone_account')
    .single();

  if (error || !order) {
    console.error(`Failed to mark credit order ${orderId} as paid after Stripe checkout.session.completed:`, error);
    return;
  }

  const { data: items } = await admin.from('credit_order_items').select('station_type, hours, quantity').eq('order_id', orderId);

  const emailData = {
    reference: order.reference,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    totalAmount: order.total_amount,
    expiresAt: order.expires_at,
    clutchzoneAccount: order.clutchzone_account,
    items: (items ?? []).map((i) => ({ stationType: i.station_type as 'pc' | 'ps5', hours: i.hours, quantity: i.quantity })),
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
      if (orderId) await handleCreditPaid(admin, orderId, coins);
    } else {
      // Metadata key is named bookingId for historical reasons — it now holds
      // the booking_group_id, since a checkout can cover several stations.
      const groupId = session.metadata?.bookingId;
      if (groupId) await handleBookingPaid(admin, groupId, coins, paymentIntentId);
    }
  }

  return NextResponse.json({ received: true });
}
