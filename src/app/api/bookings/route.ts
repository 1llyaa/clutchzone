import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPricingConfig } from '@/lib/pricing/config-server';
import { calculatePricing, reservedHoursOnSite } from '@/lib/pricing/engine';
import type { CalcInput } from '@/lib/pricing/types';
import { sendBookingNotification, sendBookingConfirmation } from '@/lib/email';
import { buildCancelUrl } from '@/lib/cancel-token';
import { getCancellationWindowMinutes, minutesUntil } from '@/lib/bookings/cancellation';
import { getOnlineHoldMinutes, holdExpiryFrom, releaseExpiredHolds } from '@/lib/bookings/holds';
import { z } from 'zod';
import { getServerTranslator } from '@/lib/i18n/server';

const BookingSchema = z.object({
  stationType: z.enum(['pc', 'ps5']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startHour: z.number().int().min(0).max(27),
  durationHours: z.number().int().min(1).max(24),
  stationsCount: z.number().int().min(1).max(20),
  offerKind: z.enum(['hours', 'hours_upsell', 'pass']),
  offerId: z.string().min(1),
  expectedAmount: z.number().int().min(0),
  termsAccepted: z.boolean(),
  clutchzoneAccount: z.string().trim().optional(),
  paymentMethod: z.enum(['online', 'onsite']),
  paysWithCredit: z.boolean().optional().default(false),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(9),
  customerDiscord: z.string().optional(),
  // Locale of the cancellation link in the confirmation email.
  locale: z.enum(['cs', 'en', 'de', 'ua']).optional().default('cs'),
});

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'CZ-';
  for (let i = 0; i < 4; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BookingSchema.safeParse(body);
  // The locale is read off the raw body: a schema failure is exactly the case
  // where parsed.data does not exist yet, and that error still has to be legible.
  const t = await getServerTranslator(body?.locale, 'errors');
  if (!parsed.success) {
    return NextResponse.json({ error: t('invalidData'), details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (!data.termsAccepted) {
    return NextResponse.json({ error: t('termsRequiredBooking') }, { status: 400 });
  }

  // Revalidate everything server-side over the SAME engine + live DB data —
  // never trust stationType/date/hours/offer/price coming from the client.
  const config = await getPricingConfig();
  const dow = new Date(data.date + 'T12:00:00').getDay();
  const dayType = config.dayTypes.find((g) => g.days.includes(dow));
  if (!dayType) {
    return NextResponse.json({ error: t('closedThatDay') }, { status: 400 });
  }

  const calcInput: CalcInput = {
    stationType: data.stationType,
    dayTypeKey: dayType.key,
    startHour: data.startHour,
    durationHours: data.durationHours,
    stationsCount: data.stationsCount,
  };
  const result = calculatePricing(calcInput, config);
  const offer = result?.all.find((o) => o.id === data.offerId && o.kind === data.offerKind);

  if (!offer) {
    return NextResponse.json(
      { error: t('offerExpired'), currentOffer: result?.recommended ?? null },
      { status: 409 },
    );
  }
  if (offer.totalAmount !== data.expectedAmount) {
    return NextResponse.json(
      { error: t('priceChanged'), currentAmount: offer.totalAmount },
      { status: 409 },
    );
  }

  const reservedHours = reservedHoursOnSite(offer, calcInput, dayType);
  const startTime = `${String(data.startHour % 24).padStart(2, '0')}:00`;
  const durationMinutes = reservedHours * 60;

  if (minutesUntil(data.date, startTime) < 0) {
    return NextResponse.json({ error: t('timePassed') }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: stations, error: stErr } = await admin
    .from('stations')
    .select('id, label')
    .eq('type', data.stationType)
    .eq('is_active', true);

  if (stErr || !stations?.length) {
    return NextResponse.json({ error: t('noStations') }, { status: 503 });
  }

  // Lapsed online holds must free their slot before we decide what is taken,
  // otherwise an abandoned checkout keeps blocking the station.
  await releaseExpiredHolds();

  const { data: existing } = await admin
    .from('bookings')
    .select('station_id, start_time, duration_minutes')
    .in('station_id', stations.map((s) => s.id))
    .neq('status', 'cancelled')
    .eq('date', data.date);

  const [sh, sm] = startTime.split(':').map(Number);
  const ourStart = sh * 60 + sm;
  const ourEnd = ourStart + durationMinutes;

  const occupiedIds = new Set<string>();
  for (const b of existing ?? []) {
    const [bh, bm] = (b.start_time as string).split(':').map(Number);
    const bStart = bh * 60 + bm;
    const bEnd = bStart + b.duration_minutes;
    if (bStart < ourEnd && bEnd > ourStart) occupiedIds.add(b.station_id);
  }

  const free = stations.filter((s) => !occupiedIds.has(s.id));
  if (free.length < data.stationsCount) {
    return NextResponse.json(
      { error: t('onlySomeFree', { count: free.length }), available: free.length },
      { status: 409 },
    );
  }

  const chosen = free.slice(0, data.stationsCount);
  const groupId = crypto.randomUUID();
  const reference = generateReference();

  const { data: termsSetting } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'terms_version')
    .single();

  // "Pay by card" only holds the slot until the Stripe session expires — the
  // customer is redirected out of the app and may never come back. Onsite and
  // credit bookings are committed the moment they are made.
  const isOnline = data.paymentMethod === 'online';
  const holdMinutes = isOnline ? await getOnlineHoldMinutes() : 0;
  const holdExpiresAt = isOnline ? holdExpiryFrom(holdMinutes) : null;

  const rows = chosen.map((s) => ({
    reference,
    station_id: s.id,
    pricing_id: null,
    booking_group_id: groupId,
    stations_count: data.stationsCount,
    time_pass_id: offer.passId,
    offer_kind: offer.kind,
    // Paying with already-banked credit consumes it on the spot (staff
    // deducts from ggLeap in person) — it never itself banks new hours,
    // so it must never show up in the admin "needs crediting" queue.
    credit_hours: offer.kind === 'pass' || data.paysWithCredit ? null : offer.hoursCovered,
    pays_with_credit: data.paysWithCredit,
    clutchzone_account: data.clutchzoneAccount?.trim() || null,
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_phone: data.customerPhone,
    customer_discord: data.customerDiscord || null,
    date: data.date,
    start_time: startTime,
    duration_minutes: durationMinutes,
    total_price: offer.amountPerStation,
    payment_method: data.paymentMethod,
    // `pending` still blocks the slot exactly as `confirmed` does — the hold is
    // real. It just carries an expiry, and the webhook promotes it on payment.
    status: isOnline ? ('pending' as const) : ('confirmed' as const),
    hold_expires_at: holdExpiresAt,
    terms_accepted_at: new Date().toISOString(),
    terms_version: termsSetting?.value ?? null,
  }));

  // Single multi-row INSERT — atomic: either every station lands or none
  // does, so a same-instant race on the same station rolls the whole
  // request back instead of partially booking.
  const { data: inserted, error: insertErr } = await admin
    .from('bookings')
    .insert(rows)
    .select('id, station_id');

  if (insertErr) {
    if (insertErr.code === '23P01') {
      return NextResponse.json({ error: t('raceLost') }, { status: 409 });
    }
    return NextResponse.json({ error: t('bookingCreateFailed') }, { status: 500 });
  }

  const stationLabels = chosen.map((s) => s.label);

  // Signing needs BOOKING_CANCEL_SECRET — if it's unset, the booking still
  // succeeds and the email simply goes out without the self-service link.
  let cancelUrl: string | null = null;
  try {
    cancelUrl = await buildCancelUrl(data.locale, groupId);
  } catch (err) {
    console.error('Cancellation link not signed:', err);
  }
  const cancellationWindowMinutes = await getCancellationWindowMinutes();

  const emailData = {
    reference,
    stationLabel: stationLabels.join(', '),
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    date: data.date,
    startTime,
    durationMinutes,
    totalPrice: offer.totalAmount,
    offerLabel: offer.label,
    isCredit: offer.isCredit,
    paysWithCredit: data.paysWithCredit,
    creditExpiryMonths: config.creditExpiryMonths,
    clutchzoneAccount: data.clutchzoneAccount?.trim() || null,
    cancelUrl,
    cancellationWindowMinutes,
    paymentMethod: data.paymentMethod,
    holdMinutes: isOnline ? holdMinutes : undefined,
    locale: data.locale,
  };
  // Staff is only told about an online booking once it is paid (the webhook
  // sends it), the same way credit orders work — an unpaid hold may evaporate
  // in minutes and is just noise in the inbox. Onsite and credit bookings are
  // committed now, so they are announced now.
  if (!isOnline) sendBookingNotification(emailData).catch(() => {});
  sendBookingConfirmation(emailData).catch(() => {});

  return NextResponse.json({
    id: groupId,
    reference,
    stationLabels,
    totalAmount: offer.totalAmount,
    isCredit: offer.isCredit,
    firstBookingRowId: inserted?.[0]?.id ?? null,
  });
}
