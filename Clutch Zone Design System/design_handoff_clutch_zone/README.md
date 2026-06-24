# Handoff: Clutch Zone — Website & Marketing Templates

## Overview
**Clutch Zone** is a premium esport gaming club in České Budějovice, CZ (high-end gaming PCs, PS5, tournaments, community). This package documents the **marketing website landing page** (primary deliverable) plus four social/print marketing templates, all built to a single, strict brand design system.

Tone: competitive, bold, professional — premium sports brand meets esport underground. Audience: CZ/SK gamers 16–35. All copy is in **Czech**.

---

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing the intended look, layout, and behavior. They are **not** production code to copy verbatim. They were authored in a lightweight in-house templating format (`.dc.html`) that streams inline-styled markup; do **not** try to reuse that runtime.

Your task: **recreate these designs in the target codebase's environment** using its established patterns and libraries. If no environment exists yet, the recommended stack is **React + plain CSS / CSS Modules** (or Tailwind with the tokens below mapped to theme values). The markup is plain semantic HTML with inline styles — straightforward to port to JSX/components.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions are all specified. Recreate the UI pixel-accurately using the design tokens in this README. Every hex value, font size, and spacing figure below is authoritative.

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| `--cz-orange` | `#E84A1A` | Primary accent — CTAs, active states, accent lines, key data |
| `--cz-orange-dark` | `#B83A12` | Button hover / pressed |
| `--cz-orange-glow` | `#FF6B35` | Secondary highlight (rare) |
| `--cz-black` | `#0A0A0A` | Primary background |
| `--cz-black-mid` | `#111111` | Cards, elevated surfaces, footer, header bars |
| `--cz-black-light` | `#1A1A1A` | Featured/secondary cards |
| `--cz-gray-dark` | `#2A2A2A` | Borders, dividers |
| `--cz-gray-mid` | `#555555` | Muted text, captions |
| `--cz-gray-light` | `#888888` | Secondary/tertiary text, nav links |
| `--cz-white` | `#FFFFFF` | Primary text on dark |
| `--cz-white-soft` | `#E8E8E8` | Body copy |
| (logo cream) | `#E8E5DC` | Logo concentric rings only |
| (logo ring dark) | `#141414` | Logo dark rings only |
| grid line | `rgba(255,255,255,0.045–0.06)` | Grid overlay |

**Rules:** orange is an accent ONLY — max 2–3 instances per layout, never as a large fill, never orange-on-orange or white-on-white. Background elevation goes black → black-mid → black-light. All text must meet WCAG AA on its background.

### Typography
Load from Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

| Role | Family | Notes |
|---|---|---|
| Display / headings | `'Bebas Neue', sans-serif` | ALWAYS uppercase, white on dark. Tracking 1.5–3px. |
| UI / body | `'Inter', sans-serif` | Body 15–16px / line-height 1.7, weight 300–400. Never < 14px. |
| Labels / eyebrows / technical | `'Space Mono', monospace` | UPPERCASE, letter-spacing 2–5px, orange or gray-light, 10–13px (scales up on posters). |

Type scale (website, 1440px design): hero headline ~104px; section headings 56–60px; subsection 30–32px; card title 20–24px (Inter 700); body 15–19px; eyebrow 11–12px.

### Spacing & Shape
- **8px base grid** — all spacing in multiples of 8.
- Desktop section padding: **120px vertical, 64px horizontal**. Cards: 28–32px.
- **Border-radius: max 4px** everywhere (buttons/cards = 2–4px). Pill badges = 100px. Logo tile = 14 (on a 100-unit viewBox).
- **No soft drop shadows.** The only allowed shadow is a sharp `4px 4px 0 #E84A1A` accent (used sparingly; not on the current landing page).
- **No gradients** except a subtle orange radial glow on hero/poster backgrounds (≤0.16 opacity) and a transparent→black bottom fade.

### Signature graphic elements
1. **Grid overlay** — two crossing 1px line gradients at `rgba(255,255,255,0.045)`, `background-size: 48px 48px` (40–60px on social). On hero/CTA/ceník it's masked with a `radial-gradient` so it fades at edges.
   ```css
   background-image:
     linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
     linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px);
   background-size: 48px 48px;
   ```
2. **Orange accent line** — one thin `2px` orange line per section: a 40px horizontal lead-in before an eyebrow, an underline under a heading, or a card top border. Use sparingly.
3. **Orange radial glow** — `radial-gradient(circle, rgba(232,74,26,0.15), transparent 62%)`, large (600–760px), offset top-right on hero / centered on CTA & posters.
4. **Corner brackets** — thin (1.5px) orange L-shaped marks framing featured graphics.

---

## The Logo

A **bold filled target**: concentric filled rings alternating cream (`#E8E5DC`) and dark (`#141414`), with a solid orange (`#E84A1A`) center dot, on a near-black rounded-square tile. (NOT a thin-stroke crosshair.) Never recolor. Recreate as inline SVG so it scales crisply:

```html
<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;">
  <rect x="0" y="0" width="100" height="100" rx="14" fill="#0A0A0A"></rect>
  <rect x="1" y="1" width="98" height="98" rx="13" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="0.6"></rect>
  <circle cx="50" cy="50" r="40" fill="#E8E5DC"></circle>
  <circle cx="50" cy="50" r="32" fill="#141414"></circle>
  <circle cx="50" cy="50" r="24" fill="#E8E5DC"></circle>
  <circle cx="50" cy="50" r="16" fill="#141414"></circle>
  <circle cx="50" cy="50" r="9"  fill="#E84A1A"></circle>
</svg>
```
Lockup: logo tile + a two-line block — "CLUTCH ZONE" (Bebas, 22–24px, tracking 2px, white) above "ESPORT CLUB · ČB" (Space Mono, 9px, tracking 3px, orange or gray). 14px gap.

---

# PRIMARY DELIVERABLE — Landing Page

**Source file:** `Hero Section.dc.html`
**Design width:** 1440px (content max-width 1440px, centered; full-bleed dark background). Single-column responsive collapse expected but not yet designed — see Responsive notes.

Page order: **Nav → Hero → Features → Ceník → Turnaje → CTA band → Footer.** Entire page background `#0A0A0A`.

### 1. Nav (sticky candidate, currently static)
- Flex row, space-between, padding `28px 64px`, bottom border `1px rgba(255,255,255,0.06)`.
- **Left:** logo tile 44px + lockup (CLUTCH ZONE / ESPORT CLUB · ČB).
- **Center/right:** 4 nav links — `Herna`, `Ceník`, `Turnaje`, `Kontakt` (Space Mono, 12px, tracking 2px, uppercase, `#888`; hover → `#fff`). Gap 40px.
- **Far right:** primary button `REZERVOVAT` (see Button spec).

### 2. Hero
- Two-column grid `1.15fr / 0.85fr`, gap 48px, padding `72px 64px 120px`, `min-height: 100vh`.
- Background layers (absolute, behind content): grid overlay (48px) masked to fade at edges; orange radial glow top-right (760px); bottom fade to black (200px).
- **Left column:**
  - Eyebrow row: 40px×1.5px orange line + "ČESKÉ BUDĚJOVICE" (Space Mono, 12px, tracking 4px, orange).
  - `<h1>`: "TVOJE NOVÁ E-SPORTOVÁ ZÁKLADNA" — Bebas, **104px**, line-height 0.92, tracking 2px, white, uppercase, 3 lines. The last word "ZÁKLADNA" has a 5px orange underline bar.
  - Subhead: Inter 300, 19px, line-height 1.7, `#E8E8E8`, max-width 480px, margin-top 32px. Copy: "Špičkové herní PC, PS5 a turnaje na jednom místě. Přijď hrát, trénovat a vyhrávat — ve městě, kde se rodí nová generace hráčů."
  - CTA row (gap 20px, margin-top 40px): primary `REZERVOVAT MÍSTO` + ghost `ZOBRAZIT CENÍK`.
  - Stats row (margin-top 64px, top border `1px rgba(255,255,255,0.07)`, padding-top 32px, gap 48px): three stats — value Bebas 44px white, label Space Mono 11px tracking 2px gray uppercase. Values: **32** / Herních stanic · **89 Kč** / Od · hodina · **24/7** / Otevřeno o víkendu.
- **Right column** (min-height 480px, centered):
  - Two orange corner brackets (40px, 1.5px) top-left & bottom-right.
  - 380px square: an SVG ring (`stroke #E84A1A`, dashed `24 10 6 60`) **rotating 360° over 28s linear infinite**, with the 230px logo tile centered inside.
  - Floating status chip bottom-left: `#111` bg, `1px #2A2A2A` border, 8px orange dot **pulsing opacity (1.6s ease-in-out)**, text "24 / 32 stanic volných" (Space Mono 11px).
- **Scroll indicator** bottom-center: "SCROLL" (Space Mono 10px gray) above a 1.5px×48px orange line that **pulses vertically** (scaleY in/out, 2.2s).

### 3. Features — "VYBAVENÍ NA ŠPIČKOVÉ ÚROVNI"
- Section padding `120px 64px`, top border `1px rgba(255,255,255,0.06)`.
- Heading block: eyebrow "// CO TĚ ČEKÁ" (Space Mono 11px tracking 4px orange) + `<h2>` Bebas 60px white uppercase. Margin-bottom 64px.
- 4-column grid, gap 24px. Each card: `#111` bg, `1px #2A2A2A` border, radius 4px, padding `32px 28px`, min-height 240px, flex column.
  - Top: number (`01`–`04`) Space Mono 13px orange.
  - Title pinned to bottom (`margin-top:auto; padding-top:48px`) Bebas 30px white uppercase; desc Inter 300 15px `#888`.
  - **Hover:** border → `#E84A1A`, `transform: translateY(-4px)`, 0.2s.
  - Cards: **01 GAMING PC** "RTX 4070, 240Hz monitory, mechanické klávesnice. Žádné kompromisy." · **02 PS5 LOUNGE** "Pohodlné zóny s velkými TV pro konzolové hraní ve dvou i v partě." · **03 TURNAJE** "Pravidelné CS2, Valorant a FIFA turnaje s reálnými cenami." · **04 KOMUNITA** "Místo, kde najdeš spoluhráče, tým i lidi se stejnou vášní."

### 4. Ceník — "ZVÝHODNĚNÉ BALÍČKY"
- Section padding `120px 64px`; grid overlay masked at top.
- Header: flex space-between (wraps). Left: eyebrow "// CENÍK" + `<h2>` Bebas 60px with `2px solid #E84A1A` bottom border (inline-block, padding-bottom 14px). Right: Inter 300 15px `#888` note "Ceny za jednu stanici. Slevy pro studenty a stálé hráče na recepci." Margin-bottom 64px.
- 4-column grid, gap 24px, stretch. Each card: bg `#111` (featured `#1A1A1A`), `1px #2A2A2A` border, radius 4px, padding `32px 26px`, flex column; **2px top bar** (`#2A2A2A`, featured = `#E84A1A`).
  - Featured card shows a pill badge "TOP" (Space Mono 9px, orange, `1px` orange border, radius 100px) top-right.
  - Label Space Mono 11px tracking 2px orange uppercase; amount Bebas 64px white with unit in Inter 18px 500 `#888`; desc Inter 14px `#555`; full-width primary button at bottom (`margin-top:auto`).
  - Tiers: **HAPPY HOUR** 89 Kč/hod · "Po–Pá · 10:00–14:00" · **STANDARD (featured)** 129 Kč/hod · "Kdykoliv · bez omezení" · **EVENING PASS** 249 Kč · "18:00 – zavírací doba" · **WEEKEND PASS** 599 Kč · "Celý víkend · So + Ne". Button label "REZERVOVAT".

### 5. Turnaje — "PŘIHLAŠ SVŮJ TÝM"
- Section padding `120px 64px`, top border `1px rgba(255,255,255,0.06)`.
- Heading: eyebrow "// NADCHÁZEJÍCÍ TURNAJE" + `<h2>` Bebas 60px. Margin-bottom 56px.
- Rows as a 5-column grid `140px 130px 1fr 160px 180px`, align-center, gap 24px, padding `28px 8px`, top border `1px #2A2A2A` (plus a closing divider after the last row). **Hover:** row bg → `#111`.
  - Col 1 date: Bebas 40px orange + "2026" (Space Mono 11px gray) beneath.
  - Col 2 game tag: Space Mono 11px, `1px #2A2A2A` border, radius 2px, padding `6px 10px`.
  - Col 3 title: Bebas 32px white uppercase.
  - Col 4 prize: label Space Mono 10px gray "PRIZE POOL" + amount Bebas 28px white.
  - Col 5 (right-aligned): slots text (Space Mono 11px gray) + ghost button "PŘIHLÁSIT" (smaller: 15px, padding `9px 22px`).
  - Rows: **15.07 · CS2 · 5v5 SUMMER CLASH · 5 000 Kč · 8/16 týmů** · **22.07 · VALORANT · NIGHT SERIES #4 · 3 000 Kč · 5/12 týmů** · **29.07 · EA FC 25 · 1v1 KING OF ČB · 2 000 Kč · 11/32 hráčů**.

### 6. CTA band
- Section padding `0 64px 120px`. Inner panel: `#111` bg, `1px #2A2A2A` border, radius 4px, overflow hidden, padding `80px 64px`, centered text. Background: grid overlay (40px, center-masked) + centered orange radial glow (600px, 0.13).
- Eyebrow "PŘIPRAVEN HRÁT?" (Space Mono 12px orange) + `<h2>` Bebas 72px white "REZERVUJ SVOJI STANICI JEŠTĚ DNES". Two buttons centered (gap 20px): primary "REZERVOVAT MÍSTO" + ghost "NAPSAT NÁM".

### 7. Footer
- Padding `56px 64px`, top border `1px rgba(255,255,255,0.06)`. Flex space-between (wraps).
- Left: logo 40px + lockup (CLUTCH ZONE / ESPORT CLUB · ČESKÉ BUDĚJOVICE).
- Center: links `Instagram` `Discord` `Kontakt` (Space Mono 12px gray, hover white). Gap 32px.
- Right: "© 2026 CLUTCH ZONE" (Space Mono 11px `#555`).

---

## Components (reusable)

**Primary button** — bg `#E84A1A`, color `#fff`, Bebas 18–19px, tracking 2px, padding `14–16px 32–40px`, border none, radius 2px. Hover: bg `#B83A12`. Active: `transform: scale(0.98)`. Transitions 0.15s.

**Ghost / secondary button** — transparent bg, `#fff` text, Bebas 18–19px tracking 2px, `1.5px solid` border (`#2A2A2A` on the page, `#FFFFFF` in the original spec), radius 2px. Hover: border + text → `#E84A1A`.

**Badge / tag** — Space Mono 9–11px, tracking 2px, uppercase, `1px` border radius 2px (pill variant radius 100px). Neutral `#888`/`#2A2A2A`; orange variant `#E84A1A` text + border.

**Eyebrow** — Space Mono 11px, tracking 3–4px, orange, uppercase; optionally prefixed with `//` or a 40px orange lead-in line.

**Section heading** — Bebas 56–60px white uppercase, tracking 1.5px; optional `2px solid #E84A1A` bottom underline (inline-block).

---

## Interactions & Behavior
- **Hover transitions:** 0.15s on buttons/links (color/border/bg); 0.2s on feature cards (border + translateY); row bg fade on tournament rows.
- **Button active:** `scale(0.98)`.
- **Animations (CSS keyframes, all infinite):**
  - Hero ring rotation: `rotate(0→360deg)`, 28s linear.
  - Hero status-dot flicker: opacity 1→0.55→1, 1.6s ease-in-out.
  - Scroll indicator: scaleY 0→1→0 with transform-origin flipping top→bottom, opacity in/out, 2.2s ease-in-out.
- **Nav links → smooth-scroll** to the matching section (`Ceník`→ceník, `Turnaje`→turnaje, etc.). Currently `href="#"`; wire up anchors.
- **CTAs** ("REZERVOVAT MÍSTO", row "PŘIHLÁSIT", price "REZERVOVAT") should open a reservation/registration flow (modal or route) — not yet designed. "NAPSAT NÁM" → contact. Footer social links → external.

## State / Data
The page is currently static. Recommended data shape for a real build (drives Features, Ceník, Turnaje):
- `features[]`: `{ no, title, desc }`
- `pricing[]`: `{ label, amount, unit, desc, featured }`
- `tournaments[]`: `{ date, year, game, title, prize, slots }`
- Live "stations free" stat (`24 / 32`) is a candidate for a real-time value.

## Responsive behavior (to design in implementation)
The mocks are desktop (1440px). For a real build: collapse hero to one column < ~960px (graphic below text); features 4→2→1 columns; ceník 4→2→1; tournament rows reflow to stacked cards on mobile; reduce hero headline to a fluid clamp (e.g. `clamp(48px, 9vw, 104px)`); section padding shrinks to ≥24px horizontal on mobile.

## Assets
- **Logo:** recreate as the inline SVG above (no raster asset needed). Source reference image: `uploads/pasted-1782290903285-0.png` in the originating project.
- **Fonts:** Google Fonts (Bebas Neue, Inter, Space Mono) — link tag above.
- **No photography / icons** are used; the brand is intentionally typographic + graphic. No emoji.

---

## Marketing Templates (secondary)
Fixed-size, screenshot/print-ready frames built on the same system. Each is a self-contained design reference:
- `Instagram Post.dc.html` — **1080×1080**. Tournament announcement: logo top-right (64px), eyebrow "TURNAJ", Bebas headline "CS2 SUMMER CLASH" (~172px), orange date chip "15 · 07 · 2026", prize/format row, full-width dark bottom bar (orange top border) with registration line + CLUTCHZONE.CZ.
- `Instagram Story.dc.html` — **1080×1920**, 250px top/bottom safe zones. Happy Hour promo: logo top-center, eyebrow "PO–PÁ · 10:00–14:00", Bebas "HAPPY HOUR" (~188px), giant orange "89 Kč/hod", body line, full-width orange CTA "REZERVOVAT MÍSTO" near bottom.
- `Ceník.dc.html` — **A4 landscape, 1123×794**. Dark header bar (logo + lockup left, "CENÍK" Bebas 64px right, orange bottom border); four price tiers as full-width rows separated by `1px #2A2A2A` dividers, Standard featured (`#111` bg + orange top border + "NEJOBLÍBENĚJŠÍ" pill); footer strip with disclaimer + URL.
- `Turnaj Poster.dc.html` — **1080×1350** (4:5). Three zones: top 40% (eyebrow + logo, Bebas "SUMMER CLASH" ~180px, orange date), mid 30% (3-col prize/format/capacity divided by `1px` rules), bottom 30% (location, orange "REGISTRACE OTEVŘENA" block, uzávěrka note). Grid overlay + centered orange glow.

These can be rebuilt as parameterized components (pass in game, date, prize, price) for reuse.

---

## Files in this bundle
- `Hero Section.dc.html` — **full landing page** (primary)
- `Instagram Post.dc.html`
- `Instagram Story.dc.html`
- `Ceník.dc.html`
- `Turnaj Poster.dc.html`
- `CLAUDE.md` — condensed brand system (project context)

> Reminder: these are **HTML design references**, not shippable code. Recreate them in the target app's framework using the tokens and specs above.
