-- ============================================================
-- Booking payment lifecycle: expiring holds + one-shot payment receipts.
--
-- Two problems this closes:
--
--  1. An online booking was inserted as `confirmed` and the customer was then
--     redirected to Stripe. Abandoning checkout left the row `confirmed` /
--     `unpaid` forever, and since every availability path filters
--     `status <> 'cancelled'` (and so does the bookings_no_overlap exclusion
--     constraint from migration 003), the slot was held permanently by someone
--     who never paid. Online bookings now start as `pending` with a
--     `hold_expires_at`, and lapse to `cancelled` once it passes.
--
--  2. Both the Stripe webhook and the admin "mark as paid" toggle can move a
--     booking to paid, and Stripe retries webhooks. Without a claim flag the
--     customer receives the payment receipt once per retry, and again every
--     time staff toggles paid off and on.
-- ============================================================

ALTER TABLE bookings
  -- NULL = permanent hold. Onsite and credit bookings are committed the moment
  -- they are made; a paid online booking has the value cleared by the webhook.
  ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz,
  -- Claimed atomically before the receipt is sent, so it can only go out once.
  ADD COLUMN IF NOT EXISTS payment_confirmed_email_at timestamptz;

-- The reaper runs inline on every availability lookup, so it has to be cheap.
CREATE INDEX IF NOT EXISTS bookings_expired_holds_idx
  ON bookings (hold_expires_at)
  WHERE status = 'pending' AND hold_expires_at IS NOT NULL;

-- handleCreditPaid already sent both e-mails straight from the webhook, so a
-- Stripe retry duplicated them. Same claim flag, same guard.
ALTER TABLE credit_orders
  ADD COLUMN IF NOT EXISTS payment_confirmed_email_at timestamptz;

-- How long an unpaid online booking holds its slot.
--
-- 30 is a floor, not a preference: Stripe's minimum Checkout Session
-- `expires_at` is 30 minutes out, and the hold window is set to match so Stripe
-- itself refuses payment on a session whose hold has lapsed. Going lower here
-- would let a session outlive its hold and take money for a released slot —
-- getOnlineHoldMinutes() in src/lib/bookings/holds.ts clamps to 30 regardless.
INSERT INTO site_settings (key, value) VALUES ('online_hold_minutes', '30')
ON CONFLICT (key) DO NOTHING;
