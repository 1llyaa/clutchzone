import { createAdminClient } from '@/lib/supabase/admin';

/** § 1829 obč. zák. — 14 days from conclusion of the contract. */
export const WITHDRAWAL_WINDOW_DAYS = 14;

export type WithdrawableOrder = {
  id: string;
  reference: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  paymentStatus: string;
  paymentIntentId: string | null;
  items: { stationType: string; hours: number; quantity: number }[];
  daysSincePurchase: number;
  withinWindow: boolean;
  /** Staff already credited the hours in ggLeap — no longer self-service. */
  alreadyFulfilled: boolean;
  alreadyWithdrawn: boolean;
  /** True only when the button should actually do something. */
  canWithdraw: boolean;
};

/**
 * Known limitation: `stripe_payment_intent_id` is written by the
 * checkout.session.completed webhook, and orders paid before that column
 * existed never got one. Those (and any order stranded by a webhook outage,
 * left at payment_status='pending') can't be refunded self-service — the route
 * returns a "contact us" message and staff refunds from the Stripe dashboard.
 */
export async function loadOrderForWithdrawal(orderId: string): Promise<WithdrawableOrder | null> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from('credit_orders')
    .select(
      'id, reference, customer_name, total_amount, created_at, payment_status, stripe_payment_intent_id, fulfilled_at, withdrawn_at',
    )
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) return null;

  const { data: items } = await admin
    .from('credit_order_items')
    .select('station_type, hours, quantity')
    .eq('order_id', orderId);

  const created = new Date(order.created_at as string).getTime();
  const daysSincePurchase = Math.floor((Date.now() - created) / 86400000);
  const withinWindow = daysSincePurchase < WITHDRAWAL_WINDOW_DAYS;
  const alreadyFulfilled = Boolean(order.fulfilled_at);
  const alreadyWithdrawn = Boolean(order.withdrawn_at);

  return {
    id: order.id as string,
    reference: order.reference as string,
    customerName: order.customer_name as string,
    totalAmount: order.total_amount as number,
    createdAt: order.created_at as string,
    paymentStatus: order.payment_status as string,
    paymentIntentId: (order.stripe_payment_intent_id as string | null) ?? null,
    items: (items ?? []).map((i) => ({
      stationType: i.station_type as string,
      hours: i.hours as number,
      quantity: i.quantity as number,
    })),
    daysSincePurchase,
    withinWindow,
    alreadyFulfilled,
    alreadyWithdrawn,
    // Once staff has credited the hours they may already be partly spent, and
    // proration is a judgement call — VOP §11.4 routes those to staff instead.
    canWithdraw:
      order.payment_status === 'paid' && withinWindow && !alreadyFulfilled && !alreadyWithdrawn,
  };
}
