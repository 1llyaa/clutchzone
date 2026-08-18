# AGENTS.md — Clutch Zone

Rules for AI agents working in this repo. Read before touching design, typography, or branch/workflow decisions.

## Stack

Next.js 15 (App Router) + React 19 + TypeScript, Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`), Supabase (DB/auth/storage), Stripe, next-intl (cs/en, always locale-prefixed under `src/app/[locale]/`).

## Git workflow

- **New feature work bases off `origin/DEV` and pushes to `origin/DEV`, not `main`.** `main` is the deployed/stable line; `DEV` is the active integration branch.
- Fetch `DEV` before branching. Push finished work back to `DEV` (fast-forward branch push or merge) — never straight to `main`.
- Don't create ad-hoc long-lived worktree branches off `main`.
- Delete feature branches once merged (locally and on `origin`) instead of letting them pile up — drift between stale branches has caused real merge pain here (144-conflict reconciliation, once).

## Fonts

Only three families, anywhere:
- `Bebas Neue` (`--font-display`) — headings, section titles, buttons, stat numbers.
- `Inter` (`--font-body`) — body copy, UI text, navigation. Weights: 400 (base), 500 (important data: nav links, addresses, contact info, footer day labels), 600/700. **Never weight 300.**
- `Space Mono` (`--font-mono`) — accent only: eyebrows (`// ...`), micro-labels, numbers, times, prices, technical/status data. **Never** paragraph body copy or navigation links.

## Color

Palette lives in `src/app/globals.css` (`--color-cz-*`). Don't introduce new hex values — reuse existing tokens.

- `#555555` / `text-cz-gray-mid` — **banned as a text color**, no exceptions beyond bare unstyled icon glyphs with a real hover/active state. Legal only for borders/dividers/disabled icons.
- `#888888` / `text-cz-gray-light` — micro-info and image placeholders only. **Never** for card description paragraphs — those use `text-cz-white-soft` (`#E8E8E8`).
- Semantic status colors (`#22c55e`/`#ef4444`/`#eab308`, success/warning/danger) are a functional system used across the admin panel (bookings, settings, gallery, tournaments, games, dashboard) — don't repurpose them as decorative accents elsewhere.
- `cz-orange` (`#E84A1A`) is the one brand accent — CTAs, active states, availability indicators.

## Radius

- Media and cards: `4px` (`rounded-cz`).
- Buttons and badges: `2px` (`rounded-control`).
- Circles: `50%`. Pills: `100px`.
- Nothing else.

## Buttons

Every Bebas-Neue uppercase CTA/action button (shared `Button.tsx` or hand-rolled) uses one of two sizes:

- **Large** (hero, CTA band, form submit): `font-size: 18px; letter-spacing: 1.5px; line-height: 1; text-transform: uppercase; padding: 14px 32px; border: 1.5px solid <bg-color>; border-radius: 2px;`
- **Small** (nav CTA, inline register): same, `font-size: 16px; padding: 11px 22px;`

Solid/primary: `background: #E84A1A; border: 1.5px solid #E84A1A` (border always present, matches fill — keeps solid/ghost the same height), `color: #FFFFFF`, hover → `#B83A12`.
Ghost/outline: `background: transparent`, border `1.5px solid rgba(255,255,255,0.2)` or `1.5px solid #2A2A2A` depending on context, hover → orange text/border.
`line-height: 1` is mandatory, especially on `<a>` tags styled as buttons.

## Layout

- Section container width: `max-w-[1440px]`, used sitewide — don't introduce a competing container width.
- `img` elements get a 1px outline (`outline: 1px solid rgba(255,255,255,0.1)`) globally via `@layer base` — don't re-add per-component image borders.
- `h1`–`h6` use `text-wrap: balance`, `p` uses `text-wrap: pretty` globally — don't override per-component.

## Motion

- Reusable animation/transition classes already exist: `.cz-reveal`/`.cz-reveal-hidden` (scroll reveal), `.cz-card-lift` (hover lift), `.cz-link-underline` (underline-in). Prefer these over ad-hoc new keyframes.
- All custom animations must degrade under `@media (prefers-reduced-motion: reduce)` — follow the existing pattern in `globals.css` (duration→`0.01ms`, transitions off) rather than skipping the guard.
- Standard easing: `cubic-bezier(0.2, 0, 0, 1)`.

## Scope discipline

- `Pricing.tsx` and its admin counterpart (`admin/(protected)/pricing/PricingClient.tsx`) are mid-redesign as a separate effort — don't touch them incidentally while doing sitewide sweeps unless the task is specifically about pricing.
- Marketing-homepage sections may be pinned to an exhaustive reference mockup during a rework; other surfaces (admin, modals, reservation flow, legal pages) generally only need the *general* rules (banned colors/weights) applied, not a full redesign, unless a task says otherwise.
- Don't change layout, copy, or component structure incidental to a styling task — sizes/colors/weights/radii only, unless asked.

## i18n

All user-facing strings go through next-intl (`messages/cs.json`, `messages/en.json`), matching the existing per-file namespace pattern — don't hardcode new UI text unless the file already does so for other strings in the same namespace.

## Verification

Run `npx tsc --noEmit` after any component edit. There's no automated visual test — for UI changes, run `npm run dev` and check the page before claiming done.
