import { createAdminClient } from '@/lib/supabase/admin';
import CreditsClient from './CreditsClient';

async function fetchCreditsData(showAll: boolean) {
  const admin = createAdminClient();

  let query = admin
    .from('credit_orders')
    .select('*')
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false });
  if (!showAll) query = query.is('fulfilled_at', null);

  const { data: orders } = await query;
  const orderIds = (orders ?? []).map((o) => o.id);

  const [itemsRes, profilesRes] = await Promise.all([
    orderIds.length
      ? admin.from('credit_order_items').select('*').in('order_id', orderIds)
      : Promise.resolve({ data: [] }),
    admin.from('profiles').select('id, display_name, email'),
  ]);

  const itemsByOrder = new Map<string, { station_type: string; hours: number; quantity: number; unit_amount: number }[]>();
  for (const item of itemsRes.data ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }
  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

  return (orders ?? []).map((o) => ({
    ...o,
    items: itemsByOrder.get(o.id) ?? [],
    fulfilledByProfile: o.fulfilled_by ? profileById.get(o.fulfilled_by) ?? null : null,
  }));
}

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const params = await searchParams;
  const showAll = params.all === '1';
  const orders = await fetchCreditsData(showAll);

  return <CreditsClient orders={orders} showAll={showAll} />;
}
