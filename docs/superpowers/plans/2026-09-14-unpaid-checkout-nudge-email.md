# Unpaid checkout nudge e-mail

Date: 2026-09-14
Status: design approved — ready for implementation plan
Branch: off `main`, PR into `main` (DEV retired 2026-09-07, contra AGENTS.md)

## Goal

A customer books, clicks **Zaplatit teď**, Stripe Checkout opens, they close the tab without paying. Today nothing happens: the slot sits held, the hold lapses silently, and the customer never hears from us again.

Send one e-mail 15 minutes after checkout opened, while the Stripe session is still live, pointing back at the same session so the customer can finish paying.

## The constraint that shapes everything

The original request was "e-mail at 15 minutes, then we delete the booking and tell the user nothing." That cannot be built as stated:

- `MIN_ONLINE_HOLD_MINUTES = 30` in `src/lib/bookings/holds.ts` is a **Stripe-imposed floor** — Stripe refuses a Checkout Session with `expires_at` under 30 minutes out. The hold is pinned to the session so a live session can never outlive its slot.
- `src/app/api/bookings/[id]/checkout/route.ts` opens the session at `now + (holdMinutes + 1)` minutes and pushes `hold_expires_at` to `session_expiry + 2 min`. Real release is therefore **≈33 minutes** after the button click, not 15.
- Nothing is deleted. `releaseExpiredHolds()` flips `status` to `cancelled`, because `cancelled` is the only status that frees a slot for the availability queries and the `bookings_no_overlap` exclusion constraint.

So at minute 15 the slot is still held for another ~18 minutes and the Stripe session is still payable. The e-mail is a **nudge**, not an expiry notice, and it must not claim the booking is gone.

## Decisions taken

| Question | Decision |
|---|---|
| What the e-mail says | Nudge while the session is live: "slot held until HH:MM, finish payment." No expiry/goodbye mail in this scope. |
| What fires it | Supabase `pg_cron` + `pg_net`, every minute, POSTing a secured app route. The project has no cron today and the existing lazy reap only runs on site traffic — a quiet night is exactly when the nudge would be missed. |
| Where the button points | `stripe.checkout.sessions.retrieve(id).url` — the original session. Same expiry, no hold extension. |
| Due-time source | New `checkout_started_at` column, not arithmetic on `hold_expires_at`. |
| Send-once guard | New `payment_nudge_email_at` column, claimed by conditional UPDATE — same pattern as `payment_confirmed_email_at`. |
| Locale | Read from `session.metadata.locale`. The bookings table has no locale column and does not need one. |
| Admin copy | None. An unpaid hold is not staff's problem until money lands; that is already why online bookings withhold their staff notification until `sendPaymentReceiptOnce`. |

## Why `checkout_started_at` rather than deriving from `hold_expires_at`

`hold_expires_at = now + (online_hold_minutes + 3) minutes`. Back-computing the click time gives `hold_expires_at − 18 min` **only while `online_hold_minutes` is 30**. That value is a `site_settings` row an admin can raise. The moment they do, a derived nudge drifts silently and nobody finds out. An explicit stamp survives the setting changing.

## Schema — `supabase/migrations/024_payment_nudge.sql`

```sql
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS checkout_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_nudge_email_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_payment_nudge_due_idx
  ON bookings (checkout_started_at)
  WHERE status = 'pending'
    AND payment_nudge_email_at IS NULL
    AND checkout_started_at IS NOT NULL;
```

Both columns nullable, no backfill. Bookings already in flight when this ships simply never get nudged — correct, since their Stripe sessions are mid-window and we have no click time for them.

`checkout_started_at` is stamped in the UPDATE that already runs at `src/app/api/bookings/[id]/checkout/route.ts:90-93`, alongside `stripe_checkout_session_id` and `hold_expires_at`. One extra field on an existing write, no new round trip.

## Scheduling

Same migration enables the extensions and schedules the job:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

The job runs every minute and issues `net.http_post` to `${SITE_URL}/api/cron/payment-nudge` with an `x-cron-secret` header.

**The secret is read from Supabase Vault inside the cron command. It is never written into migration SQL** — migrations are committed to the repo, and `scripts/check-secrets.mjs` runs in CI. The migration schedules a job that reads `vault.decrypted_secrets`; creating the Vault entry and the `CRON_SECRET` env var is a manual deploy step, documented in the plan's setup section, not automated here.

Every-minute cadence means the nudge lands within 60 seconds of the 15-minute mark. Good enough; there is no value in tighter.

## Route — `src/app/api/cron/payment-nudge/route.ts`

- `export const dynamic = 'force-dynamic'`, POST only.
- Compares `x-cron-secret` against `process.env.CRON_SECRET` with a constant-time compare. Missing env var → 503, not 200: a route that silently no-ops when misconfigured is how this feature dies unnoticed. Mismatch → 401.
- Batch cap of 50 booking groups per run, so one backlog cannot stall the request or fan out 500 Stripe calls.
- Returns a small JSON summary (`{ considered, sent, skipped }`) for log-grepping.

## Selection and send, per booking group

Eligible rows:

```
payment_method = 'online'
status = 'pending'
payment_status <> 'paid'
pays_with_credit = false
stripe_checkout_session_id IS NOT NULL
payment_nudge_email_at IS NULL
checkout_started_at <= now() - interval '15 minutes'
hold_expires_at > now()
```

The last clause is load-bearing. If a run lags — deploy, DB blip, backlog — a booking whose hold already lapsed must not receive "your slot is held until HH:MM" about a slot that is already back on sale.

Then, per group:

1. `stripe.checkout.sessions.retrieve(stripe_checkout_session_id)`.
2. If `session.status !== 'open'` (paid, expired, or gone), stamp `payment_nudge_email_at` anyway and skip. Burning the slot stops the group being reconsidered every minute for the rest of its life.
3. Otherwise claim: `UPDATE bookings SET payment_nudge_email_at = now() WHERE booking_group_id = $1 AND payment_nudge_email_at IS NULL RETURNING id`. Empty result means another run took it — return without sending.
4. Send. Claim first, send second, exactly as `sendPaymentReceiptOnce` does, because the failure mode being defended against is duplicate mail to a paying customer.

Logic lives in `src/lib/bookings/payment-nudge.ts`, mirroring `src/lib/bookings/payment-receipt.ts`. The route is a thin auth + batch wrapper.

## E-mail

New `sendPaymentNudge()` in `src/lib/email.ts`, reusing the existing `escapeHtml`, `legalFooter`, `legalFooterText`, and `getTransport`. Fire-and-forget like every other sender — a mail failure must not fail the cron run, and the claim already prevents a retry storm.

Content:

- Slot held until **HH:MM**, formatted Europe/Prague from `hold_expires_at`.
- Reference, station label, date, start time, duration, amount due.
- One button to `session.url`.
- Closing line: if payment does not arrive by that time the slot is released and no further mail follows. This is the only "we will not contact you again" the customer gets, and it is honest — there is no second e-mail in this design.
- `LEGAL_IDENTITY_LINE` footer, per § 435 obč. zák., same as every other customer-facing mail.

It must not say the booking has been deleted or cancelled. At minute 15 neither is true.

## i18n

New `email.nudge.*` block in `messages/{cs,de,en,ua}.json` — note the namespace is `email`, singular, alongside `booking`, `receipt`, `credit`. Resolved through `getServerTranslator(locale, 'email')`, which is scope-free and already used by the webhook mailers.

Czech is the source text; the other three go through the existing `npm run i18n:export` / `i18n:import` round trip.

## Tests

`src/lib/bookings/payment-nudge.test.ts`, on the `node --test` runner already wired into `npm test`.

Extract a pure predicate — `isNudgeDue({ status, paymentStatus, paysWithCredit, checkoutStartedAt, holdExpiresAt, nudgeSentAt, now })` — the way `shouldSendPaymentReceipt` is extracted, so the table-driven cases need no DB:

- under 15 minutes → not due
- at/over 15 minutes, hold live → due
- hold already lapsed → not due
- already paid → not due
- cancelled → not due
- `pays_with_credit` → not due
- `payment_nudge_email_at` set → not due
- `checkout_started_at` null (pre-migration booking) → not due

Plus a claim-race test asserting the second claim returns no rows, matching the coverage style in `payment-receipt.test.ts`.

## New configuration

| Name | Where | Purpose |
|---|---|---|
| `CRON_SECRET` | app env | Validates the `x-cron-secret` header |
| same value | Supabase Vault | Read by the `pg_cron` job |

`NEXT_PUBLIC_SITE_URL` is already set and is reused for the cron target.

## Out of scope

- **No expiry / goodbye e-mail.** Deliberate: the customer is told in the nudge what happens at HH:MM, so a second mail restating it adds nothing.
- **No change to the 30-minute hold.** It is a Stripe floor, not a preference.
- **No backfill** for bookings created before the migration.

## Known bug found while designing this — not fixed here

`POST /api/bookings/[id]/checkout` mints a **fresh** Stripe session and pushes `hold_expires_at` forward on every call (`route.ts:64-65`). A customer who reloads the pay page repeatedly extends their hold without limit, keeping a slot off sale indefinitely at no cost.

This design routes around it — the nudge links to the retrieved original session rather than re-hitting that route, so it adds no new exposure. The underlying bug predates this work and wants its own fix.
