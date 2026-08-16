-- ============================================================
-- Bookings v2 — N-station groups + engine-derived offers
-- (CENOVA-KALKULACKA-SPEC.md §8, §4.1)
-- ============================================================

-- A booking of N stations is now N rows sharing booking_group_id — the
-- old bookings_reference_key made every row need a unique reference,
-- which breaks once a group shares one reference across its rows.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_reference_key;
CREATE INDEX IF NOT EXISTS bookings_reference_idx ON bookings (reference);

-- New bookings price from hour_tiers/time_passes (§8), not pricing_tiers —
-- the FK stays for old rows' history, just stops being mandatory.
ALTER TABLE bookings ALTER COLUMN pricing_id DROP NOT NULL;

ALTER TABLE bookings
  ADD COLUMN booking_group_id uuid,
  ADD COLUMN stations_count int NOT NULL DEFAULT 1,
  ADD COLUMN time_pass_id uuid REFERENCES time_passes(id),
  ADD COLUMN offer_kind text CHECK (offer_kind IN ('hours', 'hours_upsell', 'pass')),
  ADD COLUMN pays_with_credit boolean NOT NULL DEFAULT false,
  ADD COLUMN clutchzone_account text,
  ADD COLUMN terms_accepted_at timestamptz,
  ADD COLUMN terms_version text;

CREATE INDEX IF NOT EXISTS bookings_group_idx ON bookings (booking_group_id);

-- §11.1: needs an actual lawyer-reviewed version before going live —
-- this is a placeholder so terms_accepted_at/terms_version have something
-- real to point at while the reservation flow is being built.
INSERT INTO site_settings (key, value) VALUES ('terms_version', '2026-08-16')
ON CONFLICT (key) DO NOTHING;
