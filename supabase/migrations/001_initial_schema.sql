-- ============================================================
-- Clutch Zone — Initial Schema
-- Run this first in Supabase SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE station_type     AS ENUM ('pc', 'ps5');
CREATE TYPE booking_status   AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE pricing_tier_key AS ENUM ('happy_hour', 'standard', 'evening_pass', 'weekend_pass');

-- ============================================================
-- stations
-- ============================================================
CREATE TABLE stations (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  label      TEXT         NOT NULL UNIQUE,   -- 'PC-01' … 'PS5-02'
  type       station_type NOT NULL,
  specs      JSONB        NOT NULL DEFAULT '{}',
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- pricing_tiers
-- ============================================================
CREATE TABLE pricing_tiers (
  id             UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  tier           pricing_tier_key NOT NULL UNIQUE,
  label          TEXT             NOT NULL,
  amount         INTEGER          NOT NULL,   -- CZK, whole numbers
  unit           TEXT             NOT NULL,   -- 'Kč/hod' | 'Kč'
  is_hourly      BOOLEAN          NOT NULL DEFAULT true,
  description    TEXT,
  day_constraint JSONB,                       -- {"days":[1..5],"from":"10:00","to":"14:00"}
  is_featured    BOOLEAN          NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- ============================================================
-- bookings
-- ============================================================
CREATE TABLE bookings (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        TEXT           NOT NULL UNIQUE
                     DEFAULT 'CZ-' || upper(substring(replace(gen_random_uuid()::text,'-',''), 1, 4)),
  station_id       UUID           NOT NULL REFERENCES stations(id),
  pricing_id       UUID           NOT NULL REFERENCES pricing_tiers(id),
  customer_name    TEXT           NOT NULL,
  customer_email   TEXT           NOT NULL,
  customer_phone   TEXT,
  customer_discord TEXT,
  date             DATE           NOT NULL,
  start_time       TIME           NOT NULL,
  end_time         TIME           NOT NULL,
  total_price      INTEGER        NOT NULL,   -- CZK
  status           booking_status NOT NULL DEFAULT 'confirmed',
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),

  -- Atomically prevent overlapping bookings for the same station.
  -- cancelled bookings are excluded from the check.
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    station_id WITH =,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp,
      '[)'
    ) WITH &&
  ) WHERE (status <> 'cancelled')
);

-- ============================================================
-- tournaments
-- ============================================================
CREATE TABLE tournaments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT        NOT NULL,
  game                  TEXT        NOT NULL,
  date                  DATE        NOT NULL,
  format                TEXT,
  prize_pool            INTEGER,    -- CZK
  max_slots             INTEGER     NOT NULL,
  filled_slots          INTEGER     NOT NULL DEFAULT 0,
  registration_deadline DATE,
  is_active             BOOLEAN     NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- tournament_registrations
-- ============================================================
CREATE TABLE tournament_registrations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name       TEXT        NOT NULL,
  captain_name    TEXT        NOT NULL,
  captain_email   TEXT        NOT NULL,
  captain_discord TEXT,
  player_names    TEXT[]      NOT NULL DEFAULT '{}',
  status          TEXT        NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- contact_messages
-- ============================================================
CREATE TABLE contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE stations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages       ENABLE ROW LEVEL SECURITY;

-- Public read: active stations, all pricing tiers, active tournaments
CREATE POLICY "stations_read"    ON stations        FOR SELECT USING (is_active = true);
CREATE POLICY "pricing_read"     ON pricing_tiers   FOR SELECT USING (true);
CREATE POLICY "tournaments_read" ON tournaments     FOR SELECT USING (is_active = true);

-- Bookings: anyone may create; anyone may read (filtered by reference in the app)
CREATE POLICY "bookings_insert"  ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_read"    ON bookings FOR SELECT USING (true);

-- Tournament registrations: anyone may register and read
CREATE POLICY "treg_insert" ON tournament_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "treg_read"   ON tournament_registrations FOR SELECT USING (true);

-- Contact: anyone may submit
CREATE POLICY "contact_insert" ON contact_messages FOR INSERT WITH CHECK (true);
