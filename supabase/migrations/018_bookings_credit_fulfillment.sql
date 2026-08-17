-- ============================================================
-- Hour-credit bookings need the same "connect to ggLeap" tracking as
-- standalone /kredit purchases — a booking with offer_kind hours/
-- hours_upsell banks hours too, not just credit_orders (spec §2.1).
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz,
  ADD COLUMN IF NOT EXISTS fulfilled_by uuid REFERENCES profiles(id),
  -- total hours banked per station for offer_kind hours/hours_upsell
  -- (Offer.hoursCovered) — separate from duration_minutes, which is only
  -- the on-site reserved time and can be less than what was purchased
  -- (spec §3.7: surplus purchased hours are credit, not extra on-site time)
  ADD COLUMN IF NOT EXISTS credit_hours int;

CREATE INDEX IF NOT EXISTS bookings_unfulfilled_credit_idx
  ON bookings (booking_group_id)
  WHERE offer_kind IN ('hours', 'hours_upsell') AND fulfilled_at IS NULL;
