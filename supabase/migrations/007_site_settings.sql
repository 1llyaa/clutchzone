-- Key-value store for site-wide settings (hero image, etc.)
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO site_settings (key, value)
VALUES ('hero_image', '/terrorist_cs2.png');

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
