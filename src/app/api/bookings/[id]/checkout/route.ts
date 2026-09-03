import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createStripeClient } from '@/lib/stripe';
import { getOnlineHoldMinutes } from '@/lib/bookings/holds';
import { getServerTranslator } from '@/lib/i18n/server';

// Must match i18n/routing.ts — `de` and `ua` used to fall through to Czech
// success/cancel pages.
const VALID_LOCALES = ['cs', 'en', 'de', 'ua'];
const DEFAULT_LOCALE = 'cs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const admin = createAdminClient();

  // Read before the first early return: every error below is rendered to the
  // customer, so the locale has to be known by then.
  const body = await request.json().catch(() => ({}));
  const requestedLocale = body?.locale;
  const locale = VALID_LOCALES.includes(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
  const t = await getServerTranslator(locale, 'errors');

  const { data: rows, error: bookingErr } = await admin
    .from('bookings')
    .select('id, reference, total_price, payment_status, status, hold_expires_at')
    .eq('booking_group_id', groupId);

  if (bookingErr || !rows?.length) {
    return NextResponse.json({ error: t('bookingNotFound') }, { status: 404 });
  }

  if (rows.some((r) => r.payment_status === 'paid')) {
    return NextResponse.json({ error: t('alreadyPaid') }, { status: 409 });
  }

  // The hold lapsed (or the customer cancelled) — the slot may already belong
  // to someone else, so taking money for it now would double-book.
  if (rows.every((r) => r.status === 'cancelled')) {
    return NextResponse.json(
      { error: t('bookingNoLongerValid') },
      { status: 409 },
    );
  }

  const totalAmount = rows.reduce((sum, r) => sum + r.total_price, 0);

  const { data: setting } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'pay_now_coins_amount')
    .single();

  const coinsAmount = setting?.value ? parseInt(setting.value, 10) : 50;

  // Stripe rejects an `expires_at` under 30 minutes out, and the timestamp is
  // computed before the round trip, so the window is opened from *now* with a
  // minute of slack rather than reusing the hold stamped at booking time.
  // The hold is then pushed two minutes past the session: the slot must outlive
  // the session that can still pay for it, never the other way round.
  const holdMinutes = await getOnlineHoldMinutes();
  const sessionExpiresAt = Math.floor(Date.now() / 1000) + (holdMinutes + 1) * 60;
  const holdExpiresAt = new Date((sessionExpiresAt + 120) * 1000).toISOString();

  try {
    const stripe = createStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'czk',
      expires_at: sessionExpiresAt,
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
      metadata: { bookingId: groupId, coins: String(coinsAmount), locale },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking=${groupId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/booking/cancelled?booking=${groupId}`,
    });

    const { error: updateErr } = await admin
      .from('bookings')
      .update({
        payment_method: 'online',
        stripe_checkout_session_id: session.id,
        hold_expires_at: holdExpiresAt,
      })
      .eq('booking_group_id', groupId);

    if (updateErr) {
      console.error(
        `Failed to record Stripe checkout session on booking group ${groupId} (session ${session.id}):`,
        updateErr
      );
    }

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: t('paymentCreateFailed') }, { status: 500 });
  }
}
