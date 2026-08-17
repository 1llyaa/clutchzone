-- ============================================================
-- Credit orders — Flow 3 nákup kreditu (CENOVA-KALKULACKA-SPEC.md §6, §8)
-- ============================================================

CREATE TABLE IF NOT EXISTS credit_orders (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference                   text UNIQUE NOT NULL,
  customer_name                text NOT NULL,
  customer_email                text NOT NULL,
  customer_phone                text,
  clutchzone_account           text,  -- nullable, same "no account yet" escape hatch as bookings
  total_amount                int NOT NULL,
  stripe_checkout_session_id   text,
  payment_status               text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  expires_at                   date NOT NULL,
  terms_accepted_at            timestamptz NOT NULL,
  terms_version                text NOT NULL,
  fulfilled_at                 timestamptz,
  fulfilled_by                 uuid REFERENCES profiles(id),
  created_at                   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES credit_orders(id) ON DELETE CASCADE,
  station_type text NOT NULL CHECK (station_type IN ('pc', 'ps5')),
  hours        int NOT NULL,
  unit_amount  int NOT NULL,  -- price at purchase time, copied not referenced — a later ceník
                               -- change must never reprice an already-placed order
  quantity     int NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS credit_order_items_order_idx ON credit_order_items (order_id);
CREATE INDEX IF NOT EXISTS credit_orders_payment_status_idx ON credit_orders (payment_status);

ALTER TABLE credit_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_order_items ENABLE ROW LEVEL SECURITY;
-- No public policies — every read/write goes through the service-role
-- admin client from API routes, same as `bookings`.
