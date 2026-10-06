import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { releaseExpiredHolds } from '@/lib/bookings/holds';
import { calendarStartMinutes, occupiedStationIds } from '@/lib/bookings/occupancy';
import { generateReference } from '@/lib/bookings/reference';
import { getCancellationWindowMinutes } from '@/lib/bookings/cancellation';
import { sendPaymentReceiptOnce } from '@/lib/bookings/payment-receipt';
import { sendBookingConfirmation } from '@/lib/email';
import { buildCancelUrl } from '@/lib/cancel-token';

export async function GET(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('bookings')
    .select('*, stations(label, type)')
    .eq('date', date)
    .order('start_time');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** Empty form fields arrive as '' — store them as NULL, not as empty strings. */
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => v || null);

const CreateSchema = z.object({
  /** The club day the board shows. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Minutes on that day's axis; past 1440 is the small hours of the next date. */
  startMinutes: z.number().int().min(0).max(2880).multipleOf(15),
  durationMinutes: z.number().int().min(15).max(24 * 60).multipleOf(15),
  stationIds: z.array(z.string().uuid()).min(1).max(20),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: optionalText(32),
  customerEmail: z.union([z.literal(''), z.string().trim().email()]).optional().transform((v) => v || null),
  clutchzoneAccount: optionalText(64),
  /** Per station — the same unit as bookings.total_price. */
  pricePerStation: z.number().int().min(0).max(100_000),
  timePassId: z.string().uuid().nullable().optional(),
  paymentStatus: z.enum(['unpaid', 'paid']),
  locale: z.enum(['cs', 'en', 'de', 'ua']).optional().default('cs'),
});

/**
 * Staff enter a booking themselves: a walk-in, or a phone call.
 *
 * Unlike POST /api/bookings nothing here is re-priced or checked against
 * opening hours — the price is whatever staff agreed with the customer, and a
 * walk-in may be logged after it started. Overlap is still enforced: the
 * pre-check below for a legible message, the exclusion constraint for real.
 */
export async function POST(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = CreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatná data', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const stationIds = [...new Set(data.stationIds)];

  const admin = createAdminClient();

  const { data: stations, error: stErr } = await admin
    .from('stations')
    .select('id, label, type, is_active')
    .in('id', stationIds);

  if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });
  if (stations?.length !== stationIds.length) {
    return NextResponse.json({ error: 'Stanice neexistuje' }, { status: 404 });
  }
  if (stations.some((s) => !s.is_active)) {
    return NextResponse.json({ error: 'Stanice je vyřazená z provozu' }, { status: 400 });
  }
  // One reservation, one tier: total_price is per station of a single type.
  if (new Set(stations.map((s) => s.type)).size > 1) {
    return NextResponse.json({ error: 'Rezervace může obsahovat jen stanice jednoho typu' }, { status: 400 });
  }

  await releaseExpiredHolds();

  const occupied = await occupiedStationIds(admin, {
    date: data.date,
    stationIds,
    startMinutes: data.startMinutes,
    endMinutes: data.startMinutes + data.durationMinutes,
  });
  if (occupied.size) {
    const labels = stations.filter((s) => occupied.has(s.id)).map((s) => s.label).join(', ');
    return NextResponse.json({ error: `Obsazeno: ${labels}` }, { status: 409 });
  }

  const { date, startTime } = calendarStartMinutes(data.date, data.startMinutes);
  const groupId = crypto.randomUUID();
  const reference = generateReference();
  const paid = data.paymentStatus === 'paid';

  const rows = stations.map((s) => ({
    reference,
    station_id: s.id,
    booking_group_id: groupId,
    stations_count: stations.length,
    time_pass_id: data.timePassId ?? null,
    offer_kind: data.timePassId ? 'pass' : 'hours',
    // Nothing is banked: the customer plays the time now. Keeps staff-entered
    // bookings out of the "needs crediting" queue.
    credit_hours: null,
    pays_with_credit: false,
    clutchzone_account: data.clutchzoneAccount,
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_phone: data.customerPhone,
    date,
    start_time: startTime,
    duration_minutes: data.durationMinutes,
    total_price: data.pricePerStation,
    payment_method: 'onsite',
    payment_status: data.paymentStatus,
    status: 'confirmed',
    hold_expires_at: null,
    source: 'admin',
    created_by: profile.id,
  }));

  const { error: insertErr } = await admin.from('bookings').insert(rows);
  if (insertErr) {
    if (insertErr.code === '23P01') {
      return NextResponse.json({ error: 'Místo bylo mezitím obsazeno, zkuste to znovu' }, { status: 409 });
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Staff made it, so no staff notification. The customer hears about it only
  // if they left an address: a receipt when they already paid at the counter
  // (it carries the booking details too), otherwise the usual confirmation.
  if (data.customerEmail) {
    if (paid) {
      sendPaymentReceiptOnce(groupId, { locale: data.locale }).catch(() => {});
    } else {
      let cancelUrl: string | null = null;
      try {
        cancelUrl = await buildCancelUrl(data.locale, groupId);
      } catch (err) {
        console.error('Cancellation link not signed:', err);
      }
      sendBookingConfirmation({
        reference,
        stationLabel: stations.map((s) => s.label).join(', '),
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        date,
        startTime,
        durationMinutes: data.durationMinutes,
        totalPrice: data.pricePerStation * stations.length,
        clutchzoneAccount: data.clutchzoneAccount,
        cancelUrl,
        cancellationWindowMinutes: await getCancellationWindowMinutes(),
        paymentMethod: 'onsite',
        locale: data.locale,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ id: groupId, reference });
}
