-- ============================================================
-- Clutch Zone — Seed Data
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- Stations: 10 PCs + 2 PS5s
-- ============================================================
INSERT INTO stations (label, type, specs) VALUES
  ('PC-01',  'pc',  '{"gpu":"RTX 5060 Ti","monitor":"240Hz","mouse":"gaming"}'),
  ('PC-02',  'pc',  '{"gpu":"RTX 5060 Ti","monitor":"240Hz","mouse":"gaming"}'),
  ('PC-03',  'pc',  '{"gpu":"RTX 5060 Ti","monitor":"240Hz","mouse":"gaming"}'),
  ('PC-04',  'pc',  '{"gpu":"RTX 5060 Ti","monitor":"240Hz","mouse":"gaming"}'),
  ('PC-05',  'pc',  '{"gpu":"RTX 5060 Ti","monitor":"240Hz","mouse":"gaming"}'),
  ('PC-06',  'pc',  '{"gpu":"RTX 5060 Ti","monitor":"240Hz","mouse":"gaming"}'),
  ('PC-07',  'pc',  '{"gpu":"RTX 5060 Ti","monitor":"240Hz","mouse":"gaming"}'),
  ('PC-08',  'pc',  '{"gpu":"RTX 5060 Ti","monitor":"240Hz","mouse":"gaming"}'),
  ('PC-09',  'pc',  '{"gpu":"RTX 5060 Ti","monitor":"240Hz","mouse":"gaming"}'),
  ('PC-10',  'pc',  '{"gpu":"RTX 5060 Ti","monitor":"240Hz","mouse":"gaming"}'),
  ('PS5-01', 'ps5', '{"tv":"65 palců","controllers":2,"note":"Cena zahrnuje 2x DualSense"}'),
  ('PS5-02', 'ps5', '{"tv":"65 palců","controllers":2,"note":"Cena zahrnuje 2x DualSense"}');

-- ============================================================
-- Pricing tiers (flat packages + Happy Hours rate)
-- day_constraint: days = ISO weekday numbers (1=Mon … 7=Sun)
-- ============================================================
INSERT INTO pricing_tiers (tier, label, amount, unit, is_hourly, description, day_constraint, is_featured) VALUES
  (
    'happy_hour',
    'HAPPY HOURS',
    55,
    'Kč/hod',
    true,
    '14:00 – 17:00',
    '{"from":"14:00","to":"17:00"}',
    true
  ),
  (
    'standard',
    'STANDARD',
    75,
    'Kč/hod',
    true,
    'Základní cena PC / 1 hodina',
    null,
    false
  ),
  (
    'evening_pass',
    'EVENING PASS',
    285,
    'Kč',
    false,
    '19:00 – 00:00',
    '{"from":"19:00","to":"00:00"}',
    false
  ),
  (
    'weekend_pass',
    'WEEKEND PASS',
    340,
    'Kč',
    false,
    '22:00 – 04:00',
    '{"from":"22:00","to":"04:00"}',
    false
  );

-- ============================================================
-- Duration-based PC prices
-- ============================================================
CREATE TABLE IF NOT EXISTS pc_duration_prices (
  duration_h    INTEGER NOT NULL PRIMARY KEY,
  amount        INTEGER NOT NULL
);

INSERT INTO pc_duration_prices (duration_h, amount) VALUES
  (1,  75),
  (3,  215),
  (5,  345),
  (7,  475),
  (10, 660);

-- ============================================================
-- Duration-based PS5 prices
-- ============================================================
CREATE TABLE IF NOT EXISTS ps5_duration_prices (
  duration_h    INTEGER NOT NULL PRIMARY KEY,
  amount        INTEGER NOT NULL
);

INSERT INTO ps5_duration_prices (duration_h, amount) VALUES
  (1, 120),
  (3, 330),
  (5, 560);

-- RLS for new tables
ALTER TABLE pc_duration_prices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps5_duration_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pc_prices_read"  ON pc_duration_prices  FOR SELECT USING (true);
CREATE POLICY "ps5_prices_read" ON ps5_duration_prices FOR SELECT USING (true);

-- ============================================================
-- Sample tournaments
-- ============================================================
INSERT INTO tournaments (title, game, date, format, prize_pool, max_slots, filled_slots, registration_deadline) VALUES
  ('5v5 SUMMER CLASH', 'CS2',     '2026-07-15', '5v5', 5000, 16, 8,  '2026-07-13'),
  ('NIGHT SERIES #4',  'VALORANT','2026-07-22', '5v5', 3000, 12, 5,  '2026-07-20'),
  ('1v1 KING OF ČB',   'EA FC 25','2026-07-29', '1v1', 2000, 32, 11, '2026-07-27');
