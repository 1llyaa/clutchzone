# Admin station blocks — design

**Date:** 2026-09-14
**Status:** approved, ready for implementation plan

## Problem

Staff have no way to take a station out of circulation for a time window. A
walk-in customer sits down at PC-03, or a machine needs a GPU swap, and the
station stays bookable online for that slot. The only existing lever is
`stations.is_active`, which is a global on/off with no time dimension: it
removes the station from every date at once and stays off until someone
remembers to flip it back.

## Scope

An admin marks one or more specific stations unavailable for a given date,
start time and duration. No customer, no price, no email, no payment state.

Explicitly out of scope:

- Manual bookings entered on behalf of a customer (a separate feature).
- Open-ended "blocked until released" blocks. Every block has an end.
- Recurring or template blocks.
- Any public-facing display of a block beyond the availability count dropping.

## Decisions

| Question | Decision |
|---|---|
| Semantics | Block with no customer data |
| Time extent | `date` + `start_time` + `duration_minutes`, always bounded |
| Station selection | Specific stations, multi-select, one action covers several |
| Conflict with a live booking | Refuse with 409, naming the clashing stations |
| Storage | Separate `station_blocks` table, not rows in `bookings` |
| Note field | Optional, staff-facing only, never shown publicly |

### Why a separate table

Blocks could have been rows in `bookings` carrying a `kind = 'block'` marker.
That buys atomicity for free — the existing `bookings_no_overlap` GIST
exclusion constraint would cover block-vs-booking — and the three occupancy
readers would need no change at all.

It was rejected because of blast radius. Roughly eighteen code sites query
`bookings`: dashboard revenue tiles, the credit-fulfillment queue, the
notification badge, payment receipts, cancellation credit math, the Stripe
webhook, the ggLeap hours cell. Every one of them would need a
`kind <> 'block'` filter, and so would every query written afterwards. A single
forgotten filter puts a fake row into a customer-facing number. The table also
has `customer_name`, `customer_email` and `total_price` as `NOT NULL`, so
blocks would need sentinel values or relaxed constraints.

The separate table inverts the cost: three occupancy readers must learn to
union blocks in, and cross-table exclusion needs a trigger, but no
booking, payment, credit or email path can ever see a block.

## Data model

New migration `supabase/migrations/024_station_blocks.sql`.

```sql
CREATE TABLE station_blocks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_group_id   uuid NOT NULL,
  station_id       uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  date             date NOT NULL,
  start_time       time NOT NULL,
  duration_minutes int  NOT NULL CHECK (duration_minutes > 0),
  note             text,
  created_by       uuid REFERENCES profiles(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT station_blocks_no_overlap EXCLUDE USING gist (
    station_id WITH =,
    tsrange(
      (date + start_time)::timestamp,
      (date + start_time)::timestamp + (duration_minutes * INTERVAL '1 minute'),
      '[)'
    ) WITH &&
  )
);

CREATE INDEX station_blocks_date_idx ON station_blocks (date);
CREATE INDEX station_blocks_group_idx ON station_blocks (block_group_id);
```

Shape notes:

- `date` + `start_time` + `duration_minutes` deliberately mirrors `bookings`
  after migration 003, so one overlap helper serves both and a duration running
  past midnight is handled identically.
- `block_group_id` mirrors `booking_group_id`: blocking four PCs is four rows
  sharing a group, created and deleted as one unit. Unlike bookings there is no
  legacy row without a group, so lookups key on `block_group_id` alone — no
  `id.eq` fallback.
- No `status` column. A block is deleted outright; there is no cancelled block
  to keep for history, no money and no customer attached to it.
- `created_by` references `profiles(id)` for accountability. Nullable, so a
  block survives the admin's profile being removed.

RLS: enable on the table, add an admin-read policy mirroring
`bookings_admin_read` from migration 010 (`auth.uid() IN (SELECT id FROM
profiles)`). No anon policy at all. All writes go through server routes on the
service-role client.

## Cross-table atomicity

Postgres exclusion constraints cannot span two tables, so `station_blocks_no_overlap`
protects block-vs-block only. Block-vs-booking needs two `BEFORE INSERT OR UPDATE`
triggers:

- on `station_blocks`: reject when an overlapping `bookings` row exists with
  `status <> 'cancelled'`
- on `bookings`: reject when an overlapping `station_blocks` row exists

Each trigger takes `pg_advisory_xact_lock(hashtext(NEW.station_id::text))`
before reading the other table. Taking the same lock key on the same station
from both sides serializes the check, closing the window where two concurrent
transactions each read "clear" and both insert.

Both raise SQLSTATE `23P01` (`exclusion_violation`), matching what the existing
exclusion constraint raises. `POST /api/bookings` already maps `23P01` to a 409
`raceLost`, so a customer racing an admin gets the right answer with no change
to that branch.

The bookings insert is a single multi-row statement; the trigger fires per row
and each takes its own station's lock, which is correct — a group either lands
whole or rolls back whole.

## Server logic

### Shared occupancy helper

New `src/lib/bookings/occupancy.ts`:

- `rangesOverlap(aStartMin, aEndMin, bStartMin, bEndMin): boolean`
- `parseTimeToMinutes(time: string): number`
- `occupiedStationIds(admin, { date, stationIds, startMinutes, endMinutes }): Promise<Set<string>>`
  — queries non-cancelled `bookings` and `station_blocks` for the date and
  station set, returns the union of stations busy in that window.

The overlap loop is currently copy-pasted in three files with identical logic.
Those three call the helper instead. This is the targeted cleanup the feature
justifies, not a wider refactor.

### Occupancy readers

1. `src/app/api/availability/route.ts` — public availability count. Blocked
   stations drop out of `available`. The expired-hold reap stays where it is,
   before the occupancy read.
2. `src/app/api/bookings/route.ts` — a blocked station is never selected for a
   customer booking, and the "only N free" 409 counts correctly.
3. `src/app/[locale]/admin/(protected)/bookings/page.tsx` — loads blocks for the
   requested date range alongside bookings and stations, passes them to the
   client.

### New routes

`POST /api/admin/station-blocks`

- `requireAdmin` guard, matching every other admin route.
- Zod body: `{ stationIds: string[] (min 1), date: YYYY-MM-DD, startTime: HH:MM,
  durationMinutes: int > 0, note?: string }`.
- A start time in the past is allowed, unlike `POST /api/bookings`. Blocking a
  walk-in who sat down twenty minutes ago is the primary use case, so the guard
  is on the block's *end*: reject only when the whole window already elapsed,
  since such a block can never affect availability.
- Pre-checks conflicts against bookings and existing blocks so the error can
  name the clashing station labels rather than surfacing a raw constraint
  violation. Returns 409 with the labels.
- Inserts one multi-row statement sharing a fresh `block_group_id`, with
  `created_by` from the admin profile.
- A `23P01` from the trigger (lost race between the pre-check and the insert)
  maps to a generic 409.

`DELETE /api/admin/station-blocks/[groupId]`

- `requireAdmin`, deletes every row with that `block_group_id`.

No GET route: the admin page loads blocks server-side.

### Untouched

Revenue tiles, credit queue, notification badge, payment receipts, cancellation
credit math, ggLeap hours, the Stripe webhook and the hold reaper all read
`bookings` only and need no change. This is the point of the separate table.

## Admin UI

All of it inside the existing station grid in
`src/app/[locale]/admin/(protected)/bookings/BookingsClient.tsx`, single-day
view only — the grid already renders only when `from === to`.

### Time-window-aware tiles

Today a tile reads `OBSAZENO` if the station has any non-cancelled booking
anywhere on that date, ignoring time entirely. Blocks are per time window, so a
grid that cannot express "free at 14:00, taken at 19:00" makes the feature
unusable: staff would be blocking against a display that does not match what
they are blocking.

The block action bar's start time and duration therefore drive the grid. Tiles
show occupancy **for the window currently selected in the bar**, defaulting to
now (or opening time, for a future date) plus one hour. This corrects existing
behaviour and is in scope because the feature depends on it.

### Interaction

- Free tiles become buttons. Clicking toggles selection; selected tiles carry
  an orange outline.
- With at least one station selected, an action bar appears above the grid:
  start time, duration, optional note, and a small Bebas `BLOKOVAT` button.
- Submitting POSTs the block, clears the selection and refreshes.
- A 409 renders inline, listing the stations that clashed.
- A fourth tile state `blocked` renders in `cz-warning` yellow with the label
  `BLOKOVÁNO`, distinct from the orange `OBSAZENO` of a real booking. Semantic
  status colours are already the admin system per AGENTS.md.
- Clicking a blocked tile opens a small panel with its window and note plus an
  `UVOLNIT` action, behind a confirm dialog, issuing the DELETE.

The bookings table below the grid is untouched — it lists customer bookings,
and a block is not one.

### Conventions

- Strings hardcoded Czech, matching every other string in this file. No new
  next-intl namespace: admin surfaces in this repo are Czech-only.
- Buttons use the small size from AGENTS.md (`16px`, `11px 22px`,
  `1.5px` border, `line-height: 1`).
- No new hex values; `--color-cz-warning`, `--color-cz-orange`,
  `--color-cz-gray-*` only.
- `rounded-control` on tiles and buttons, as now.

## Testing

`src/lib/bookings/occupancy.test.ts`, run by `npm test` (node:test via tsx,
following `src/lib/bookings/holds.test.ts`):

- touching intervals do not overlap (`[10:00,11:00)` vs `[11:00,12:00)`)
- partial overlap at each end, and full containment either way
- a block removes its station from the available set
- a cancelled booking does not occupy
- a duration running past midnight still overlaps correctly

The triggers cannot be unit-tested — the repo has no DB harness. Verified by
hand against a branch database: apply the migration, block a slot, attempt the
same slot through the public reservation flow, expect the 409.

Also required before claiming done, per AGENTS.md: `npx tsc --noEmit`, then
`npm run dev` and walk the grid (select, block, see the yellow state, release).

## Branch

Branch off `main` and PR into `main`. AGENTS.md still instructs basing off
`DEV`; `DEV` was retired on 2026-09-07. Correcting that line belongs in its own
commit, not this feature.
