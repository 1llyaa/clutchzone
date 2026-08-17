-- Coins were passed to Stripe metadata for credit purchases but never
-- actually persisted anywhere on payment — mirrors bookings.coins_awarded.
ALTER TABLE credit_orders ADD COLUMN IF NOT EXISTS coins_awarded int NOT NULL DEFAULT 0;
