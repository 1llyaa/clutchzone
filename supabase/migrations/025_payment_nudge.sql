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

-- ============================================================
-- Where the job gets its secret and its target URL.
--
-- The shared secret is never written into migration SQL — migrations are
-- committed to the repo and scripts/check-secrets.mjs runs in CI — so the job
-- reads it at run time. Where from depends on the deployment:
--
--   Hosted Supabase   — Vault (`vault.decrypted_secrets`), encrypted at rest.
--   Self-hosted       — the Vault extension is often absent, and Postgres
--                       cannot read the container's environment from SQL at
--                       all, so database-level settings stand in:
--                         ALTER DATABASE <db> SET app.cron_secret = '…';
--                         ALTER DATABASE <db> SET app.site_url   = '…';
--
-- Vault wins when present. The lookup lives in a function rather than inline in
-- the job because `vault.decrypted_secrets` cannot even be *mentioned* in SQL
-- on an instance without the extension — the statement fails to parse, and the
-- job would error every single minute. to_regclass + EXECUTE defers that to run
-- time, so one command works on both.
-- ============================================================

CREATE OR REPLACE FUNCTION public.payment_nudge_config()
RETURNS TABLE (secret text, site_url text)
LANGUAGE plpgsql
-- Deliberately SECURITY INVOKER: this returns a credential, and a definer-rights
-- function handing it to any caller would be a privilege-escalation footgun.
-- pg_cron runs the job as the role that scheduled it, which can read the Vault.
SET search_path = ''
AS $fn$
BEGIN
  secret := NULL;
  site_url := NULL;

  IF to_regclass('vault.decrypted_secrets') IS NOT NULL THEN
    EXECUTE $q$
      SELECT
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret'),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'site_url')
    $q$ INTO secret, site_url;
  END IF;

  -- nullif so an empty setting counts as absent rather than as a blank secret.
  IF secret IS NULL THEN
    secret := nullif(current_setting('app.cron_secret', true), '');
  END IF;
  IF site_url IS NULL THEN
    site_url := nullif(current_setting('app.site_url', true), '');
  END IF;

  RETURN NEXT;
END;
$fn$;

REVOKE ALL ON FUNCTION public.payment_nudge_config() FROM PUBLIC;

-- The WHERE clause makes missing configuration a silent no-op rather than a
-- failed HTTP call logged once a minute forever: until the secret and URL are
-- in place the job runs and does nothing.
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
  -- Schema-qualified: pg_cron runs the job on its own search_path,
  -- which is not guaranteed to include public.
  FROM public.payment_nudge_config() v
  WHERE v.secret IS NOT NULL AND v.site_url IS NOT NULL;
  $job$
);
