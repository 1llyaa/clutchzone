import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createStripeClient } from '@/lib/stripe';
import { getPricingConfig } from '@/lib/pricing/config-server';

const VALID_LOCALES = ['cs', 'en'];
const DEFAULT_LOCALE = 'cs';

const CreditOrderSchema = z.object({
  items: z.array(z.object({
    stationType: z.enum(['pc', 'ps5']),
    hours: z.number().int().positive(),
    quantity: z.number().int().min(1).max(20),
  })).min(1),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(9),
  clutchzoneAccount: z.string().trim().optional(),
  termsAccepted: z.boolean(),
  locale: z.string().optional(),
});

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'CZ-';
  for (let i = 0; i < 4; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export async function POST(req: NextRequest) {
  const parsed = CreditOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatné údaje', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (!data.termsAccepted) {
    return NextResponse.json({ error: 'Bez souhlasu s podmínkami nemůžeme nákup dokončit.' }, { status: 400 });
  }

  const config = await getPricingConfig();

  // Price every line server-side from the live ceník — never trust amounts from the client.
  const lines: { stationType: 'pc' | 'ps5'; hours: number; quantity: number; unitAmount: number }[] = [];
  for (const item of data.items) {
    const tier = config.hourTiers.find((t) => t.isActive && t.stationType === item.stationType && t.hours === item.hours);
    if (!tier) {
      return NextResponse.json({ error: `Cenovka ${item.hours}H pro ${item.stationType.toUpperCase()} už neexistuje` }, { status: 409 });
    }
    lines.push({ stationType: item.stationType, hours: item.hours, quantity: item.quantity, unitAmount: tier.amount });
  }

  const totalAmount = lines.reduce((sum, l) => sum + l.unitAmount * l.quantity, 0);

  const expires = new Date();
  expires.setMonth(expires.getMonth() + config.creditExpiryMonths);
  const expiresAt = expires.toISOString().slice(0, 10);

  const admin = createAdminClient();
  const { data: termsSetting } = await admin.from('site_settings').select('value').eq('key', 'terms_version').single();
  const reference = generateReference();

  const { data: order, error: orderErr } = await admin
    .from('credit_orders')
    .insert({
      reference,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone,
      clutchzone_account: data.clutchzoneAccount?.trim() || null,
      total_amount: totalAmount,
      expires_at: expiresAt,
      terms_accepted_at: new Date().toISOString(),
      terms_version: termsSetting?.value ?? null,
    })
    .select('id')
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Chyba při vytváření objednávky' }, { status: 500 });
  }

  const { error: itemsErr } = await admin.from('credit_order_items').insert(
    lines.map((l) => ({ order_id: order.id, station_type: l.stationType, hours: l.hours, unit_amount: l.unitAmount, quantity: l.quantity })),
  );
  if (itemsErr) {
    return NextResponse.json({ error: 'Chyba při vytváření objednávky' }, { status: 500 });
  }

  const { data: coinsSetting } = await admin.from('site_settings').select('value').eq('key', 'pay_now_coins_amount').single();
  const coinsAmount = coinsSetting?.value ? parseInt(coinsSetting.value, 10) : 50;

  const locale = VALID_LOCALES.includes(data.locale ?? '') ? data.locale! : DEFAULT_LOCALE;

  try {
    const stripe = createStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'czk',
      line_items: lines.map((l) => ({
        price_data: {
          currency: 'czk',
          product_data: { name: `${l.hours}H ${l.stationType.toUpperCase()} kredit` },
          unit_amount: l.unitAmount * 100,
        },
        quantity: l.quantity,
      })),
      metadata: { kind: 'credit', creditOrderId: order.id, coins: String(coinsAmount) },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/kredit/success?session_id={CHECKOUT_SESSION_ID}&order=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/kredit/cancelled?order=${order.id}`,
    });

    await admin.from('credit_orders').update({ stripe_checkout_session_id: session.id }).eq('id', order.id);

    return NextResponse.json({ id: order.id, reference, url: session.url });
  } catch {
    return NextResponse.json({ error: 'Chyba při vytváření platby' }, { status: 500 });
  }
}
