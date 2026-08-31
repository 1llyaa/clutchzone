-- ============================================================
-- Self-service cancellation (VOP §3.4) and 14-day withdrawal (VOP §11).
--
-- Two legally distinct things, deliberately tracked separately:
--   * booking_cancellations — a *voluntary* goodwill policy. Date/time-bound
--     leisure bookings are exempt from the statutory withdrawal right under
--     § 1837 písm. j) občanského zákoníku, so the credit offered here is
--     beyond the legal minimum and is settled as ggLeap hours by staff.
--   * credit_orders.withdrawn_at — a *statutory* right (§ 1829). Undated
--     credit/voucher purchases must be refunded in money, by the original
--     payment method, within 14 days — hence a real Stripe refund id.
--
-- Note: the comment on migration 020 claiming the analytics events need no
-- consent gate is superseded — they are now opt-in, gated in
-- src/lib/consent/state.ts and described in /privacy#cookies.
-- ============================================================

-- Own table rather than overloading bookings.credit_hours, which already means
-- "hours purchased" — reusing it would make the admin queue ambiguous about
-- whether hours were bought or are owed back.
CREATE TABLE IF NOT EXISTS booking_cancellations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_group_id    uuid NOT NULL,
  cancelled_at        timestamptz NOT NULL DEFAULT now(),
  cancelled_by        text NOT NULL CHECK (cancelled_by IN ('customer', 'admin')),
  -- Negative once the start time has passed (no-show). Stored as computed at
  -- cancellation time so a later policy change can't retroactively rewrite
  -- whether a given cancellation was inside the free window.
  minutes_before_start int NOT NULL,
  -- 0 for late cancels/no-shows, which forfeit under VOP §3.4.2.
  credit_hours_owed   int NOT NULL DEFAULT 0,
  -- VOP §3.4.1 lets the customer ask in writing for the money back on the card
  -- instead of account credit; staff process that manually in Stripe.
  refund_requested    boolean NOT NULL DEFAULT false,
  -- Set when staff has actually credited the hours in ggLeap.
  fulfilled_at        timestamptz,
  fulfilled_by        uuid REFERENCES profiles(id)
);

-- One self-service cancellation per booking group — the API is idempotent and
-- relies on this to make a double-clicked email link a no-op rather than a
-- second credit line.
CREATE UNIQUE INDEX IF NOT EXISTS booking_cancellations_group_uniq
  ON booking_cancellations (booking_group_id);

-- Staff queue: cancellations that still owe the customer hours.
CREATE INDEX IF NOT EXISTS booking_cancellations_unfulfilled_idx
  ON booking_cancellations (cancelled_at)
  WHERE credit_hours_owed > 0 AND fulfilled_at IS NULL;

ALTER TABLE booking_cancellations ENABLE ROW LEVEL SECURITY;
-- No public policies — the public cancel route uses the service-role admin
-- client after verifying the HMAC link token, same as `bookings`.

-- ---------------------------------------------------------------
-- Statutory 14-day withdrawal for undated credit/voucher purchases
-- ---------------------------------------------------------------
ALTER TABLE credit_orders
  ADD COLUMN IF NOT EXISTS withdrawn_at   timestamptz,
  ADD COLUMN IF NOT EXISTS refund_id      text,
  ADD COLUMN IF NOT EXISTS refund_status  text
    CHECK (refund_status IS NULL OR refund_status IN ('pending', 'succeeded', 'failed')),
  -- Only the checkout session id was stored; refunds are issued against the
  -- payment intent, so it has to be persisted at webhook time.
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

CREATE INDEX IF NOT EXISTS credit_orders_withdrawn_idx
  ON credit_orders (withdrawn_at)
  WHERE withdrawn_at IS NOT NULL;

-- The free-cancellation window from VOP §3.4.1, editable without a deploy.
-- Kept in sync with CANCELLATION_WINDOW_MINUTES in src/lib/business.ts, which
-- is the fallback and the number rendered into the legal text.
INSERT INTO site_settings (key, value) VALUES ('cancellation_window_minutes', '15')
ON CONFLICT (key) DO NOTHING;
