-- ============================================================
-- Pricing v2 — data-driven ceník (CENOVA-KALKULACKA-SPEC.md §8)
-- Adds hour_tiers, time_passes, opening_hours as the single source
-- of truth for the price calculator + engine.
--
-- Scope note: this migration ADDS the new tables without touching
-- pc_duration_prices / ps5_duration_prices / pricing_tiers — those
-- still back the existing admin ceník UI and /api/bookings revalidation.
-- Dropping them is a later, separate migration once the admin + booking
-- flow are ported (spec §8 migration step 4).
-- ============================================================

-- ============================================================
-- HODINOVÉ CENOVKY (kredit)
-- ============================================================
CREATE TABLE hour_tiers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_type TEXT NOT NULL CHECK (station_type IN ('pc', 'ps5')),
  hours        INT  NOT NULL CHECK (hours > 0),
  amount       INT  NOT NULL CHECK (amount > 0),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (station_type, hours)
);

INSERT INTO hour_tiers (station_type, hours, amount, sort_order) VALUES
  ('pc',  1,  75,  1),
  ('pc',  3,  215, 2),
  ('pc',  5,  345, 3),
  ('pc',  7,  475, 4),
  ('pc',  10, 660, 5),
  ('ps5', 1,  120, 1),
  ('ps5', 3,  330, 2),
  ('ps5', 5,  560, 3);

-- ============================================================
-- ČASOVÉ PASY
-- ============================================================
CREATE TABLE time_passes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT UNIQUE NOT NULL,
  name_cs           TEXT NOT NULL,
  name_en           TEXT NOT NULL,
  description_cs    TEXT NOT NULL,
  description_en    TEXT NOT NULL,
  station_type      TEXT NOT NULL CHECK (station_type IN ('pc', 'ps5', 'any')),
  price_mode        TEXT NOT NULL CHECK (price_mode IN ('per_hour', 'flat')),
  amount            INT  NOT NULL CHECK (amount > 0),
  days_of_week      INT[] NOT NULL,       -- 0 = neděle … 6 = sobota
  window_start      TIME NOT NULL,
  window_end        TIME NOT NULL,
  crosses_midnight  BOOLEAN NOT NULL DEFAULT false,
  max_hours         INT,                   -- jen pro flat; null = do konce okna
  is_active         BOOLEAN NOT NULL DEFAULT true,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

INSERT INTO time_passes
  (slug, name_cs, name_en, description_cs, description_en, station_type, price_mode, amount, days_of_week, window_start, window_end, crosses_midnight, max_hours, sort_order)
VALUES
  ('happy-hours',  'HAPPY HOURS',   'HAPPY HOURS',   'Paušál za okno 14:00–17:00', 'Flat rate for the 14:00–17:00 window', 'pc', 'flat', 165, '{2,3,4,5}', '14:00', '17:00', false, null, 1),
  ('evening-pass', 'EVENING PASS',  'EVENING PASS',  'Paušál za okno 19:00–24:00', 'Flat rate for the 19:00–24:00 window', 'pc', 'flat', 285, '{2,3,4,0}', '19:00', '24:00', false, null, 2),
  ('weekend-pass', 'WEEKEND PASS',  'WEEKEND PASS',  'Paušál za okno 22:00–04:00', 'Flat rate for the 22:00–04:00 window', 'pc', 'flat', 340, '{5,6}',   '22:00', '04:00', true,  null, 3);

-- ============================================================
-- OTEVÍRACÍ DOBA — jediný zdroj pravdy pro engine i patičku
-- ============================================================
CREATE TABLE opening_hours (
  day_of_week      INT PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),  -- 0 = neděle … 6 = sobota
  is_closed        BOOLEAN NOT NULL DEFAULT false,
  open_time        TIME,
  close_time       TIME,
  crosses_midnight BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO opening_hours (day_of_week, is_closed, open_time, close_time, crosses_midnight) VALUES
  (0, false, '14:00', '24:00', false), -- neděle
  (1, true,  null,    null,    false), -- pondělí (zavřeno)
  (2, false, '14:00', '24:00', false), -- úterý
  (3, false, '14:00', '24:00', false), -- středa
  (4, false, '14:00', '24:00', false), -- čtvrtek
  (5, false, '14:00', '04:00', true),  -- pátek
  (6, false, '14:00', '04:00', true);  -- sobota

INSERT INTO site_settings (key, value) VALUES ('credit_expiry_months', '3')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE hour_tiers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_passes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hour_tiers_read"    ON hour_tiers    FOR SELECT USING (true);
CREATE POLICY "time_passes_read"   ON time_passes   FOR SELECT USING (true);
CREATE POLICY "opening_hours_read" ON opening_hours FOR SELECT USING (true);
