-- Gallery images
CREATE TABLE gallery_images (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT        NOT NULL,
  url          TEXT        NOT NULL,
  caption      TEXT,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_images_public_read" ON gallery_images FOR SELECT USING (is_active = true);

-- Gallery config (single row)
CREATE TABLE gallery_config (
  id           INTEGER PRIMARY KEY DEFAULT 1,
  display_type TEXT    NOT NULL DEFAULT 'masonry',
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO gallery_config (id, display_type) VALUES (1, 'masonry');
ALTER TABLE gallery_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_config_read" ON gallery_config FOR SELECT USING (true);

-- Storage policies
CREATE POLICY "gallery_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "gallery_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "gallery_auth_delete" ON storage.objects FOR DELETE USING  (bucket_id = 'gallery' AND auth.role() = 'authenticated');
