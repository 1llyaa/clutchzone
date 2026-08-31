import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyToken } from '@/lib/cancel-token';
import { refundPaymentIntent } from '@/lib/stripe';
import { loadOrderForWithdrawal } from '@/lib/credits/withdrawal';

const QuerySchema = z.object({
  token: z.string().min(1),
  exp: z.coerce.number().int().positive(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const parsed = QuerySchema.safeParse({
    token: url.searchParams.get('token') ?? body.token,
    exp: url.searchParams.get('exp') ?? body.exp,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatný odkaz.' }, { status: 400 });
  }

  const valid = await verifyToken('credit-withdraw', orderId, parsed.data.exp, parsed.data.token);
  if (!valid) {
    return NextResponse.json({ error: 'Odkaz je neplatný nebo vypršel.' }, { status: 403 });
  }

  const order = await loadOrderForWithdrawal(orderId);
  if (!order) {
    return NextResponse.json({ error: 'Objednávka nenalezena.' }, { status: 404 });
  }
  if (order.alreadyWithdrawn) {
    return NextResponse.json({ status: 'already_withdrawn' });
  }
  if (!order.canWithdraw) {
    return NextResponse.json(
      {
        error: order.alreadyFulfilled
          ? 'Hodiny už byly připsány na účet — odstoupení prosím vyřešte s obsluhou.'
          : !order.withinWindow
            ? 'Čtrnáctidenní lhůta pro odstoupení už uplynula.'
            : 'Od této objednávky nelze odstoupit online.',
      },
      { status: 409 },
    );
  }
  if (!order.paymentIntentId) {
    return NextResponse.json(
      { error: 'K objednávce chybí platební údaj — kontaktujte nás prosím e-mailem.' },
      { status: 409 },
    );
  }

  const admin = createAdminClient();

  // Claim the withdrawal BEFORE calling Stripe: the conditional update is the
  // lock, so two concurrent submissions can't both reach refunds.create.
  const { data: claimed, error: claimErr } = await admin
    .from('credit_orders')
    .update({ withdrawn_at: new Date().toISOString(), refund_status: 'pending' })
    .eq('id', orderId)
    .is('withdrawn_at', null)
    .select('id');

  if (claimErr) {
    return NextResponse.json({ error: 'Odstoupení se nepodařilo zpracovat.' }, { status: 500 });
  }
  if (!claimed?.length) {
    return NextResponse.json({ status: 'already_withdrawn' });
  }

  // Only the Stripe call is inside this try — a failure here means no money
  // moved, which is a different situation from failing to record a refund that
  // did go through, and the two must not share an error path.
  let refund: Awaited<ReturnType<typeof refundPaymentIntent>>;
  try {
    // Keyed on the order so a retry after a network blip reuses the same
    // refund rather than issuing a second one.
    refund = await refundPaymentIntent(order.paymentIntentId, `withdraw-${orderId}`);
  } catch (err) {
    console.error(`Stripe refund failed for credit order ${orderId}:`, err);
    // withdrawn_at stays set — the customer did validly withdraw and the money
    // is legally owed. Marking it failed puts it in front of staff rather than
    // silently reopening the order. Never let this bookkeeping write throw:
    // the customer's withdrawal itself succeeded either way.
    const { error: flagErr } = await admin
      .from('credit_orders')
      .update({ refund_status: 'failed' })
      .eq('id', orderId);
    if (flagErr) {
      console.error(`Could not flag credit order ${orderId} as refund_status=failed:`, flagErr);
    }
    return NextResponse.json(
      {
        status: 'withdrawn',
        refundStatus: 'failed',
        error: 'Odstoupení jsme zaznamenali, ale vrácení platby se nezdařilo. Ozveme se vám.',
      },
      { status: 202 },
    );
  }

  // Money has already moved at this point. A failure to record that must never
  // turn into an error for the customer — it's logged for staff instead.
  const { error: recordErr } = await admin
    .from('credit_orders')
    .update({
      refund_id: refund.id,
      refund_status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
    })
    .eq('id', orderId);
  if (recordErr) {
    console.error(
      `Refund ${refund.id} succeeded for credit order ${orderId} but could not be recorded:`,
      recordErr,
    );
  }

  return NextResponse.json({ status: 'withdrawn', refundStatus: refund.status });
}
