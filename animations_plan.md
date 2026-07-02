# Animation Pass for Clutch Zone (Public Site Only)

## Context

The Clutch Zone landing site (Next.js 15 App Router, Tailwind v4, next-intl) has a well-animated hero, but everything below it is completely static on scroll, modals pop in with no transition, and there is zero `prefers-reduced-motion` handling. Goal: make the whole site feel more polished with tasteful, lightweight animations — **no animation libraries, zero new dependencies**. We extend the existing hand-rolled `cz-*` keyframe system in `globals.css`. Admin CMS is out of scope (user confirmed public site only).

**One motion vocabulary:** fade + 24px rise, 600ms, `cubic-bezier(0.2, 0, 0, 1)` (the easing already used by `cz-hero-char`/`cz-menu-in`), with 60–80ms stagger for card groups. Modals get fade + slight scale. Nothing else new.

## Step 1 — Extend `src/app/globals.css`

**1a.** Delete dead code: `--animate-ring-spin` (line 23) and `@keyframes cz-ring-spin` (lines 33–35) — defined but never used.

**1b.** New `@theme` animation shorthands (existing convention):

```css
--animate-backdrop-in: cz-backdrop-in 200ms ease-out both;
--animate-modal-in: cz-modal-in 280ms cubic-bezier(0.2, 0, 0, 1) both;
--animate-step-in: cz-step-in 220ms cubic-bezier(0.2, 0, 0, 1) both;
```

**1c.** Matching keyframes:

```css
@keyframes cz-backdrop-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes cz-modal-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes cz-step-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**1d.** Reveal + micro-interaction classes in `@layer components`:

```css
.cz-reveal {
  transition:
    opacity 600ms cubic-bezier(0.2, 0, 0, 1),
    transform 600ms cubic-bezier(0.2, 0, 0, 1);
}
.cz-reveal-hidden {
  opacity: 0;
  transform: translateY(24px);
}

.cz-card-lift {
  transition:
    transform 250ms cubic-bezier(0.2, 0, 0, 1),
    border-color 200ms ease-out,
    box-shadow 250ms ease-out;
}
.cz-card-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}

.cz-link-underline {
  position: relative;
}
.cz-link-underline::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 1px;
  background: var(--color-cz-orange);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 250ms cubic-bezier(0.2, 0, 0, 1);
}
.cz-link-underline:hover::after {
  transform: scaleX(1);
}
```

Key design point: `.cz-reveal` (SSR-rendered) only defines the _transition_; `.cz-reveal-hidden` is **only ever added by client JS**. No-JS users, crawlers, and SSR HTML always see fully visible content — nothing can be stuck invisible.

**1e.** Global reduced-motion block at end of file:

```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  .animate-flicker,
  .animate-scroll-pulse,
  .animate-hero-char,
  .animate-hero-float,
  .animate-hero-glow-pulse,
  .animate-menu-in,
  .animate-underline-in,
  .animate-backdrop-in,
  .animate-modal-in,
  .animate-step-in {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
  .cz-reveal {
    transition: none !important;
  }
  .cz-reveal-hidden {
    opacity: 1 !important;
    transform: none !important;
  }
  .cz-card-lift,
  .cz-link-underline::after {
    transition: none !important;
  }
}
```

Instantly completes the `forwards` hero animations (hero text stays visible), kills the infinite loops, and makes reveals a no-op.

## Step 2 — New file: `src/components/ui/Reveal.tsx` (~50 lines)

```tsx
"use client";
interface RevealProps {
  children: React.ReactNode;
  delay?: number; // ms transition-delay, for staggering
  as?: "div" | "section" | "li" | "span"; // default 'div'
  className?: string;
}
```

Behavior:

- SSR renders `<div class="cz-reveal {className}" style={{ transitionDelay }}>` — **visible by default**.
- In `useEffect` (client-only, post-hydration):
  1. `matchMedia('(prefers-reduced-motion: reduce)').matches` → return (never hide).
  2. No `IntersectionObserver` → return.
  3. Element already in viewport (`getBoundingClientRect().top < window.innerHeight`) → return — no hide-then-show flash above the fold or on anchor deep-links (`/#cenik`).
  4. Else add `cz-reveal-hidden` (element is offscreen, no visible flash), observe with `{ rootMargin: '0px 0px -10% 0px', threshold: 0.1 }`; on first intersection remove the class and `observer.disconnect()`. Cleanup on unmount.
- Staggering: caller passes `delay={i * 70}`; per-instance observers, disconnected after firing.
- **RSC note:** `Reveal` is a client component, but server-rendered JSX passed as `children` stays server-rendered. `Features.tsx` and `Footer.tsx` (the only server components among targets) just import and wrap — **do not** add `'use client'` to them.

## Step 3 — Apply reveals per section (`src/components/sections/` unless noted)

Recipe: wrap section header in `<Reveal>`, stagger card children.

| File                                        | What animates                                                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Features.tsx` (server)                     | Header; each of the 4 cards in `<Reveal delay={i * 70}>` (Reveal divs become the grid children).                           |
| `Games.tsx`                                 | Header; whole horizontal scroller in one `<Reveal delay={100}>` — do **not** stagger cards inside a scroll strip.          |
| `Pricing.tsx`                               | Header; PC table; PS5 table `delay={80}`; 3 package cards `delay={i * 80}` (featured leads).                               |
| `Stream.tsx`                                | Header; player wrapper `delay={100}`.                                                                                      |
| `Tournaments.tsx`                           | Header; each row's outer div `delay={Math.min(i, 4) * 60}` (cap so long lists don't lag); empty-state in plain `<Reveal>`. |
| `Gallery.tsx`                               | Header; grid/Swiper container in **one** `<Reveal delay={100}>` — Swiper already crossfades, don't double-animate.         |
| `Contact.tsx`                               | Header; info column; form column `delay={100}`.                                                                            |
| `CtaBand.tsx`                               | Entire inner card in a single `<Reveal>`.                                                                                  |
| `src/components/layout/Footer.tsx` (server) | Inner container in one `<Reveal>`.                                                                                         |

`Hero.tsx` untouched (already fully animated).

## Step 4 — Modal enter animations (enter-only; skip exit)

Exit animations need `isClosing` state + `onAnimationEnd` in three components for marginal payoff — skip; instant close is fine (ReservationModal's 300ms reset timeout already tolerates it).

1. `src/components/reservation/ReservationModal.tsx` — backdrop div (~line 84): add `animate-backdrop-in`; panel div (~line 89): `animate-modal-in`. **Wizard step transition:** on the body wrapper div, add `key={step}` + `animate-step-in` — remounts per step, replaying a 220ms fade/rise. No state needed.
2. `src/components/tournament/TournamentDetailModal.tsx` — `animate-backdrop-in` on backdrop, `animate-modal-in` on panel.
3. `src/components/tournament/TournamentRegisterModal.tsx` — same two classes.

## Step 5 — Micro-interaction polish (minimal)

1. `Features.tsx` cards: add `cz-card-lift`, drop the existing `transition-[border-color] duration-200`, keep `hover:border-cz-orange`.
2. `Pricing.tsx` package cards: add `cz-card-lift hover:border-cz-orange`.
3. `Tournaments.tsx` desktop rows: `transition-colors duration-200 hover:bg-white/[0.02]` — no lift on wide rows.
4. `src/components/layout/Navbar.tsx` desktop links: add `cz-link-underline` (not mobile menu — touch has no hover).
5. Primary orange CTAs (Navbar CTA, CtaBand primary, Pricing buttons, `src/components/ui/Button.tsx` primary variant): `hover:shadow-[0_0_18px_rgba(232,74,26,0.35)]` + add `box-shadow` to the transition list.

Existing Games hover, Gallery hover, `active:scale`, and form-focus transitions stay as-is.

## Performance guardrails

- Only `opacity`/`transform` animated (hover `box-shadow` is the sole, hover-scoped exception).
- No `will-change` on reveals (one-shot transitions; layer promotion on ~25 elements would hurt).
- Observers disconnect after first fire and on unmount; single `getBoundingClientRect()` per Reveal in `useEffect`, no scroll-path layout reads.
- Bundle delta: one small client component, zero deps; ring-spin removal slightly shrinks CSS.

## Verification

1. `npm run build` passes (catches RSC violations).
2. `npm run dev`, load `/cs` and `/en`: hero unchanged; scroll top→bottom — sections fade/rise once, cards stagger, nothing re-animates on scroll-up, no layout shift.
3. Load `/#cenik` directly + hard-refresh mid-page: on-screen content appears instantly (in-viewport skip branch).
4. DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → reload: hero text visible immediately, nothing hidden, modals instant.
5. DevTools → disable JavaScript → reload: all sections fully visible.
6. ReservationModal: backdrop fades, panel scales in, wizard steps fade on next/back; both tournament modals animate; backdrop-click close still works.
7. Mobile viewport: hamburger menu still animates; tournament mobile cards reveal correctly.

**Commit order:** Step 1+2 (CSS + Reveal) → Step 3 (sections) → Step 4 (modals) → Step 5 (polish) → verify.
