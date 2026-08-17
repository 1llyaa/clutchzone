import { createAdminClient } from '@/lib/supabase/admin';
import { getPricingConfig } from '@/lib/pricing/config-server';
import CreditsClient, { type QueueEntry } from './CreditsClient';

async function fetchKreditOrders(admin: ReturnType<typeof createAdminClient>, showAll: boolean): Promise<QueueEntry[]> {
  let query = admin.from('credit_orders').select('*').eq('payment_status', 'paid').order('created_at', { ascending: false });
  if (!showAll) query = query.is('fulfilled_at', null);

  const { data: orders } = await query;
  const orderIds = (orders ?? []).map((o) => o.id);

  const [itemsRes, profilesRes] = await Promise.all([
    orderIds.length ? admin.from('credit_order_items').select('*').in('order_id', orderIds) : Promise.resolve({ data: [] }),
    admin.from('profiles').select('id, display_name, email'),
  ]);

  const itemsByOrder = new Map<string, { station_type: string; hours: number; quantity: number }[]>();
  for (const item of itemsRes.data ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }
  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

  return (orders ?? []).map((o) => {
    const items = itemsByOrder.get(o.id) ?? [];
    const fulfilledBy = o.fulfilled_by ? profileById.get(o.fulfilled_by) ?? null : null;
    return {
      id: o.id,
      source: 'kredit' as const,
      reference: o.reference,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      customerPhone: o.customer_phone,
      clutchzoneAccount: o.clutchzone_account,
      description: items.map((i) => `${i.station_type.toUpperCase()} · ${i.quantity}× ${i.hours}h`).join(', '),
      amount: o.total_amount,
      paidAt: o.created_at,
      expiresAt: o.expires_at,
      fulfilledAt: o.fulfilled_at,
      fulfilledByName: fulfilledBy ? fulfilledBy.display_name ?? fulfilledBy.email : null,
      termsAcceptedAt: o.terms_accepted_at,
      termsVersion: o.terms_version,
      needsCredit: true,
      coinsAwarded: o.coins_awarded ?? 0,
    };
  });
}

async function fetchBookingCredits(admin: ReturnType<typeof createAdminClient>, showAll: boolean, creditExpiryMonths: number): Promise<QueueEntry[]> {
  // Two audiences share this list: hours/hours_upsell bookings need staff
  // to actually credit hours on ggLeap (fulfilled_at applies); pass bookings
  // never bank hours, but a card-paid one still earned the customer coins,
  // and staff wants that visible here too (not just the hour-credit queue).
  let query = admin
    .from('bookings')
    .select('*')
    .neq('status', 'cancelled')
    // Paid with already-banked credit → nothing new to hand over, staff
    // already deducted it in person, never belongs in this queue.
    .eq('pays_with_credit', false)
    .or('offer_kind.in.(hours,hours_upsell),and(payment_method.eq.online,payment_status.eq.paid)')
    .order('created_at', { ascending: false });
  if (!showAll) query = query.is('fulfilled_at', null);

  const { data: rows } = await query;
  const { data: profiles } = await admin.from('profiles').select('id, display_name, email');
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const byGroup = new Map<string, typeof rows>();
  for (const r of rows ?? []) {
    const list = byGroup.get(r.booking_group_id) ?? [];
    list.push(r);
    byGroup.set(r.booking_group_id, list!);
  }

  return [...byGroup.values()].map((group) => {
    const first = group![0];
    const needsCredit = ['hours', 'hours_upsell'].includes(first.offer_kind);
    const totalAmount = group!.reduce((sum, r) => sum + r.total_price, 0);
    const totalHours = needsCredit ? (first.credit_hours ?? 0) * group!.length : 0;
    const coinsAwarded = group!.reduce((sum, r) => sum + (r.coins_awarded ?? 0), 0);
    const fulfilledBy = first.fulfilled_by ? profileById.get(first.fulfilled_by) ?? null : null;
    const expires = new Date(first.created_at);
    expires.setMonth(expires.getMonth() + creditExpiryMonths);

    return {
      id: first.booking_group_id,
      source: 'booking' as const,
      reference: first.reference,
      customerName: first.customer_name,
      customerEmail: first.customer_email,
      customerPhone: first.customer_phone,
      clutchzoneAccount: first.clutchzone_account,
      description: needsCredit
        ? `${group!.length}× ${first.credit_hours}H (rezervace ${first.date})`
        : `PAS · ${first.date} ${String(first.start_time).slice(0, 5)}`,
      amount: totalAmount,
      paidAt: first.created_at,
      expiresAt: expires.toISOString().slice(0, 10),
      fulfilledAt: first.fulfilled_at,
      fulfilledByName: fulfilledBy ? fulfilledBy.display_name ?? fulfilledBy.email : null,
      termsAcceptedAt: first.terms_accepted_at,
      termsVersion: first.terms_version,
      totalHours,
      needsCredit,
      coinsAwarded,
    };
  });
}

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const params = await searchParams;
  const showAll = params.all === '1';
  const admin = createAdminClient();
  const config = await getPricingConfig();

  const [kreditEntries, bookingEntries] = await Promise.all([
    fetchKreditOrders(admin, showAll),
    fetchBookingCredits(admin, showAll, config.creditExpiryMonths),
  ]);

  const entries = [...kreditEntries, ...bookingEntries].sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  return <CreditsClient entries={entries} showAll={showAll} />;
}
