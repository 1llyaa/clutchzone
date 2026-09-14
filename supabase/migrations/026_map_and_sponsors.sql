-- ============================================================
-- Two homepage sections, both driven from the admin panel:
--   1. a full-width Google Maps embed above the footer
--   2. a continuously scrolling sponsor-logo carousel
-- ============================================================

-- The map is an iframe embed URL, not the Maps JS SDK: no API key, no
-- billing, no script on the page. Mirrors the existing stream_url pattern,
-- so it lives in the site_settings key-value store rather than a table.
INSERT INTO site_settings (key, value) VALUES
  ('map_embed_url', ''),
  ('map_visible',   'false')
ON CONFLICT (key) DO NOTHING;

-- Sponsors get a table because they are a list with order, not a setting.
-- Shape cloned from gallery_images (migration 005); `caption` becomes the
-- pair `name` (alt text) and `website_url` (wraps the logo in a link), both
-- optional — plenty of sponsors are a logo and nothing else.
CREATE TABLE IF NOT EXISTS sponsors (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT,
  website_url  TEXT,
  storage_path TEXT        NOT NULL,
  url          TEXT        NOT NULL,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No admin visibility toggle for the section as a whole: it self-hides when
-- no active sponsor exists, so there is no state where the toggle and the
-- content can disagree.
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sponsors_public_read" ON sponsors;
CREATE POLICY "sponsors_public_read" ON sponsors FOR SELECT USING (is_active = true);

-- Storage policies for the "sponsors" bucket. The bucket itself is created by
-- hand in the Supabase dashboard, the same way `gallery` and `hero` were —
-- this repo has no bucket-creation step.
DROP POLICY IF EXISTS "sponsors_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "sponsors_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "sponsors_auth_delete"  ON storage.objects;

CREATE POLICY "sponsors_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'sponsors');
CREATE POLICY "sponsors_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'sponsors' AND auth.role() = 'authenticated');
CREATE POLICY "sponsors_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'sponsors' AND auth.role() = 'authenticated');
