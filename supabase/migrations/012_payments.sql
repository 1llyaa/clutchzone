ALTER TABLE bookings
  ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'onsite' CHECK (payment_method IN ('onsite', 'online')),
  ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  ADD COLUMN coins_awarded INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN stripe_checkout_session_id TEXT,
  ADD COLUMN stripe_payment_intent_id TEXT;

INSERT INTO site_settings (key, value) VALUES ('pay_now_coins_amount', '50');
