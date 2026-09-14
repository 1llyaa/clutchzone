-- ============================================================
-- Unpaid checkout nudge.
--
-- A customer books, clicks "Zaplatit teď", Stripe Checkout opens, and they
-- close the tab. Today nothing happens: the slot sits held, the hold lapses
-- silently, and the customer never hears from us again.
--
-- Fifteen minutes after checkout opened we send one e-mail pointing back at
-- the *same* Stripe session, while it is still payable.
--
-- It is a nudge, not an expiry notice, and it must never say the booking is
-- gone. MIN_ONLINE_HOLD_MINUTES is 30 because Stripe refuses a Checkout
-- Session expiring sooner than that, and the checkout route opens the session
-- at now + (hold + 1) min and pushes hold_expires_at two minutes past it. Real
-- release is therefore ~33 minutes after the click: at minute 15 the slot is
-- still held for another ~18 and the session is still open.
-- ============================================================

ALTER TABLE bookings
  -- When the customer actually opened Checkout. Deliberately NOT derived from
  -- hold_expires_at: that is now + (online_hold_minutes + 3) minutes, so
  -- back-computing the click time only works while online_hold_minutes is 30.
  -- It is a site_settings row an admin can raise, and a derived due-time would
  -- drift silently the moment they did.
  ADD COLUMN IF NOT EXISTS checkout_started_at timestamptz,
  -- Claimed by conditional UPDATE before the mail goes out, exactly like
  -- payment_confirmed_email_at in migration 022. Send-once, ever.
  ADD COLUMN IF NOT EXISTS payment_nudge_email_at timestamptz;

-- The cron job runs every minute, so the due-set scan has to be cheap.
CREATE INDEX IF NOT EXISTS bookings_payment_nudge_due_idx
  ON bookings (checkout_started_at)
  WHERE status = 'pending'
    AND payment_nudge_email_at IS NULL
    AND checkout_started_at IS NOT NULL;

-- Both columns nullable, no backfill. Bookings already in flight when this
-- ships simply never get nudged — correct, since their sessions are mid-window
-- and there is no click time on record for them.

-- ============================================================
-- Scheduling.
--
-- The project had no cron. The existing hold reaper is lazy — it only runs
-- when someone hits an availability endpoint — and a quiet night is exactly
-- when an abandoned checkout would go unnoticed, so the nudge cannot ride on
-- site traffic the way the reaper does.
--
-- If these two CREATE EXTENSION statements fail on a hosted project, enable
-- pg_cron and pg_net from the Supabase dashboard (Database → Extensions) and
-- re-run this migration.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent: re-running the migration must not stack duplicate jobs.
SELECT cron.unschedule('payment-nudge')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'payment-nudge');

-- The shared secret is read from Supabase Vault at run time and is *never*
-- written into migration SQL — migrations are committed to the repo and
-- scripts/check-secrets.mjs runs in CI. Creating the two Vault entries is a
-- manual deploy step.
--
-- The WHERE clause makes a missing entry a silent no-op rather than a failed
-- HTTP call logged once a minute forever: until the Vault is populated the job
-- runs and does nothing.
SELECT cron.schedule(
  'payment-nudge',
  '* * * * *',
  $job$
  SELECT net.http_post(
    url     := v.site_url || '/api/cron/payment-nudge',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-cron-secret', v.secret
               ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  )
  FROM (
    SELECT
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret') AS secret,
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'site_url')    AS site_url
  ) v
  WHERE v.secret IS NOT NULL AND v.site_url IS NOT NULL;
  $job$
);
