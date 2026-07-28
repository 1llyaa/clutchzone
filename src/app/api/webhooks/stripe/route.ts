import { NextRequest, NextResponse } from 'next/server';
import { createStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

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
    const bookingId = session.metadata?.bookingId;
    const coins = parseInt(session.metadata?.coins ?? '0', 10);
    if (bookingId) {
      const admin = createAdminClient();
      await admin
        .from('bookings')
        .update({
          payment_status: 'paid',
          coins_awarded: coins,
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id,
        })
        .eq('id', bookingId);
    }
  }

  return NextResponse.json({ received: true });
}
