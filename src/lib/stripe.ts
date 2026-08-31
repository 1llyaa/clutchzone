import Stripe from 'stripe';

export function createStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

/**
 * Refunds a credit/voucher purchase after a statutory 14-day withdrawal
 * (§ 1829 obč. zák.). Unlike a booking cancellation — which is a voluntary
 * credit under VOP §3.4 — this one legally has to return actual money by the
 * original payment method, so it goes through Stripe rather than staff.
 *
 * `idempotencyKey` is derived from the order id, so a double-submitted
 * withdrawal returns the original refund instead of issuing a second one.
 */
export async function refundPaymentIntent(
  paymentIntentId: string,
  idempotencyKey: string,
): Promise<Stripe.Refund> {
  const stripe = createStripeClient();
  return stripe.refunds.create(
    { payment_intent: paymentIntentId, reason: 'requested_by_customer' },
    { idempotencyKey },
  );
}
