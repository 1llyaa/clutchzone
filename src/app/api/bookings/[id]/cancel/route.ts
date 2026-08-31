import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyToken } from '@/lib/cancel-token';
import {
  loadBookingForCancellation,
  getCancellationWindowMinutes,
  cancellationSettlementFor,
} from '@/lib/bookings/cancellation';
import { sendCancellationNotification } from '@/lib/email';

const QuerySchema = z.object({
  token: z.string().min(1),
  exp: z.coerce.number().int().positive(),
  // VOP §3.4.1 — the customer may ask for the money back on the card instead
  // of account credit. Recorded here; staff process the refund in Stripe.
  refundRequested: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const parsed = QuerySchema.safeParse({
    token: url.searchParams.get('token') ?? body.token,
    exp: url.searchParams.get('exp') ?? body.exp,
    refundRequested: body.refundRequested,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatný odkaz.' }, { status: 400 });
  }

  // Re-verified here rather than trusting the page that rendered the button.
  const valid = await verifyToken('booking-cancel', groupId, parsed.data.exp, parsed.data.token);
  if (!valid) {
    return NextResponse.json({ error: 'Odkaz je neplatný nebo vypršel.' }, { status: 403 });
  }

  const booking = await loadBookingForCancellation(groupId);
  if (!booking) {
    return NextResponse.json({ error: 'Rezervace nenalezena.' }, { status: 404 });
  }

  // Idempotent: a double-clicked link, or a race with an admin cancelling the
  // same booking, is a no-op rather than an error or a second credit line.
  if (booking.alreadyCancelled) {
    return NextResponse.json({ status: 'already_cancelled', creditHours: 0 });
  }

  const admin = createAdminClient();
  const windowMinutes = await getCancellationWindowMinutes();
  const withinFreeWindow = booking.minutesBeforeStart > windowMinutes;

  const settlement = cancellationSettlementFor({
    ...booking,
    withinFreeWindow,
    refundPreferred: parsed.data.refundRequested,
  });
  const creditHoursOwed = settlement.kind === 'credit' ? settlement.hours : 0;

  const { data: updated, error: updateErr } = await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('booking_group_id', groupId)
    .neq('status', 'cancelled')
    .select('id');

  if (updateErr) {
    return NextResponse.json({ error: 'Rezervaci se nepodařilo zrušit.' }, { status: 500 });
  }
  // Zero rows means an admin cancelled it between our read and this write.
  if (!updated?.length) {
    return NextResponse.json({ status: 'already_cancelled', creditHours: 0 });
  }

  // Both the amount and the flag come from the settlement, so they cannot
  // disagree — deriving them separately is what produced "VRÁTIT 0 Kč".
  const refundRequested = settlement.kind === 'refund';
  const refundAmount = settlement.kind === 'refund' ? settlement.amount : 0;

  const { error: ledgerErr } = await admin.from('booking_cancellations').insert({
    booking_group_id: groupId,
    cancelled_by: 'customer',
    minutes_before_start: booking.minutesBeforeStart,
    credit_hours_owed: creditHoursOwed,
    refund_requested: refundRequested,
  });

  // 23505 = the one-per-group unique index fired, i.e. a concurrent duplicate
  // request already logged this cancellation. The booking is cancelled either
  // way, so report success rather than failing the customer's click.
  const ledgerFailed = Boolean(ledgerErr) && ledgerErr!.code !== '23505';
  if (ledgerFailed) {
    console.error(
      `Cancellation ledger insert failed for booking group ${groupId} (${creditHoursOwed}h owed):`,
      ledgerErr,
    );
  }

  // The booking is cancelled regardless, but the ledger row is what puts the
  // owed hours in front of staff. Without it, promising credit in the UI would
  // be a promise nobody can see — say "contact us" instead of quietly dropping it.
  if (ledgerFailed && creditHoursOwed > 0) {
    return NextResponse.json({
      status: 'cancelled',
      creditHours: 0,
      withinFreeWindow,
      refundRequested: false,
      creditUnrecorded: true,
    });
  }

  // Nothing in the admin UI reads booking_cancellations yet, so without this
  // a refund the customer is owed would sit in a table nobody opens.
  //
  // The condition is "money came in and the cancellation was timely", not
  // "we computed something to give back" — a paid, in-window cancellation that
  // yields neither credit nor refund is an anomaly the customer was still told
  // about, so staff has to see it rather than it vanishing silently.
  if (booking.paid && !booking.paysWithCredit && withinFreeWindow) {
    sendCancellationNotification({
      reference: booking.reference,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      date: booking.date,
      startTime: booking.startTime,
      stationLabel: booking.stationLabels.join(', '),
      creditHoursOwed,
      refundRequested,
      refundAmount,
    }).catch(() => {});
  }

  return NextResponse.json({
    status: 'cancelled',
    creditHours: creditHoursOwed,
    withinFreeWindow,
    refundRequested,
    refundAmount,
  });
}
