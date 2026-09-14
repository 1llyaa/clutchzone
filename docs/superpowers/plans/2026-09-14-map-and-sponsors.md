# Map section + sponsors carousel

Date: 2026-09-14
Status: design approved pending — awaiting sign-off before implementation
Branch: off `main`, PR into `main` (DEV retired 2026-09-07, contra AGENTS.md)

## Goal

Two new homepage sections, both configurable from the admin panel:

1. **Map** — full-width Google Maps embed, rendered directly above the footer. Admin sets an embed URL and toggles the section on/off.
2. **Sponsors** — continuously scrolling carousel of sponsor logo PNGs. Admin uploads, names, links, reorders, deactivates, and deletes logos.

## Decisions taken

| Question | Decision |
|---|---|
| Map tech | Iframe embed URL stored in `site_settings`. No API key, no billing, no JS SDK. Mirrors the existing `stream_url` pattern. |
| Map consent | Consent-gated placeholder. Iframe loads only after an explicit click, or automatically when analytics consent is already `accepted`. |
| Carousel motion | Continuous marquee via Swiper `Autoplay` with `delay: 0` and linear timing. Swiper is already a dependency and already transpiled in `next.config.ts`. |
| Sponsor fields | Optional `name` (alt text) and `website_url` (wraps logo in a link). |
| Sponsors visibility | No admin toggle. Section self-hides when no active sponsors exist. |
| Section order | `... Contact → Sponsors → CtaBand → Map → Footer` |

## Existing patterns being cloned

- `supabase/migrations/005_gallery.sql` — table + RLS + storage policies
- `src/app/api/admin/gallery/route.ts` and `.../gallery/[id]/route.ts` — admin CRUD
- `src/app/[locale]/admin/(protected)/gallery/GalleryClient.tsx` — upload, reorder, toggle, delete UI
- `SettingsClient.tsx` stream block — URL input + AKTIVNÍ/SKRYTÝ toggle
- `src/components/sections/Gallery.tsx` — Swiper setup and pagination styling

---

## 1. Data

New migration `supabase/migrations/024_map_and_sponsors.sql`:

```sql
-- Map: two keys in the existing site_settings key-value store
INSERT INTO site_settings (key, value)
VALUES ('map_embed_url', ''), ('map_visible', 'false');

CREATE TABLE sponsors (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT,
  website_url  TEXT,
  storage_path TEXT        NOT NULL,
  url          TEXT        NOT NULL,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sponsors_public_read" ON sponsors FOR SELECT USING (is_active = true);

-- Storage policies for the "sponsors" bucket
CREATE POLICY "sponsors_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'sponsors');
CREATE POLICY "sponsors_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'sponsors' AND auth.role() = 'authenticated');
CREATE POLICY "sponsors_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'sponsors' AND auth.role() = 'authenticated');
```

The `sponsors` bucket itself is created by hand in the Supabase dashboard, the same
way `gallery` and `hero` were — the repo has no bucket-creation step.

Independent of the unapplied pricing v2 migration; numbering does not collide.

## 2. Map URL handling

New `src/lib/maps/embed.ts` — pure and unit-tested, since `npm test` already
picks up `src/**/*.test.ts`.

```ts
toEmbedUrl(input: string): string | null
```

- A pasted `<iframe src="...">` snippet: extract `src`.
- Already `google.com/maps/embed?pb=...`: pass through.
- Anything else (a plain address, a place link): wrap as
  `https://www.google.com/maps?q=<encoded>&output=embed`.
- Host outside `google.com` / `www.google.com` / `maps.google.com`: return `null`.

The host allowlist runs **server-side as well**, inside the settings PATCH route.
Without it, the admin panel becomes an arbitrary-iframe injection point.

`ALLOWED_KEYS` in `src/app/api/admin/settings/site/route.ts` gains
`map_embed_url` and `map_visible`.

## 3. API

- `src/app/api/admin/sponsors/route.ts` — `GET` list, `POST` create.
  Clone of the gallery route with the `display_type` PATCH dropped.
- `src/app/api/admin/sponsors/[id]/route.ts` — `PATCH`
  (`name`, `website_url`, `is_active`, `sort_order`) and `DELETE`
  (removes the storage object, then the row).
- The map needs no new route; it reuses `/api/admin/settings/site`.

## 4. Admin

**Sponsors — its own page, mirroring Gallery**

- `AdminSidebar` `NAV` gains `{ href: '/admin/sponsors', label: 'SPONZOŘI' }`,
  placed after `GALERIE`.
- `src/app/[locale]/admin/(protected)/sponsors/page.tsx` +
  `SponsorsClient.tsx`: drag-or-click upload into the `sponsors` bucket followed
  by a `POST`, a thumbnail grid on a checkerboard tile (transparent PNGs are
  invisible against black otherwise), inline editing of name and website URL,
  up/down reordering, an active toggle, and delete behind a confirm.

**Map — a block inside Settings**

- A new block in `SettingsClient.tsx`, cloning the stream block: an
  AKTIVNÍ/SKRYTÝ toggle, a URL input, a ULOŽIT button, plus a live preview
  iframe once the URL validates. Owner-only, like the rest of Settings.

## 5. Sections

**`src/components/sections/Sponsors.tsx`** — client component, Swiper marquee.

- `modules=[Autoplay, FreeMode]`, `loop`, `slidesPerView="auto"`, `speed={5000}`,
  `autoplay={{ delay: 0, pauseOnMouseEnter: true, disableOnInteraction: false }}`,
  linear timing.
- Logos roughly 48px tall with automatic width, grayscale at `opacity: .6`,
  going full colour at `1` on hover.
- Wrapped in `<a rel="noopener noreferrer sponsored">` when `website_url` is set;
  `alt` falls back from `name` to `"Sponsor"`.
- Under `prefers-reduced-motion: reduce`, autoplay is off and the logos become a
  static centred wrapping row.
- Returns `null` when there are no active sponsors.
- **Deliberate exception to AGENTS.md:** the global
  `img { outline: 1px solid rgba(255,255,255,.1) }` draws a box around
  transparent logos. Override with `outline: none`, scoped to this section only.

**`src/components/sections/MapSection.tsx`** — client component, consent-gated.

- Renders only when `map_visible === 'true'` and `toEmbedUrl()` returns non-null.
- Full-width, deliberately outside `max-w-[1440px]`; height
  `clamp(320px, 45vh, 520px)`.
- Before consent: a dark placeholder with the grid overlay, the address taken
  from `contact.locationValue`, and a `ZOBRAZIT MAPU` button. Clicking loads the
  iframe and remembers the choice for the session.
- Auto-loads when `getConsent() === 'accepted'`; subscribes to
  `CONSENT_CHANGED_EVENT`.
- iframe uses `loading="lazy"` and a `title` from i18n. No Google cookies are set
  until the visitor clicks.

**`src/app/[locale]/page.tsx`**

- Add `fetchSponsors()`.
- Extend the `fetchSiteSettings` key list with `map_embed_url` and `map_visible`.
- Render `<Sponsors />` after `<Contact />`, and `<MapSection />` last inside
  `</main>` so the map sits directly above `<Footer />`.

## 6. i18n

New namespaces in all four locale files (`cs.json`, `en.json`, `de.json`, `ua.json`):

- `sponsors`: `eyebrow`, `heading`
- `map`: `heading`, `placeholderText`, `showButton`, `iframeTitle`

## 7. Verification

- `npm test` — covers the embed-URL parser
- `npx tsc --noEmit`
- `npm run dev`, then check the homepage at desktop width and at 375px, and check
  both admin surfaces

## Open items

- Sponsor logo upload accepts any image type; no dimension or file-size
  validation is planned. Add it only if oversized uploads become a problem.
- Sponsor logos are served through `next/image`; the Supabase host is already
  allowlisted in `next.config.ts`, so no config change is needed.
