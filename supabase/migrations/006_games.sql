CREATE TABLE games (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  genre        TEXT,
  description  TEXT,
  platform     TEXT        NOT NULL DEFAULT 'pc',
  cover_url    TEXT,
  storage_path TEXT,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_public_read" ON games FOR SELECT USING (is_active = true);
CREATE POLICY "games_storage_read"   ON storage.objects FOR SELECT USING (bucket_id = 'games');
CREATE POLICY "games_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'games' AND auth.role() = 'authenticated');
CREATE POLICY "games_storage_delete" ON storage.objects FOR DELETE USING  (bucket_id = 'games' AND auth.role() = 'authenticated');
