-- Customers metadata table.
-- Revenue/order metrics are NOT stored here — they are computed live from the
-- sales table by lowercased-email match. This table only stores admin-added
-- metadata: notes, tags, and an optional manual segment override.

CREATE TABLE IF NOT EXISTS customers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text NOT NULL UNIQUE,
  name              text,
  phone             text,
  notes             text,
  tags              text[] NOT NULL DEFAULT '{}',
  segment_override  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON customers FOR ALL
  USING (true) WITH CHECK (true);
