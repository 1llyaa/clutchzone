# Typography V2 Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Typografie V2 variant 1A typography spec (Space Mono for all UI/body text, Bebas Neue for display, min 16px, no gray-as-text) sitewide, replacing Inter, with every size bump landing on one fixed canonical scale so the result is numerically consistent across all ~40 files instead of a per-file judgment call.

**Architecture:** One shared-token fix in `globals.css`/`layout.tsx` converts font-family for ~70 `font-body` call sites in a single edit. Every other file gets a mechanical, rule-driven pass: any text below 16px is bumped to one of exactly three sizes (16/17/19) chosen by a fixed classification rule (not per-element taste), and any text colored `#555555`/`cz-gray-mid` is recolored since that color is banned for text. No layout, copy, or component-structure changes.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4 (`@theme` tokens), TypeScript, next-intl.

**Spec:** `clutchzonev2/Typografie V2.dc.html` (variant 1A) and `clutchzonev2/Web V2.dc.html` (applied mockup of the real site's sections) — both in repo root. This plan's Global Constraints section is the canonical, deterministic distillation of those two docs plus a scope clarification agreed in chat (whole site, not just marketing sections; named tokens in `globals.css`; drop Inter completely; fixed size table instead of ad hoc per-element sizing).

## Global Constraints

- **Drop Inter completely.** Remove it from the Google Fonts `<link>` in `src/app/[locale]/layout.tsx`. In `src/app/globals.css`, change `--font-body: 'Inter', sans-serif;` to `--font-body: 'Space Mono', monospace;`. This alone fixes font-family for every element already using `className="font-body"` (~70 call sites) — do not hand-edit font-family in those files.
- **No text below 16px anywhere, no exceptions.**
- **`#555555` / `text-cz-gray-mid` is banned as a text color.** It stays legal only for: borders, dividers, background fills, and disabled/inactive icon glyphs (arrows, `×` close icons) that switch to gray-light/white on hover or active state (the `hover:text-white` pattern already used everywhere). If in doubt whether something is "text" — if a human reads it as a word/number/label, it's text.
- **Deterministic bump rule** — for every current `fontSize`/`text-[Npx]` below 16, classify by what's already on the element. Do not improvise case-by-case; the same element type gets the same size everywhere:
  1. `uppercase` + letter-spaced (eyebrows/kickers, badges, pills, nav links, table `<th>` headers, uppercase form `<label>`s, status tags, unit suffixes like "KČ"/"H", small pill CTAs) → **16px**.
  2. Sentence-case short fragment or secondary value (table `<td>` data, helper/hint text under inputs, captions, slot-count fragments like `/32`, small legal/copyright lines, disabled placeholder text) → **17px**.
  3. Sentence-case full sentence / primary paragraph copy (descriptions, modal body messages, empty-state sentences, text the user types into an input) → **19px**.
  4. Never introduce a new 22px ("lead") usage in this pass. That size stays reserved for the one existing large intro paragraph context (Hero subhead) — leave it as-is, don't touch it, don't spread 22 elsewhere.
- **16 / 17 / 19 / 22 are the only mono/body sizes this pass produces.** Whichever bucket a violation lands in, use exactly that number — not 15, not 18, not 20.
- **Sizes that are already ≥16px are out of scope.** Don't renormalize pre-existing compliant sizes (e.g. an existing 18px or 20px) even if they look inconsistent with the new scale — this pass only fixes actual violations (sub-16 sizes, and gray-mid-as-text), it does not redesign already-compliant spots.
- **`Button.tsx` `sm` size is the one `font-display` (Bebas) exception in scope**: its 15px violates the 16px floor, fix it in Task 1.
- Add reference tokens to `globals.css` `@theme` for documentation/future reuse: `--text-label: 16px`, `--text-secondary: 17px`, `--text-body: 19px`, `--text-lead: 22px` (mono scale) and `--text-display-hero: 96px`, `--text-display-section: 64px`, `--text-display-subsection: 40px`, `--text-display-card: 32px` (Bebas scale, informational — existing Bebas headings are already compliant and are not being migrated to these tokens this pass). **Do not** migrate existing `style={{ fontSize: N }}` call sites to className-based token usage — the codebase's established pattern is inline `style` objects; keep that pattern, just make `N` one of the canonical numbers. Introducing a parallel className convention mid-file would be an unrelated, riskier refactor.
- No git commits as part of any task — verification only. Commit at the end only if the user asks.

---

### Task 1: Foundation — font tokens + Button fix

**Files:**
- Modify: `src/app/globals.css:16-18` (theme font tokens), add scale tokens nearby
- Modify: `src/app/[locale]/layout.tsx:74-77` (Google Fonts link)
- Modify: `src/components/ui/Button.tsx:24` (`sm` size fontSize)

**Interfaces:**
- Produces: `--font-body` token now resolves to Space Mono for every downstream task's `font-body` usages. All later tasks depend on this being done first.

- [ ] **Step 1: Update `globals.css` font tokens**

In `src/app/globals.css`, change:
```css
  --font-display: 'Bebas Neue', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'Space Mono', monospace;
```
to:
```css
  --font-display: 'Bebas Neue', sans-serif;
  --font-body: 'Space Mono', monospace;
  --font-mono: 'Space Mono', monospace;

  --text-label: 16px;
  --text-secondary: 17px;
  --text-body: 19px;
  --text-lead: 22px;
  --text-display-card: 32px;
  --text-display-subsection: 40px;
  --text-display-section: 64px;
  --text-display-hero: 96px;
```

- [ ] **Step 2: Drop Inter from the Google Fonts link**

In `src/app/[locale]/layout.tsx`, change:
```tsx
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
```
to:
```tsx
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap"
```

- [ ] **Step 3: Fix `Button.tsx` `sm` size**

In `src/components/ui/Button.tsx:24`, change:
```ts
    sm: { fontSize: 15, padding: '9px 22px', letterSpacing: 2, borderWidth: '1.5px' },
```
to:
```ts
    sm: { fontSize: 16, padding: '9px 22px', letterSpacing: 2, borderWidth: '1.5px' },
```

- [ ] **Step 4: Verify**

Run: `grep -n "Inter" src/app/globals.css src/app/[locale]/layout.tsx`
Expected: no output (no remaining Inter references).

Run: `npx tsc --noEmit`
Expected: no new errors.

---

### Task 2: Navbar + Footer

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/Footer.tsx`

**Interfaces:** Consumes: Task 1's `--font-body` token (no direct code dependency, just must run after).

**Current violations to fix (`Navbar.tsx`):**
- `:45` desktop nav link `fontSize: 12` (uppercase link) → **16**
- `:58` locale switch button `fontSize: 11, color: locale === l ? '#E84A1A' : '#555'` (uppercase label) → `fontSize: 16`; recolor the `'#555'` branch to `'#888888'` (cz-gray-light) since gray-mid is banned as text
- `:118` mobile nav link `fontSize: 13` (uppercase link) → **16**
- `:129` mobile locale switch `fontSize: 11, color: ... '#555'` → same fix as `:58`: `fontSize: 16`, recolor `'#555'` → `'#888888'`
- `:138` mobile CTA button `fontSize: 15` → **16**

**Current violations to fix (`Footer.tsx`):**
- `:35` "OTEVÍRACÍ DOBA" eyebrow `fontSize: 10` (uppercase) → **16**
- `:44` hours day label `fontSize: 11` (uppercase) → **16**
- `:51` hours time value `fontSize: 11`, `color: row.closed ? '#555' : '#E8E8E8'` (uppercase) → `fontSize: 16`; recolor closed branch `'#555'` → `'#888888'`
- `:74` footer link (Instagram/Discord/Kontakt) `fontSize: 12` (uppercase) → **16**
- `:83` copyright `text-cz-gray-mid`, `fontSize: 11` → `fontSize: 16`, change `className="font-mono text-cz-gray-mid"` → `className="font-mono text-cz-gray-light"`
- `:96` legal line (owner/IČO/address) `text-cz-gray-mid`, `fontSize: 11` → `fontSize: 16`, `text-cz-gray-mid` → `text-cz-gray-light`
- `:103` "OBCHODNÍ PODMÍNKY" link `fontSize: 11` (uppercase) → **16**
- `:110` "OCHRANA OSOBNÍCH ÚDAJŮ" link `fontSize: 11` (uppercase) → **16**

- [ ] **Step 1: Apply the fixes above to `Navbar.tsx`**
- [ ] **Step 2: Apply the fixes above to `Footer.tsx`**
- [ ] **Step 3: Verify**

Run: `grep -n "fontSize: 1[0-5]\b" src/components/layout/Navbar.tsx src/components/layout/Footer.tsx`
Expected: no output.

Run: `grep -n "'#555'" src/components/layout/Navbar.tsx src/components/layout/Footer.tsx`
Expected: no output (all recolored to `#888888` / `cz-gray-light`).

---

### Task 3: Hero

**Files:**
- Modify: `src/components/sections/Hero.tsx`

**Current violations to fix:**
- `:54` eyebrow `fontSize: 12` (uppercase) → **16**
- `:113` stat label (e.g. "HERNÍCH STANIC") `fontSize: 11` (uppercase) → **16**
- `:130` mobile station-counter badge text `fontSize: 11` (uppercase) → **16**
- `:215` desktop station-counter badge text `fontSize: 11` (uppercase) → **16**
- `:225` "SCROLL" label, currently `text-cz-gray-mid`, `fontSize: 10` (uppercase) → `fontSize: 16`; recolor `text-cz-gray-mid` → `text-cz-gray-light`

Leave the hero `<h1>` (`clamp(44px, 7.2vw, 104px)`), subhead paragraph (`clamp(15px, 2vw, 19px)` — this is the reserved lead-ish context, don't touch), CTA buttons (`clamp(15px, 2vw, 19px)`), and stat numbers (`clamp(32px, 4vw, 44px)`) untouched — all already ≥16 at their floor, out of scope.

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-5]\b\|gray-mid" src/components/sections/Hero.tsx`
Expected: no output.

---

### Task 4: Features + Games

**Files:**
- Modify: `src/components/sections/Features.tsx`
- Modify: `src/components/sections/Games.tsx`

**Current violations (`Features.tsx`):**
- `:24` eyebrow `fontSize: 11` (uppercase) → **16**
- `:43` card number badge (e.g. "01") `fontSize: 13` — check context: if uppercase/tracked treat as label → **16**; if it's a plain digit with no letter-spacing, it's still short/secondary → **17**. Read the surrounding JSX to confirm which; card index numbers next to headings are typically label-style in this codebase (bold, tracked) → default to **16** unless the element has no `uppercase`/`letterSpacing`, then use **17**.

**Current violations (`Games.tsx`):**
- `:48` "NO IMAGE" placeholder `fontSize: 12` (uppercase) → **16**
- `:85` note paragraph under section `fontSize: 12`, `text-cz-gray-light` — if full sentence → **19**; if short fragment → **17**. Read the translation key content; if it's a full sentence (game library note), use **19**.
- `:124` game card platform/genre tag `fontSize: 11` (uppercase per card styling) → **16**

- [ ] **Step 1: Read both files, apply the fixes above using the Global Constraints classification rule**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-5]\b\|gray-mid" src/components/sections/Features.tsx src/components/sections/Games.tsx`
Expected: no output (except any `text-cz-gray-mid` left correctly on a non-text use like a border/icon — none expected in these two files).

---

### Task 5: Stream + Tournaments

**Files:**
- Modify: `src/components/sections/Stream.tsx`
- Modify: `src/components/sections/Tournaments.tsx`

**Current violations (`Stream.tsx`):**
- `:56` fontSize 11 (uppercase live-label context) → **16**
- `:99` fontSize 11 → **16**

**Current violations (`Tournaments.tsx`):**
- `:70` fontSize 11 (uppercase eyebrow) → **16**
- `:81` empty-state message, `text-cz-gray-mid`, `fontSize: 12` (uppercase per `className`) → `fontSize: 16`, recolor `text-cz-gray-mid` → `text-cz-gray-light`
- `:104` year tag, `text-cz-gray-mid`, `fontSize: 11` → `fontSize: 16`, recolor `text-cz-gray-mid` → `text-cz-gray-light`
- `:106` fontSize 11 → **16**
- `:117` "PRIZE POOL" label, `text-cz-gray-mid` uppercase, `fontSize: 10` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:123` "REGISTROVÁNO" label, `text-cz-gray-mid` uppercase, `fontSize: 10` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:125` `/{max_slots}` fragment, `text-cz-gray-mid`, `fontSize: 14` (short secondary fragment, not uppercase) → `fontSize: 17`, recolor `text-cz-gray-mid` → `text-cz-gray-light`
- `:133` "PŘIHLÁSIT" button, `fontSize: 15`, color `isFull ? '#555' : '#fff'` → `fontSize: 16`; recolor the full-state color from `'#555'` to `'#888888'`
- `:145` mobile year tag `fontSize: 10` → **16** (mirror `:104`, recolor `text-cz-gray-mid` → `text-cz-gray-light`)
- `:164` mobile "PRIZE POOL" label `fontSize: 9` → **16** (mirror `:117`)
- `:171` mobile "REGISTROVÁNO" label `fontSize: 9` → **16** (mirror `:123`)
- `:173` mobile `/{max_slots}` `fontSize: 12` → **17** (mirror `:125`)
- `:181` fontSize 13 → check context (likely a card title/value; if sentence-case primary text → **19**, if secondary → **17**)

- [ ] **Step 1: Apply the fixes above to both files**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: [1-9]\b\|fontSize: 1[0-5]\b" src/components/sections/Stream.tsx src/components/sections/Tournaments.tsx`
Expected: no output.

Run: `grep -n "'#555'" src/components/sections/Tournaments.tsx`
Expected: no output.

---

### Task 6: Gallery + PrivateEvents

**Files:**
- Modify: `src/components/sections/Gallery.tsx`
- Modify: `src/components/sections/PrivateEvents.tsx`

**Current violations (`Gallery.tsx`):**
- `:45` fontSize 12 → classify (caption over image, likely uppercase tag) → **16**
- `:87` fontSize 14 → likely sentence-case short caption → **17**
- `:138` fontSize 12 → **16** (mirror `:45` pattern)
- `:164` fontSize 12 → **16**
- `:189` fontSize 11 → **16**
- `:55` (CSS-in-JS, not a React style prop) `.swiper-pagination-bullet { background: #555 !important; }` — this is a **decorative UI dot, not text** — leave unchanged, it's an allowed non-text use of gray-mid.

**Current violations (`PrivateEvents.tsx`):**
- `:37` eyebrow `fontSize: 11` (uppercase) → **16**
- `:43` description paragraph `fontSize: 15`, `text-cz-gray-light` — full sentence → **19**
- `:48` "CENA" label `text-cz-gray-mid` uppercase `fontSize: 10` → `fontSize: 16`, recolor `text-cz-gray-mid` → `text-cz-gray-light`
- `:59` fontSize 15 → check context; if primary sentence → **19**, if short label → **17**

- [ ] **Step 1: Apply fixes to both files (leave `Gallery.tsx:55` CSS bullet color untouched)**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-5]\b" src/components/sections/Gallery.tsx src/components/sections/PrivateEvents.tsx`
Expected: no output.

Run: `grep -n "gray-mid" src/components/sections/PrivateEvents.tsx`
Expected: no output.

---

### Task 7: Contact + CtaBand

**Files:**
- Modify: `src/components/sections/Contact.tsx`
- Modify: `src/components/sections/CtaBand.tsx`

**Current violations (`Contact.tsx`):**
- `:54` eyebrow `fontSize: 11` (uppercase) → **16**
- `:60` subtext paragraph `fontSize: 15`, `text-cz-gray-light` — full sentence → **19**
- `:72` info label (e.g. "ADRESA"), `text-cz-gray-mid` uppercase, `fontSize: 10` → `fontSize: 16`, recolor `text-cz-gray-mid` → `text-cz-gray-light`
- `:73` info value `fontSize: 15` → sentence-case value, short → **17** (it's a data value like an address/phone, not a full sentence)
- `:91` "Odeslat další zprávu" button `fontSize: 11` (uppercase) → **16**
- `:99` form label `fontSize: 10` (uppercase) → **16**
- `:110` name input text `fontSize: 14` → user-typed input text, treat as body content → **19**
- `:115` form label `fontSize: 10` (uppercase) → **16**
- `:125` email input text `fontSize: 14` → **19**
- `:130` form label `fontSize: 10` (uppercase) → **16**
- `:141` message textarea text `fontSize: 14` → **19**
- `:146` error message `fontSize: 11` — full short sentence → **17** (error text, brief, not uppercase — secondary bucket)
- `:153` submit button `fontSize: 15` → **16** (this is a `font-display` uppercase button matching the Button.tsx `md`/nav CTA pattern — 16 is the floor; if you want it visually to match other primary CTAs elsewhere at 19, check `Button.tsx` md size (19) and match that instead — use **19** to be consistent with every other primary CTA button sitewide, which are all `font-display` at 19+)

**Current violations (`CtaBand.tsx`):**
- `:70` fontSize 12 → classify (likely an uppercase eyebrow above the final CTA heading, matching every other section's eyebrow pattern) → **16**

- [ ] **Step 1: Apply the fixes above to both files**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-4]\b" src/components/sections/Contact.tsx src/components/sections/CtaBand.tsx`
Expected: no output.

Run: `grep -n "gray-mid" src/components/sections/Contact.tsx`
Expected: no output.

---

### Task 8: Pricing

**Files:**
- Modify: `src/components/sections/Pricing.tsx`

**Current violations:**
- `:45` eyebrow `fontSize: 11` (uppercase) → **16**
- `:64` "PC CENÍK" label `fontSize: 11` (uppercase) → **16**
- `:71` duration label (e.g. "1H") `fontSize: 11` (uppercase) → **16**
- `:77` "KČ" unit, `text-cz-gray-mid`, `fontSize: 10` → `fontSize: 16`, recolor `text-cz-gray-mid` → `text-cz-gray-light`
- `:91` "PS5 CENÍK" label `fontSize: 11` (uppercase) → **16**
- `:97` duration label `fontSize: 11` (uppercase) → **16**
- `:103` "KČ" unit, `text-cz-gray-mid`, `fontSize: 10` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:107` PS5 note, `text-cz-gray-mid` uppercase, `fontSize: 10` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:116` "Balíčky" heading label `fontSize: 11` (uppercase) → **16**
- `:183` package name `fontSize: 11` (uppercase) → **16**
- `:186` package time, `text-cz-gray-mid` uppercase, `fontSize: 10` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:212` info notes, `text-cz-gray-mid`, `fontSize: 10` → `fontSize: 16`, recolor → `text-cz-gray-light`

Leave `:193` (`fontSize: 18`, package unit "Kč/hod") untouched — already ≥16, out of scope per Global Constraints.

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-5]\b\|gray-mid" src/components/sections/Pricing.tsx`
Expected: no output.

---

### Task 9: Tournament modals

**Files:**
- Modify: `src/components/tournament/TournamentDetailModal.tsx`
- Modify: `src/components/tournament/TournamentRegisterModal.tsx`

**Current violations (`TournamentDetailModal.tsx`):**
- `:58` fontSize 10 → classify (likely uppercase label) → **16**
- `:64` fontSize 11, `text-cz-gray-mid` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:81` "PRIZE POOL" label, `text-cz-gray-mid` uppercase, `fontSize: 10` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:87` "REGISTROVÁNO" label, `text-cz-gray-mid` uppercase, `fontSize: 10` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:89` `/{max_slots}` fragment, `text-cz-gray-mid`, `fontSize: 13` → `fontSize: 17`, recolor → `text-cz-gray-light`
- `:97` description paragraph (`font-body text-cz-white-soft`) `fontSize: 14` → full sentence → **19**
- `:107` fontSize 15 → check context, likely secondary → **17**
- `:114` close/cancel action `fontSize: 15` (uppercase per `font-display`) → **16**

**Current violations (`TournamentRegisterModal.tsx`):**
- `:117` fontSize 10 (uppercase label context, mirrors `:81`/`:87` pattern) → **16**
- `:123` fontSize 11, `text-cz-gray-mid` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:144` description paragraph `fontSize: 15` → full sentence → **19**
- `:151` fontSize 15 → **17** (secondary) unless it's a full sentence, then **19**
- `:162` fontSize 10 (uppercase form label) → **16**
- `:173` input text `fontSize: 14` → **19** (user-typed content, mirror Contact.tsx form inputs)
- `:179` fontSize 10 (uppercase form label) → **16**
- `:190` input text `fontSize: 14` → **19**
- `:196` fontSize 10 (uppercase form label) → **16**
- `:206` input text `fontSize: 14` → **19**
- `:212` fontSize 10 (uppercase form label) → **16**
- `:222` input text `fontSize: 14` → **19**
- `:228` fontSize 10 (uppercase form label) → **16**
- `:230` "(nepovinné)" note, `text-cz-gray-mid`, `fontSize: 11` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:240` textarea text `fontSize: 14` → **19**
- `:246` fontSize 11 → **16** (uppercase label context)
- `:256` submit button `fontSize: 15` → **19** (match Button.tsx `md` / other primary CTAs)
- `:264` cancel action `fontSize: 15` (uppercase, `text-cz-gray-mid` per grep) → `fontSize: 16`, recolor `text-cz-gray-mid` → `text-cz-gray-light`

- [ ] **Step 1: Apply the fixes above to both files**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-4]\b" src/components/tournament/TournamentDetailModal.tsx src/components/tournament/TournamentRegisterModal.tsx`
Expected: no output.

Run: `grep -n "gray-mid" src/components/tournament/TournamentDetailModal.tsx src/components/tournament/TournamentRegisterModal.tsx`
Expected: no output (unless left correctly on a hover-target class like `hover:text-white` transition base that is not itself the resting text color — read each remaining hit to confirm it's not a resting text color).

---

### Task 10: ReservationModal, CookieBar, Tooltip

**Files:**
- Modify: `src/components/reservation/ReservationModal.tsx`
- Modify: `src/components/layout/CookieBar.tsx`
- Modify: `src/components/ui/Tooltip.tsx`

**Current violations:**
- `ReservationModal.tsx:105` fontSize 10 → classify (progress-step label, uppercase) → **16**
- `CookieBar.tsx:33` fontSize 13, `text-cz-gray-light` — full sentence (cookie notice text) → **19**
- `CookieBar.tsx:42` fontSize 13 → check context: if a button/link label → **16**; if more notice text → **19**
- `Tooltip.tsx:45` fontSize 11 → **17** (tooltip body text is short secondary text, not uppercase)

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-5]\b" src/components/reservation/ReservationModal.tsx src/components/layout/CookieBar.tsx src/components/ui/Tooltip.tsx`
Expected: no output.

---

### Task 11: StepContact, StepType

**Files:**
- Modify: `src/components/reservation/steps/StepContact.tsx`
- Modify: `src/components/reservation/steps/StepType.tsx`

**Current violations (`StepContact.tsx`):**
- `:23` fontSize 10 (uppercase field label) → **16**
- `:32` input text `fontSize: 14` → **19** (user-typed content, mirror Contact.tsx)
- `:61` fontSize 11 → **16** or **17** — read context (if uppercase label → 16, else 17)
- `:69` fontSize 10, `text-cz-gray-mid` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:79` fontSize 11 → classify per rule
- `:88` fontSize 15 → likely a button, uppercase → **16** unless matching other primary CTAs → **19**
- `:97` fontSize 15 → same treatment as `:88`
- `:24` `text-cz-gray-mid` "(nepovinné)" inline note — currently no explicit fontSize override (inherits parent label's `fontSize: 10` from `:23`, which you're already bumping to 16) → after `:23`'s fix this inherits 16; still recolor this span from `text-cz-gray-mid` to `text-cz-gray-light` since it's rendered text
- `:31` placeholder color inherits from `::placeholder { color: #888888 }` global rule (see `Web V2.dc.html` — already gray-light, not gray-mid) — no change needed for the placeholder itself, but the `placeholder:text-cz-gray-mid` class name here should change to `placeholder:text-cz-gray-light` to stop using gray-mid for placeholder text

**Current violations (`StepType.tsx`):**
- `:60` fontSize 10 → **16** (uppercase label per `className` pattern)
- `:65` fontSize 10, `text-cz-gray-mid` uppercase → `fontSize: 16`, recolor → `text-cz-gray-light`

- [ ] **Step 1: Apply the fixes above to both files**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-5]\b\|gray-mid" src/components/reservation/steps/StepContact.tsx src/components/reservation/steps/StepType.tsx`
Expected: no output (except any confirmed non-text use, none expected here).

---

### Task 12: StepDuration, StepDateTime

**Files:**
- Modify: `src/components/reservation/steps/StepDuration.tsx`
- Modify: `src/components/reservation/steps/StepDateTime.tsx`

**Current violations (`StepDuration.tsx`):**
- `:50` fontSize 11 → classify per rule
- `:81` fontSize 10, `text-cz-gray-light` → check: if uppercase small label → **16**
- `:86` fontSize 10, `text-cz-gray-light` → same as `:81` → **16**
- `:92` fontSize 13, `text-cz-gray-light` "Kč/hod"-style unit, not uppercase → **17**
- `:102` fontSize 10, `text-cz-gray-mid` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:108` fontSize 11 → classify per rule
- `:118` fontSize 15 → button/CTA-style → **16** or **19** matching sibling primary buttons
- `:127` fontSize 15 → same as `:118`

**Current violations (`StepDateTime.tsx`):**
- `:47` fontSize 10 → **16** (label)
- `:62` fontSize 14 → check: date/time value display, sentence-ish → **17** (short value) unless it reads as a full instruction sentence, then **19**
- `:77` fontSize 11 → classify per rule
- `:88` fontSize 10 → **16**
- `:104` fontSize 12 → classify per rule
- `:125` fontSize 10 → **16**
- `:150` fontSize 15, color `canProceed ? '#fff' : '#555'` → this is a CTA button; fix size to **19** (match other primary CTAs) and recolor the disabled `'#555'` branch to `'#888888'`
- `:159` fontSize 15 → same treatment, check if also has a `'#555'` disabled-state color to fix

- [ ] **Step 1: Apply the fixes above to both files**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-4]\b" src/components/reservation/steps/StepDuration.tsx src/components/reservation/steps/StepDateTime.tsx`
Expected: no output.

Run: `grep -n "'#555'" src/components/reservation/steps/StepDuration.tsx src/components/reservation/steps/StepDateTime.tsx`
Expected: no output.

---

### Task 13: StepPayment, StepDone

**Files:**
- Modify: `src/components/reservation/steps/StepPayment.tsx`
- Modify: `src/components/reservation/steps/StepDone.tsx`

**Current violations (`StepPayment.tsx`):**
- `:66` fontSize 10 → **16**
- `:81` fontSize 10 → **16**
- `:84` fontSize 12 → classify per rule
- `:89` fontSize 10 → **16**
- `:110` fontSize 13 → classify per rule (likely a value/summary line → **17**)
- `:116` fontSize 10 → **16**
- `:124` fontSize 11 → classify per rule

**Current violations (`StepDone.tsx`):**
- `:21` fontSize 10 → **16**
- `:36` fontSize 10 → **16**
- `:39` fontSize 12 → classify per rule
- `:44` fontSize 10 → **16**
- `:47` fontSize 12 → classify per rule
- `:52` fontSize 10 → **16**
- `:61` fontSize 14, `text-cz-gray-light` — full sentence (confirmation copy) → **19**

- [ ] **Step 1: Apply the fixes above to both files**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-3]\b" src/components/reservation/steps/StepPayment.tsx src/components/reservation/steps/StepDone.tsx`
Expected: no output.

---

### Task 14: AdminSidebar, AdminNotifications

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/components/admin/AdminNotifications.tsx`

**Current violations (`AdminSidebar.tsx`):**
- `:67` fontSize 15 → nav-item label, likely uppercase → **16**
- `:87` fontSize 11, `text-cz-gray-mid` uppercase → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:115` fontSize 13, admin display name (sentence-case) → **17**
- `:130` fontSize 10, `text-cz-gray-mid` uppercase (logout/link) → `fontSize: 16`, recolor → `text-cz-gray-light`

**Current violations (`AdminNotifications.tsx`):**
- `:213` fontSize 10 → **16**
- `:232` fontSize 10 → **16**
- `:247` fontSize 10 → **16**
- `:260` empty-state message, `text-cz-gray-mid` uppercase, `fontSize: 11` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:274` fontSize 9, `text-cz-gray-mid` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:278` notification body `fontSize: 12`, `text-cz-white-soft` — full sentence → **19**
- `:297` fontSize 10 → **16**
- `:299` notification body `fontSize: 13`, `text-cz-white-soft` — full sentence → **19**

- [ ] **Step 1: Apply the fixes above to both files**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: [1-9]\b\|fontSize: 1[0-5]\b" src/components/admin/AdminSidebar.tsx src/components/admin/AdminNotifications.tsx`
Expected: no output.

Run: `grep -n "gray-mid" src/components/admin/AdminSidebar.tsx src/components/admin/AdminNotifications.tsx`
Expected: no output (unless a confirmed hover-only/non-text use remains).

---

### Task 15: Admin dashboard (`page.tsx`)

**Files:**
- Modify: `src/app/[locale]/admin/(protected)/page.tsx`

**Current violations:**
- `:69` fontSize 11, `text-cz-gray-mid` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:82` fontSize 10, `text-cz-gray-mid` uppercase → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:89` fontSize 11 → **16**
- `:109` fontSize 10 → **16**
- `:123` table `<th>` headers, `text-cz-gray-mid` uppercase, `fontSize: 10` → `fontSize: 16`, recolor → `text-cz-gray-light`
- `:133` empty-state row, `text-cz-gray-mid`, `fontSize: 12` → `fontSize: 17` (short fragment, not full sentence — table empty cell), recolor → `text-cz-gray-light`
- `:143` fontSize 12 → classify per rule (table cell data → **17**)
- `:146` table `<td>` value `fontSize: 13` → **17**
- `:149` fontSize 12 → **17**
- `:152` fontSize 12 → **17**
- `:155` fontSize 12 → **17**
- `:158` table `<td>` value `fontSize: 13` → **17**

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-3]\b" "src/app/[locale]/admin/(protected)/page.tsx"`
Expected: no output.

Run: `grep -n "gray-mid" "src/app/[locale]/admin/(protected)/page.tsx"`
Expected: no output.

---

### Task 16: Admin settings (`SettingsClient.tsx`)

**Files:**
- Modify: `src/app/[locale]/admin/(protected)/settings/SettingsClient.tsx`

This file has the largest number of violations (lines 223, 230, 251, 270, 278, 290, 311, 330, 338, 350, 358, 378, 388, 394, 399, 407, 418, 426, 436, 442, 452, 463, 472, 481, 484, 501, 510, 528, 538, 545, 553, 562, 569, 579, 603, 613 — all `fontSize` under 16 — plus every `text-cz-gray-mid` hit found by grep in this file).

- [ ] **Step 1: Read the full file**
- [ ] **Step 2: For every `fontSize` below 16, apply the Global Constraints classification rule** (uppercase/tracked label → 16, sentence-case short/table-cell value → 17, full-sentence paragraph or user-typed input text → 19)
- [ ] **Step 3: For every `text-cz-gray-mid` used as a text color (labels, `<th>` headers, table `<td>` values, helper text), recolor to `text-cz-gray-light`.** Leave any use that's purely a border/divider/disabled icon.
- [ ] **Step 4: Verify**

Run: `grep -n "fontSize: [1-9]\b\|fontSize: 1[0-5]\b" "src/app/[locale]/admin/(protected)/settings/SettingsClient.tsx"`
Expected: no output.

Run: `grep -n "gray-mid" "src/app/[locale]/admin/(protected)/settings/SettingsClient.tsx"`
Expected: no output, or only confirmed non-text uses.

---

### Task 17: Admin bookings (`BookingsClient.tsx`)

**Files:**
- Modify: `src/app/[locale]/admin/(protected)/bookings/BookingsClient.tsx`

Violations at lines 154, 162 ("OD" label), 168, 171 ("–" separator, short fragment → 17), 173 ("DO" label), 180, 191, 203, 215, 216 (`color: state === 'occupied' ? '#E84A1A' : '#555'` — station-grid glyph; recolor the `'#555'` branch to `'#888888'` and bump `fontSize: 8` → **16**), 224, 236, 237 (same `'#555'` pattern as `:216`, recolor + bump `fontSize: 8` → **16**), 257, 266, 276, 277, 279, 281, 284, 286, 290, 291, 292, 305, 319, 336, 339 ("×" close button `text-cz-gray-mid`, decorative icon glyph — bump `fontSize: 18` is already ≥16, only recolor is optional/skip since it's an icon, not text — leave as-is), 359, 360, 372, 380, 390.

- [ ] **Step 1: Read the full file**
- [ ] **Step 2: For every `fontSize` below 16 (except the `×` icon glyph at `:339`, which is already 18px and decorative — leave it), apply the classification rule**
- [ ] **Step 3: For every `text-cz-gray-mid`/`'#555'` used as text (labels, `<th>`, `<td>` values, day/time text, "OD"/"DO" labels), recolor to gray-light. Leave grid-state glyph colors that already switch to orange/white on active state — only fix the resting `'#555'` branch to `'#888888'`.**
- [ ] **Step 4: Verify**

Run: `grep -n "fontSize: [1-9]\b\|fontSize: 1[0-5]\b" "src/app/[locale]/admin/(protected)/bookings/BookingsClient.tsx"`
Expected: no output except the confirmed-fine `:339` icon (if you left it — re-check it's ≥16, which it is at 18).

Run: `grep -n "'#555'" "src/app/[locale]/admin/(protected)/bookings/BookingsClient.tsx"`
Expected: no output.

---

### Task 18: Admin messages (`MessagesClient.tsx`)

**Files:**
- Modify: `src/app/[locale]/admin/(protected)/messages/MessagesClient.tsx`

Violations at lines 48, 62, 80/81 (`font-body`, `fontSize: 13` — check if list-row preview text, sentence fragment → **17**), 89 (`font-body text-cz-gray-mid truncate`, `fontSize: 12` — truncated preview line, short fragment → `fontSize: 17`, recolor `text-cz-gray-mid` → `text-cz-gray-light`), 92, 114, 117, 125, 133, 140 (`font-body text-cz-white-soft`, `fontSize: 15` — full message body → **19**), 150.

- [ ] **Step 1: Read the full file**
- [ ] **Step 2: Apply the classification rule to every violation listed above**
- [ ] **Step 3: Recolor `text-cz-gray-mid` text uses (line 89 and any `<th>`/label found while reading) to `text-cz-gray-light`**
- [ ] **Step 4: Verify**

Run: `grep -n "fontSize: [1-9]\b\|fontSize: 1[0-5]\b" "src/app/[locale]/admin/(protected)/messages/MessagesClient.tsx"`
Expected: no output.

Run: `grep -n "gray-mid" "src/app/[locale]/admin/(protected)/messages/MessagesClient.tsx"`
Expected: no output.

---

### Task 19: Admin tournaments (`TournamentsClient.tsx`)

**Files:**
- Modify: `src/app/[locale]/admin/(protected)/tournaments/TournamentsClient.tsx`

Violations at lines 171, 178, 185, 196 (`<th>` header), 203 (empty state, `text-cz-gray-mid`), 216, 219 (`<td>` value), 220, 221, 222 (`<td>` value), 230, 244, 247, 248, 263, 265, 273 (close `×` icon, `text-cz-gray-mid`, `fontSize: 20` — already ≥16, decorative, leave), 278, 279 (description paragraph `font-body text-cz-white-soft`, `fontSize: 13` — full sentence → **19**), 285, 287, 325, 326 (`<div>` value, `fontSize: 13` → **17**), 334, 337 (button, `font-display uppercase text-cz-gray-mid`, `fontSize: 13` → `fontSize: 16`, recolor `text-cz-gray-mid` → `text-cz-gray-light`), 340, 349, 411, 417, 422, 429, 434, 437 (button, same pattern as `:437` grep hit `font-display uppercase text-cz-gray-mid`, `fontSize: 13` → `fontSize: 16`, recolor).

- [ ] **Step 1: Read the full file**
- [ ] **Step 2: Apply the classification rule to every violation, leaving the `×` close icon at `:273` untouched (already ≥16, decorative)**
- [ ] **Step 3: Recolor every `text-cz-gray-mid` text use (labels, `<th>`, `<td>` values, the two cancel buttons) to `text-cz-gray-light`**
- [ ] **Step 4: Verify**

Run: `grep -n "fontSize: [1-9]\b\|fontSize: 1[0-5]\b" "src/app/[locale]/admin/(protected)/tournaments/TournamentsClient.tsx"`
Expected: no output except the confirmed `:273` icon.

Run: `grep -n "gray-mid" "src/app/[locale]/admin/(protected)/tournaments/TournamentsClient.tsx"`
Expected: no output.

---

### Task 20: Admin gallery + games (`GalleryClient.tsx`, `GamesClient.tsx`)

**Files:**
- Modify: `src/app/[locale]/admin/(protected)/gallery/GalleryClient.tsx`
- Modify: `src/app/[locale]/admin/(protected)/games/GamesClient.tsx`

**`GalleryClient.tsx` violations:** 128, 135 ("TYP ZOBRAZENÍ" label), 142 (`color: displayType === dt.value ? '#fff' : '#555'` — toggle text, recolor resting `'#555'` → `'#888888'`, bump `fontSize: 10` → **16**), 177, 181, 190, 192, 214, 220, 238, 240, 245 (`text-left font-body text-cz-gray-mid ... truncate`, caption text → `fontSize: 17` since it's short truncated text, recolor → `text-cz-gray-light`), 246, 248 (placeholder "+ přidat popis", `text-cz-gray-mid`, `fontSize: 10` → `fontSize: 17` (short placeholder phrase), recolor → `text-cz-gray-light`).

**`GamesClient.tsx` violations:** 146, 153, 161 (loading state), 168 (`<th>`), 174 (empty state), 186 (`<td>` value, `fontSize: 14, fontWeight: 500` → **17**), 187, 201/202 (`↑`/`↓` reorder icon buttons, `text-cz-gray-mid`, `fontSize: 13` — decorative icon glyphs, bump to **16** for the min-size floor but recoloring is optional since they already do `hover:text-white`; still recolor resting state to `text-cz-gray-light` for consistency), 204, 205, 235 ("+" upload placeholder icon `fontSize: 24` — already ≥16, icon glyph, leave), 236 ("COVER" label, `text-cz-gray-mid` uppercase, `fontSize: 8` → `fontSize: 16`, recolor → `text-cz-gray-light`), 256, 257, 272 (`color: form.platform === opt.value ? '#fff' : '#555'`, toggle text, recolor resting `'#555'` → `'#888888'`, bump `fontSize: 10` → **16**), 290, 291, 296, 299 (cancel button, `font-display uppercase text-cz-gray-mid`, `fontSize: 13` → `fontSize: 16`, recolor → `text-cz-gray-light`).

- [ ] **Step 1: Read both files**
- [ ] **Step 2: Apply the classification rule to every violation, leaving `GamesClient.tsx:235` ("+"  icon, already 24px) untouched**
- [ ] **Step 3: Recolor every `'#555'`/`text-cz-gray-mid` text use to `'#888888'`/`text-cz-gray-light`**
- [ ] **Step 4: Verify**

Run: `grep -n "fontSize: [1-9]\b\|fontSize: 1[0-5]\b" "src/app/[locale]/admin/(protected)/gallery/GalleryClient.tsx" "src/app/[locale]/admin/(protected)/games/GamesClient.tsx"`
Expected: no output except the confirmed `GamesClient.tsx:235` icon.

Run: `grep -n "'#555'" "src/app/[locale]/admin/(protected)/gallery/GalleryClient.tsx" "src/app/[locale]/admin/(protected)/games/GamesClient.tsx"`
Expected: no output.

---

### Task 21: Admin pricing (`PricingClient.tsx`)

**Files:**
- Modify: `src/app/[locale]/admin/(protected)/pricing/PricingClient.tsx`

Violations at lines 73, 83 (input value, `fontSize: 14` → **17** short numeric value, or **19** if it's a free-typed input matching Contact.tsx form-input treatment — use **19** for consistency with every other editable input across the site), 85 ("Kč" unit, `text-cz-gray-mid`, `fontSize: 12` → `fontSize: 16`, recolor → `text-cz-gray-light`), 90, 106, 113, 121 (`<th>`), 145, 153 (`<th>`), 177, 185 (`<th>`).

- [ ] **Step 1: Read the full file**
- [ ] **Step 2: Apply the classification rule to every violation**
- [ ] **Step 3: Recolor `text-cz-gray-mid` text uses to `text-cz-gray-light`**
- [ ] **Step 4: Verify**

Run: `grep -n "fontSize: [1-9]\b\|fontSize: 1[0-5]\b" "src/app/[locale]/admin/(protected)/pricing/PricingClient.tsx"`
Expected: no output.

Run: `grep -n "gray-mid" "src/app/[locale]/admin/(protected)/pricing/PricingClient.tsx"`
Expected: no output.

---

### Task 22: Admin auth pages (login, set-password, accept-invite)

**Files:**
- Modify: `src/app/[locale]/admin/login/page.tsx`
- Modify: `src/app/[locale]/admin/set-password/page.tsx`
- Modify: `src/app/[locale]/admin/accept-invite/page.tsx`

**`login/page.tsx`:** 52, 61 (form labels, uppercase → 16), 72, 90 (input text `fontSize: 14` → **19**), 79, 95 (form labels → 16), 104 (submit button `fontSize: 15` → **19**, match other primary CTAs).

**`set-password/page.tsx`:** 65, 76, 92, 108 (form labels → 16), 70 (`text-cz-gray-mid`, helper paragraph, `fontSize: 11` — short helper sentence → **17**, recolor → `text-cz-gray-light`), 87, 103 (input text → **19**), 117 (submit button `fontSize: 15` → **19**).

**`accept-invite/page.tsx`:** 42 (`text-cz-gray-mid` uppercase, `fontSize: 11` → `fontSize: 16`, recolor → `text-cz-gray-light`), 47, 50 (form labels → 16).

- [ ] **Step 1: Apply the fixes above to all three files**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: [1-9]\b\|fontSize: 1[0-5]\b" "src/app/[locale]/admin/login/page.tsx" "src/app/[locale]/admin/set-password/page.tsx" "src/app/[locale]/admin/accept-invite/page.tsx"`
Expected: no output.

Run: `grep -n "gray-mid" "src/app/[locale]/admin/login/page.tsx" "src/app/[locale]/admin/set-password/page.tsx" "src/app/[locale]/admin/accept-invite/page.tsx"`
Expected: no output.

---

### Task 23: Legal pages (privacy, terms)

**Files:**
- Modify: `src/app/[locale]/privacy/page.tsx`
- Modify: `src/app/[locale]/terms/page.tsx`

Both files use `className="font-body text-cz-gray-light"` at `fontSize: 15` for the main legal body copy (`privacy/page.tsx:35`, `terms/page.tsx:37`) — this is full-paragraph legal text → **19**. Also fix `privacy/page.tsx:189` and `terms/page.tsx:220` (`fontSize: 11`, likely a small heading/label inside the legal text body → **16** if it's a section-label style, or **17** if it's a sentence-case aside).

- [ ] **Step 1: Read both files, apply the fixes**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-5]\b" "src/app/[locale]/privacy/page.tsx" "src/app/[locale]/terms/page.tsx"`
Expected: no output.

---

### Task 24: Booking success/cancelled pages

**Files:**
- Modify: `src/app/[locale]/booking/success/page.tsx`
- Modify: `src/app/[locale]/booking/cancelled/page.tsx`

**`success/page.tsx` violations:** 92, 98 (`font-body text-cz-gray-light`, `fontSize: 14` — full sentence → **19**), 109, 124, 127, 132, 135, 140, 151, 157, 164 (`font-body text-cz-gray-light`, `fontSize: 14` → **19**, mirrors `:98`).

**`cancelled/page.tsx` violations:** 58 (`font-body text-cz-gray-light`, `fontSize: 14` → **19**), 63, 81.

- [ ] **Step 1: Read both files, apply the classification rule to every violation**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize: 1[0-5]\b" "src/app/[locale]/booking/success/page.tsx" "src/app/[locale]/booking/cancelled/page.tsx"`
Expected: no output.

---

### Task 25: Sitewide verification

**Files:** none (verification only, run after every other task is complete)

- [ ] **Step 1: Confirm no sub-16px UI/body text remains anywhere in `src`**

Run:
```bash
grep -rnE "fontSize: '?[0-9]'?[,}]|fontSize: 1[0-5][,}]" src --include="*.tsx" | grep -v "fontSize: 'clamp"
```
Expected: no output (any remaining hits must be `font-display` decorative/icon glyphs already confirmed ≥16 elsewhere, or clamp() expressions which are exempt since their floor is checked separately).

- [ ] **Step 2: Confirm no `#555555`/`cz-gray-mid` remains as a text color**

Run:
```bash
grep -rn "text-cz-gray-mid\|'#555'" src --include="*.tsx"
```
Expected: no output, or only confirmed non-text uses (borders, dividers, decorative icon glyphs already ≥16px) — list any survivors and justify each.

- [ ] **Step 3: Confirm Inter is fully removed**

Run: `grep -rn "Inter" src --include="*.tsx" --include="*.css"`
Expected: no output.

- [ ] **Step 4: Typecheck, lint, build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manual spot-check**

Run: `npm run dev`, open the homepage and the admin panel in a browser, confirm text renders in Space Mono (not a fallback sans-serif), nothing looks clipped or overlapping from the size bumps, and no visibly gray-on-dark text is hard to read.
