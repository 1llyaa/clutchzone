# V2 Inter Typography Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Clutch Zone website's typography per the client-authored "V2 zadání" spec: Inter comes back as the body/UI font (Bebas Neue stays display), Space Mono is demoted to an accent-only role (eyebrows, micro-labels, numbers, times, prices, technical data — never body copy, never navigation), plus a checklist of contrast, button, radius, and off-palette-color fixes. `Pricing.tsx` and its admin counterpart are explicitly excluded (handled in a separate effort).

**Architecture:** This branch forks fresh from `main`, so it starts from the *original* (pre-any-rework) codebase, which already has the correct font tokens (`--font-display: Bebas Neue`, `--font-body: Inter`, `--font-mono: Space Mono`) — no font-family token change is needed, only a Google Fonts weight-list edit (drop 300) and per-component size/weight/color fixes. Marketing-homepage sections get their sizes/colors matched 1:1 to the reference mockup (`Web V2.dc.html`), which is exhaustive for that surface. Everything else (admin panel, modals, reservation flow, legal/booking pages) gets only the *general* rules applied (no `font-weight: 300`, `#555555`/`cz-gray-mid` banned as text, the two named off-palette colors removed) since the spec doc doesn't describe those surfaces and doesn't ask for them to be redesigned.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4 (`@theme` tokens), TypeScript, next-intl.

**Spec:** `clutchzonev2/V2 zadani pro implementaci.md` (the checklist, in Czech) and `clutchzonev2/Web V2.dc.html` (the exhaustive reference mockup for the marketing homepage — open with `support.js` in the same folder). Both copied into this worktree's `clutchzonev2/` folder.

## Global Constraints

- **Fonts:** only `Bebas Neue` (display), `Inter` (UI/body), `Space Mono` (accent) anywhere. Google Fonts URL becomes `family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700` — Inter weight 300 is dropped.
- **Space Mono is accent-only.** Legal uses: section eyebrows (`// ...`), micro-labels, numbers, times, prices, other short technical/data values. Illegal uses: paragraph body copy, navigation links. (Existing admin-panel table data, badges, and status labels count as "technical data" and are already legal — do not touch their font-family.)
- **No `font-weight: 300` anywhere.** Inter's base weight is 400. Weight 500 is for "important data" (address, contact info, nav links, footer day labels).
- **`#555555` / `text-cz-gray-mid` is banned as a text color**, sitewide, no exceptions beyond minimal unstyled icon glyphs with a genuine hover/active escape (same standard as before: a fully-styled button/label is not exempt). Legal only for borders, dividers, disabled icons.
- **`#888888` / `text-cz-gray-light` is for micro-info and image placeholders only — never for card descriptions.** Card description paragraphs (Features cards, Game cards) that currently use gray-light must become `text-cz-white-soft` (`#E8E8E8`).
- **Palette does not change** — only where each shade is allowed to be used changes. Do not introduce new hex values beyond what's explicitly named below.
- **Two named off-palette colors to remove, nowhere else:**
  1. Game platform badges: purple `#a78bfa` and blue `#60a5fa` → `#2A2A2A` background with white text. PC stays `#E84A1A`. Applies to `src/components/sections/Games.tsx`'s `PLATFORM_COLOR` map AND the same badge concept in `src/app/[locale]/admin/(protected)/games/GamesClient.tsx` (its PS5 badge color).
  2. Hero availability-dot green `#22c55e` → `#E84A1A`, only in `src/components/sections/Hero.tsx` (both the mobile and desktop station-counter dots).
  - **Do not touch** the admin panel's semantic status-color system (`#22c55e`/`#ef4444`/`#eab308` used for confirmed/active/error/pending indicators across `SettingsClient.tsx`, `BookingsClient.tsx`, `GalleryClient.tsx`, `TournamentsClient.tsx`, `GamesClient.tsx`, and the shared `page.tsx` dashboard). That's a functional status system, not a decorative accent — out of scope.
- **Radius:** media and cards `4px` (`rounded-cz` / `borderRadius: 4`), buttons and badges `2px`, circles `50%`, pills `100px`. Never anything else. Two named fixes: game card container in `Games.tsx` (currently `borderRadius: 2`, should be `4`) and any gallery tile/image wrapper found at `2px` in `Gallery.tsx` (should be `4`).
- **Buttons — two sizes only, everywhere a Bebas-Neue uppercase CTA/action button appears** (both the shared `Button.tsx` component and every hand-rolled inline button in the 11 marketing-section files covered by the mockup):
  - **Large** (hero, CTA band, private-events CTA, contact submit): `font-family: Bebas Neue; font-size: 18px; letter-spacing: 1.5px; line-height: 1; text-transform: uppercase; padding: 14px 32px; border: 1.5px solid <bg-color>; border-radius: 2px;`
  - **Small** (nav CTA, tournament register): same as Large but `font-size: 16px; padding: 11px 22px;`
  - Solid/primary variant: `background: #E84A1A; border: 1.5px solid #E84A1A` (not `border: none` — the border must be present and match the fill so solid and ghost buttons are the same height), `color: #FFFFFF`, hover `background/border-color: #B83A12`.
  - Ghost/outline variant: `background: transparent`, border either `1.5px solid rgba(255,255,255,0.2)` (hero/CTA-band secondary) or `1.5px solid #2A2A2A` (nav-adjacent/tournament context) — match whichever the mockup shows for that specific button — hover `color/border-color: #E84A1A`.
  - `line-height: 1` is mandatory on every button, and doubly so on any `<a>` tag styled as a button (an anchor's default line-height is taller than a button's and will make it visibly mismatched) — e.g. the "NEZÁVAZNÁ POPTÁVKA" link in `PrivateEvents.tsx`.
  - **This button-spec normalization is scoped to `Button.tsx` and the 11 marketing-section files only.** Admin panel, modal, and reservation-flow buttons are not audited for this in this pass (out of scope — the spec doc doesn't describe those surfaces).
- **Excluded entirely, no changes of any kind:** `src/components/sections/Pricing.tsx` and `src/app/[locale]/admin/(protected)/pricing/PricingClient.tsx` (Ceník/pricing is being redesigned separately — do not touch either file, including for the general gray-mid/weight-300 rules).
- No layout, copy, or component-structure changes beyond what's explicitly specified above (sizes, colors, weights, radii, button chrome). Animations, hover states, section structure, and translations stay as they are.
- No git commits automatically beyond what each task specifies — no extra commits, no pushes.

---

### Task 1: Foundation — Google Fonts weight + Button component

**Files:**
- Modify: `src/app/[locale]/layout.tsx` (Google Fonts `<link>`)
- Modify: `src/components/ui/Button.tsx` (rewrite to 2-size spec)

**Interfaces:**
- Produces: `Button.tsx`'s `size` prop values (`sm`/`md`) now render at 16px/18px per the new spec — later tasks that use the two consumers of this component (`booking/cancelled/page.tsx`, `StepPayment.tsx`) are unaffected by this task (not in scope for this plan) but should not regress.

- [ ] **Step 1: Drop Inter weight 300 from the Google Fonts URL**

In `src/app/[locale]/layout.tsx`, change:
```tsx
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
```
to:
```tsx
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
```

- [ ] **Step 2: Rewrite `Button.tsx` to the 2-size spec**

Replace the whole file with:
```tsx
'use client';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false,
}: ButtonProps) {
  const base =
    'font-display uppercase transition-[background-color,color,border-color,scale,box-shadow] duration-150 ease-out rounded-[2px] inline-block';

  const sizes = {
    sm: { fontSize: 16, padding: '11px 22px', letterSpacing: 1.5 },
    md: { fontSize: 18, padding: '14px 32px', letterSpacing: 1.5 },
  };

  const s = sizes[size];
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

  if (variant === 'primary') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${cursor} bg-cz-orange text-white border-[1.5px] border-cz-orange disabled:opacity-60 disabled:hover:shadow-none hover:bg-cz-orange-dark hover:border-cz-orange-dark hover:shadow-[0_0_18px_rgba(232,74,26,0.35)] active:scale-[0.96] ${className}`}
        style={{ fontSize: s.fontSize, padding: s.padding, letterSpacing: s.letterSpacing, lineHeight: 1 }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${cursor} bg-transparent text-white border-[1.5px] border-cz-gray-dark disabled:opacity-60 hover:text-cz-orange hover:border-cz-orange ${className}`}
      style={{ fontSize: s.fontSize, padding: s.padding, letterSpacing: s.letterSpacing, lineHeight: 1 }}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Verify**

Run: `grep -n "300" src/app/[locale]/layout.tsx` — expect no hit inside the font URL.
Run: `npx tsc --noEmit` — expect no errors.

---

### Task 2: Navbar

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

Match `Web V2.dc.html` nav section (lines 32-60) exactly:
- Logo lockup ("CLUTCH ZONE" / "ESPORT CLUB · ČB") is in the shared `LogoLockup.tsx` component — leave that component itself alone (out of scope, not named in the spec), but if `Navbar.tsx` passes a `size` prop, don't change it.
- Desktop nav links (`HERNA`, `TURNAJE`, `PRIVÁTNÍ AKCE`, `KONTAKT`): `font-family: Inter; font-size: 12px; font-weight: 500; letter-spacing: 1.2px; text-transform: uppercase; color: #E8E8E8` — i.e. switch these from `font-mono`/Space Mono to Inter 500, remove any existing `uppercase`+Space-Mono styling.
- CS/EN locale switch: stays Space Mono (it's a short technical label), `font-size: 12px; letter-spacing: 1px` — selected color `#E84A1A`, unselected `#888888` (never `#555`/gray-mid).
- CTA button ("REZERVOVAT"): Bebas Neue, small-size button spec (16px, padding `11px 22px`, `border: 1.5px solid #E84A1A`, `line-height: 1`).
- Apply the same treatment to the mobile menu's nav links and CTA button.

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "font-mono" src/components/layout/Navbar.tsx` — the only remaining `font-mono` hits should be the CS/EN switch and the `|` separator, nothing on the nav links themselves.
Run: `npx tsc --noEmit`

---

### Task 3: Footer — full compact rewrite

**Files:**
- Modify: `src/components/layout/Footer.tsx`

Match `Web V2.dc.html` footer section (lines 300-357) exactly. This is a bigger structural change than other tasks — read the mockup carefully:
- `<footer>` padding: `36px 64px` (was `56px`/`14px`).
- Logo lockup: Bebas 19px wordmark, Space Mono 11px `letter-spacing: 2px` subtitle, color `#E84A1A`.
- **Every piece of text in the footer is 11px** — hours column, links column, copyright, legal line, bottom links. No exceptions.
- Column headings ("OTEVÍRACÍ DOBA" and the links column's new heading) share one style: `font-family: 'Space Mono'; font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: #E84A1A; margin-bottom: 12px`.
- **The links column gets a new heading "SLEDUJ NÁS"** above the Instagram/Discord/Kontakt links (it currently has no heading) — add the translation key or hardcode per the existing i18n pattern used elsewhere in this file (check `messages/cs.json` / `messages/en.json` for the `footer` namespace and add a `followUs` key with values "SLEDUJ NÁS" / "FOLLOW US" if the file uses `useTranslations`, otherwise match the existing hardcode pattern).
- Opening-hours rows: day label `font-size: 11px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; color: #E8E8E8`, time value `font-family: 'Space Mono'; font-size: 11px; color: #FFFFFF` (or `#888888` if closed — never `#555`).
- Footer links (Instagram/Discord/Kontakt, and the bottom OBCHODNÍ PODMÍNKY/OCHRANA OSOBNÍCH ÚDAJŮ): `font-size: 11px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; color: #E8E8E8`.
- Copyright ("© 2026 CLUTCH ZONE"): Space Mono, 11px.
- Bottom legal line (owner/IČO/address): 11px, `#888888`.
- Bottom section top padding `18px` (was `24px`), top margin `24px` (was `40px`).

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "fontSize" src/components/layout/Footer.tsx` — every hit should read `11` (aside from the Bebas wordmark's `19`).
Run: `npx tsc --noEmit`

---

### Task 4: Hero

**Files:**
- Modify: `src/components/sections/Hero.tsx`

Match `Web V2.dc.html` hero section (lines 62-117):
- Eyebrow ("ČESKÉ BUDĚJOVICE — ..."): Space Mono 13px, `letter-spacing: 2.5px`.
- H1: Bebas Neue, `88px` desktop ceiling / `lh: 0.94` (currently a `clamp(44px, 7.2vw, 104px)` — change the ceiling from `104px` to `88px`, keep the responsive floor/vw as-is unless it now exceeds the new ceiling; `line-height` from `0.92` to `0.94`).
- Body paragraph: Inter, **remove `fontWeight: 300`**, size `16px` (not the current `clamp(15px, 2vw, 19px)` — use a flat `16px`), `line-height: 1.75`, color `#E8E8E8`.
- Primary/secondary CTA buttons: Large button spec (18px, `padding: 14px 32px`, `border: 1.5px solid <color>`, `line-height: 1`) — primary solid orange-bordered-orange, secondary ghost with `rgba(255,255,255,0.2)` border.
- Stat numbers: Bebas `40px` (was `clamp(32px, 4vw, 44px)`).
- Stat labels: Space Mono `13px`, `letter-spacing: 1.5px`.
- Station-counter badge text: Space Mono `13px`, `letter-spacing: 1px`.
- Availability dot color: `#22c55e` → `#E84A1A` (both mobile and desktop instances — do NOT touch the `#ef4444` "no stations free" branch, only the green "available" branch).
- Scroll label: stays Space Mono, `12px`, `letter-spacing: 2.5px` — recolor from `text-cz-gray-mid` to `text-cz-gray-light` (gray-mid banned as text).

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "fontWeight: 300\|22c55e\|gray-mid" src/components/sections/Hero.tsx` — expect no hits.
Run: `npx tsc --noEmit`

---

### Task 5: Features

**Files:**
- Modify: `src/components/sections/Features.tsx`

Match `Web V2.dc.html` features section (lines 119-135):
- Eyebrow ("// CO TĚ ČEKÁ"): Space Mono 13px, `letter-spacing: 2.5px`, `margin-bottom: 12px`.
- Section heading: Bebas `52px`, `line-height: 0.98`, `letter-spacing: 1.5px`.
- Card number ("01" etc.): Space Mono 13px.
- Card heading: Bebas `28px`.
- Card description: Inter, **remove `fontWeight: 300`** and the `clamp(13px, 1.5vw, 15px)`, use flat `16px`, `line-height: 1.75`, **color `#E8E8E8`** (not `#888888`/gray-light — card descriptions are never gray-light per the contrast rule).
- Card padding `32px` (was `36px 32px`), grid gap `20px` (was `24px`).

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "fontWeight: 300\|gray-light" src/components/sections/Features.tsx` — the card description should no longer reference gray-light or weight 300.
Run: `npx tsc --noEmit`

---

### Task 6: Games

**Files:**
- Modify: `src/components/sections/Games.tsx`

Match `Web V2.dc.html` games section (lines 137-163):
- `PLATFORM_COLOR` map: `ps5: '#60a5fa'` → `'#2A2A2A'`, `both: '#a78bfa'` → `'#2A2A2A'`. `pc: '#E84A1A'` stays. Badge text stays white regardless of platform.
- Eyebrow / section heading: same as Task 5 (13px eyebrow, 52px Bebas heading).
- Carousel arrow buttons: `44×44px`, `border: 1.5px solid #2A2A2A`, `font-size: 20px` (radius stays `2px` — these are controls, not the card).
- Game card container: `border-radius: 2` → `4` (media card, not a button/badge).
- "NO IMAGE" placeholder: recolor from `text-cz-gray-mid` to `text-cz-gray-light` (gray-mid banned as text), size stays `12px`, `letter-spacing: 3px`.
- Platform badge: Space Mono `11px`, `font-weight: 700`, `letter-spacing: 1.5px`, `padding: 5px 9px`, radius `2px` (unchanged, it's a badge).
- Genre label: Space Mono `12px`, `font-weight: 700`, `letter-spacing: 2px`.
- Game title: Bebas `26px`.
- Game description: Inter `15px`, `line-height: 1.6`, color `#E8E8E8`.

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "60a5fa\|a78bfa\|gray-mid\|borderRadius: 2" src/components/sections/Games.tsx` — expect no hits (the card's `borderRadius` should read `4`).
Run: `npx tsc --noEmit`

---

### Task 7: Stream

**Files:**
- Modify: `src/components/sections/Stream.tsx`

Match `Web V2.dc.html` stream section (lines 165-176):
- Eyebrow / heading: same 13px/52px pattern as Task 5.
- Live indicator dot: stays `#E84A1A` (already correct, not one of the two named off-palette fixes).
- "TWITCH EMBED — CLUTCHZONE" label: Space Mono `13px`, `letter-spacing: 2.5px`.

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 8: Tournaments

**Files:**
- Modify: `src/components/sections/Tournaments.tsx`

Match `Web V2.dc.html` tournaments section (lines 178-211), for both the desktop row layout and the mobile card layout:
- Eyebrow / heading: same 13px/52px pattern.
- Date (e.g. "15.07"): Bebas `36px`, color `#E84A1A`.
- Year ("2026"): Space Mono `12px`, `letter-spacing: 1.5px`, color `#E8E8E8` — recolor from `text-cz-gray-mid`.
- Game tag pill: Space Mono `13px`, `letter-spacing: 1.5px`, `padding: 7px 11px`.
- Tournament title: Bebas `30px`.
- "PRIZE POOL" / "REGISTROVÁNO" labels: Space Mono `12px`, `letter-spacing: 1.5px`, color `#E8E8E8` — recolor from `text-cz-gray-mid`.
- Prize/slots numbers: Bebas `26px`.
- `/max_slots` fragment: recolor from `text-cz-gray-mid` to `text-cz-gray-light`.
- "PŘIHLÁSIT" button: Small button spec (16px, `padding: 11px 22px`, ghost, `border: 1.5px solid #2A2A2A`, `line-height: 1`) — when full/disabled, use `text-cz-gray-light` not `#555`.
- Empty-state message: recolor from `text-cz-gray-mid` to `text-cz-gray-light`.
- Apply the same size/color corrections to the mobile card variant (the second set of near-duplicate lines further down the file).

- [ ] **Step 1: Apply the fixes above to both desktop and mobile variants**
- [ ] **Step 2: Verify**

Run: `grep -n "gray-mid\|'#555'" src/components/sections/Tournaments.tsx` — expect no hits.
Run: `npx tsc --noEmit`

---

### Task 9: Gallery

**Files:**
- Modify: `src/components/sections/Gallery.tsx`

Match `Web V2.dc.html` gallery section (lines 213-226):
- Eyebrow / heading: same 13px/52px pattern.
- Tile labels ("PC ZÓNA" etc., if this component still renders a static bento grid) or carousel caption text: Space Mono `13px`, `letter-spacing: 2px`, color `#888888` (image placeholders — this IS a legal gray-light use).
- Any image-wrapper `border-radius: 2` → `4` (media, not a button/badge) — check every `rounded-[2px]` in this file and confirm whether it's on an image/tile container (→ `4`) or a small UI control like a pagination bullet (→ stays as-is, controls/badges are `2px`).

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 10: PrivateEvents

**Files:**
- Modify: `src/components/sections/PrivateEvents.tsx`

Match `Web V2.dc.html` private-events section (lines 228-244):
- Eyebrow / heading: same 13px/52px pattern.
- Body paragraph: Inter `16px`, `line-height: 1.8`, color `#E8E8E8` (remove `fontWeight: 300` if present).
- "CENA" label: Space Mono `12px`, `letter-spacing: 2.5px`, color `#E8E8E8` — recolor from `text-cz-gray-mid`.
- Price value ("NA POPTÁVKU / DOMLUVU"): Bebas `28px`.
- CTA link ("NEZÁVAZNÁ POPTÁVKA", an `<a>` styled as a button): Large button spec (18px, `padding: 14px 32px`, `border: 1.5px solid #E84A1A`, **`line-height: 1`** — this is exactly the anchor-as-button case the spec calls out as needing `line-height: 1` "doubly").

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "gray-mid\|fontWeight: 300" src/components/sections/PrivateEvents.tsx` — expect no hits.
Run: `npx tsc --noEmit`

---

### Task 11: Contact

**Files:**
- Modify: `src/components/sections/Contact.tsx`

Match `Web V2.dc.html` contact section (lines 246-283):
- Eyebrow / heading: same 13px/52px pattern.
- Body paragraph: Inter `16px`, `line-height: 1.8`, color `#E8E8E8`.
- Info labels ("ADRESA"/"OTEVÍRACÍ DOBA"/"E-MAIL"): Space Mono `12px`, `letter-spacing: 2.5px`, color `#E84A1A` — recolor from `text-cz-gray-mid`.
- Info values: Inter `16px`, **`font-weight: 500`** (important data), color `#FFFFFF`.
- Form field labels: Space Mono `12px`, `letter-spacing: 2px`, color `#FFFFFF`.
- Form inputs/textarea: Inter `16px`, `padding: 13px 14px` (was `11px 14px`/`fontSize: 14`).
- Submit button: Large button spec (18px, `padding: 14px 0` full-width, `border: 1.5px solid #E84A1A`, `line-height: 1`).

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `grep -n "gray-mid" src/components/sections/Contact.tsx` — expect no hits.
Run: `npx tsc --noEmit`

---

### Task 12: CtaBand

**Files:**
- Modify: `src/components/sections/CtaBand.tsx`

Match `Web V2.dc.html` final CTA section (lines 285-298):
- Eyebrow ("PŘIPRAVEN HRÁT?"): Space Mono `13px`, `letter-spacing: 2.5px`.
- H2: Bebas `60px`, `line-height: 0.98`.
- Two CTA buttons: Large button spec (18px, `padding: 14px 32px`, `line-height: 1`) — primary solid orange-bordered, secondary ghost `rgba(255,255,255,0.2)` border.

- [ ] **Step 1: Apply the fixes above**
- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 13: Admin shell + dashboard — general-rule fixes

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/components/admin/AdminNotifications.tsx`
- Modify: `src/app/[locale]/admin/(protected)/page.tsx`

Scope: **only** the general rules — `text-cz-gray-mid`/`#555` recolor to `text-cz-gray-light` wherever used as text (not borders/dividers/hover-escaped icons), and any `font-weight: 300` removed. No size changes, no layout changes, no button/radius audit (out of scope for admin per Global Constraints). Do not touch the `#22c55e`/`#ef4444` semantic status colors.

- [ ] **Step 1: Read all 3 files, recolor every gray-mid/#555 text usage, remove any weight-300**
- [ ] **Step 2: Verify**

Run: `grep -n "font-weight: 300\|fontWeight: 300" src/components/admin/AdminSidebar.tsx src/components/admin/AdminNotifications.tsx "src/app/[locale]/admin/(protected)/page.tsx"` — expect no hits.
Run: `npx tsc --noEmit`

---

### Task 14: Admin Settings + Bookings clients — general-rule fixes

**Files:**
- Modify: `src/app/[locale]/admin/(protected)/settings/SettingsClient.tsx`
- Modify: `src/app/[locale]/admin/(protected)/bookings/BookingsClient.tsx`

Same scope as Task 13: gray-mid-as-text → gray-light, no weight-300, no other changes. Do not touch the `#22c55e`/`#ef4444`/`#eab308` semantic status system in either file (toggle states, payment-status colors, save-message colors) — those are functional, not decorative.

- [ ] **Step 1: Read both files, apply the fixes**
- [ ] **Step 2: Verify**

Run: `grep -n "font-weight: 300\|fontWeight: 300" "src/app/[locale]/admin/(protected)/settings/SettingsClient.tsx" "src/app/[locale]/admin/(protected)/bookings/BookingsClient.tsx"` — expect no hits.
Run: `npx tsc --noEmit`

---

### Task 15: Admin Messages/Tournaments/Gallery/Games clients — general-rule fixes

**Files:**
- Modify: `src/app/[locale]/admin/(protected)/messages/MessagesClient.tsx`
- Modify: `src/app/[locale]/admin/(protected)/tournaments/TournamentsClient.tsx`
- Modify: `src/app/[locale]/admin/(protected)/gallery/GalleryClient.tsx`
- Modify: `src/app/[locale]/admin/(protected)/games/GamesClient.tsx`

Same scope as Task 13/14 (gray-mid-as-text, no weight-300), **plus one named off-palette fix**: in `GamesClient.tsx`, the PS5 platform-badge color (`g.platform === 'ps5' ? '#60a5fa' : '#E84A1A'`) — change `'#60a5fa'` to `'#2A2A2A'`, keeping white text (matches Task 6's marketing fix, same badge concept). Do not touch the `#22c55e`/`#ef4444`/`#888` active/inactive status colors in any of these 4 files.

- [ ] **Step 1: Read all 4 files, apply the fixes**
- [ ] **Step 2: Verify**

Run: `grep -n "60a5fa" "src/app/[locale]/admin/(protected)/games/GamesClient.tsx"` — expect no hits.
Run: `grep -n "font-weight: 300\|fontWeight: 300" "src/app/[locale]/admin/(protected)/messages/MessagesClient.tsx" "src/app/[locale]/admin/(protected)/tournaments/TournamentsClient.tsx" "src/app/[locale]/admin/(protected)/gallery/GalleryClient.tsx" "src/app/[locale]/admin/(protected)/games/GamesClient.tsx"` — expect no hits.
Run: `npx tsc --noEmit`

---

### Task 16: Admin auth + legal + booking pages — general-rule fixes

**Files:**
- Modify: `src/app/[locale]/admin/login/page.tsx`
- Modify: `src/app/[locale]/admin/set-password/page.tsx`
- Modify: `src/app/[locale]/admin/accept-invite/page.tsx`
- Modify: `src/app/[locale]/privacy/page.tsx`
- Modify: `src/app/[locale]/terms/page.tsx`
- Modify: `src/app/[locale]/booking/success/page.tsx`
- Modify: `src/app/[locale]/booking/cancelled/page.tsx`

Same scope as Task 13: gray-mid-as-text → gray-light, no weight-300.

- [ ] **Step 1: Read all 7 files, apply the fixes**
- [ ] **Step 2: Verify**

Run: `grep -n "font-weight: 300\|fontWeight: 300" "src/app/[locale]/admin/login/page.tsx" "src/app/[locale]/admin/set-password/page.tsx" "src/app/[locale]/admin/accept-invite/page.tsx" "src/app/[locale]/privacy/page.tsx" "src/app/[locale]/terms/page.tsx" "src/app/[locale]/booking/success/page.tsx" "src/app/[locale]/booking/cancelled/page.tsx"` — expect no hits.
Run: `npx tsc --noEmit`

---

### Task 17: Modals + reservation flow — general-rule fixes

**Files:**
- Modify: `src/components/tournament/TournamentDetailModal.tsx`
- Modify: `src/components/tournament/TournamentRegisterModal.tsx`
- Modify: `src/components/reservation/ReservationModal.tsx`
- Modify: `src/components/layout/CookieBar.tsx`
- Modify: `src/components/ui/Tooltip.tsx`
- Modify: `src/components/reservation/steps/StepContact.tsx`
- Modify: `src/components/reservation/steps/StepType.tsx`
- Modify: `src/components/reservation/steps/StepDuration.tsx`
- Modify: `src/components/reservation/steps/StepDateTime.tsx`
- Modify: `src/components/reservation/steps/StepPayment.tsx`
- Modify: `src/components/reservation/steps/StepDone.tsx`

Same scope as Task 13: gray-mid-as-text → gray-light, no weight-300.

- [ ] **Step 1: Read all 11 files, apply the fixes**
- [ ] **Step 2: Verify**

Run: `grep -n "font-weight: 300\|fontWeight: 300" src/components/tournament/TournamentDetailModal.tsx src/components/tournament/TournamentRegisterModal.tsx src/components/reservation/ReservationModal.tsx src/components/layout/CookieBar.tsx src/components/ui/Tooltip.tsx src/components/reservation/steps/StepContact.tsx src/components/reservation/steps/StepType.tsx src/components/reservation/steps/StepDuration.tsx src/components/reservation/steps/StepDateTime.tsx src/components/reservation/steps/StepPayment.tsx src/components/reservation/steps/StepDone.tsx` — expect no hits.
Run: `npx tsc --noEmit`

---

### Task 18: Sitewide verification

**Files:** none (verification only)

- [ ] **Step 1: No `font-weight: 300` anywhere**

Run: `grep -rn "fontWeight: 300\|font-light" src --include="*.tsx"` — expect no hits.

- [ ] **Step 2: No `#555555`/`cz-gray-mid` as text color**

Run: `grep -rn "text-cz-gray-mid\|'#555'" src --include="*.tsx"` — every surviving hit must be a border/divider/hover-escaped icon; list and justify any that remain.

- [ ] **Step 3: No off-palette platform/status colors outside the admin semantic system**

Run: `grep -rn "a78bfa\|60a5fa" src --include="*.tsx"` — expect no hits.
Run: `grep -rn "22c55e" src/components/sections/Hero.tsx` — expect no hits (dot recolored); confirm `22c55e` still appears in the admin files listed in Global Constraints (that's correct, out of scope).

- [ ] **Step 4: `Pricing.tsx` and `PricingClient.tsx` untouched**

Run: `git diff --stat main -- src/components/sections/Pricing.tsx "src/app/[locale]/admin/(protected)/pricing/PricingClient.tsx"` — expect no output (no changes).

- [ ] **Step 5: Font-family sanity**

Run: `grep -rn "font-family" src --include="*.tsx" | grep -v "Bebas Neue\|Inter\|Space Mono"` — expect no hits (every explicit `font-family` is one of the three).

- [ ] **Step 6: Typecheck, lint, build**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run lint` — expect no errors (warnings pre-existing/unrelated are fine).
Run: `npm run build` — expect success.

- [ ] **Step 7: Manual spot-check**

Run: `npm run dev`, open the homepage, confirm Inter renders as body text (not a fallback), Space Mono only shows on eyebrows/labels/numbers, footer is compact with 11px text throughout, and nothing looks clipped from the new button/radius values.
