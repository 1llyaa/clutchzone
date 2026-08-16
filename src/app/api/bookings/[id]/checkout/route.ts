import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createStripeClient } from '@/lib/stripe';

const VALID_LOCALES = ['cs', 'en'];
const DEFAULT_LOCALE = 'cs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const admin = createAdminClient();

  const { data: rows, error: bookingErr } = await admin
    .from('bookings')
    .select('id, reference, total_price, payment_status')
    .eq('booking_group_id', groupId);

  if (bookingErr || !rows?.length) {
    return NextResponse.json({ error: 'Rezervace nenalezena' }, { status: 404 });
  }

  if (rows.some((r) => r.payment_status === 'paid')) {
    return NextResponse.json({ error: 'Rezervace je již zaplacena' }, { status: 409 });
  }

  const totalAmount = rows.reduce((sum, r) => sum + r.total_price, 0);

  const { data: setting } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'pay_now_coins_amount')
    .single();

  const coinsAmount = setting?.value ? parseInt(setting.value, 10) : 50;

  const body = await request.json().catch(() => ({}));
  const requestedLocale = body?.locale;
  const locale = VALID_LOCALES.includes(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;

  try {
    const stripe = createStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'czk',
      line_items: [
        {
          price_data: {
            currency: 'czk',
            product_data: { name: `Rezervace ${rows[0].reference}` },
            unit_amount: totalAmount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId: groupId, coins: String(coinsAmount) },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking=${groupId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/booking/cancelled?booking=${groupId}`,
    });

    const { error: updateErr } = await admin
      .from('bookings')
      .update({ payment_method: 'online', stripe_checkout_session_id: session.id })
      .eq('booking_group_id', groupId);

    if (updateErr) {
      console.error(
        `Failed to record Stripe checkout session on booking group ${groupId} (session ${session.id}):`,
        updateErr
      );
    }

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: 'Chyba při vytváření platby' }, { status: 500 });
  }
}
