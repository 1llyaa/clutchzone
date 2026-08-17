-- Spec §12/§13: lightweight first-party product analytics for the pricing
-- calculator + reservation + credit flows. No cookies, no third-party
-- script — session_id is a random per-tab id kept in sessionStorage only,
-- so this does not require a cookie-consent gate (see CookieBar.tsx).
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx on analytics_events (event_name);
create index if not exists analytics_events_created_at_idx on analytics_events (created_at);
create index if not exists analytics_events_session_id_idx on analytics_events (session_id);

alter table analytics_events enable row level security;
-- No public policies: only the service-role admin client (server-side API
-- route) writes here, and only staff read it (via SQL editor / a future
-- admin report) — never queried directly from the browser.
