-- Stripe payment integration: link ledger rows to Stripe objects, widen the
-- payment lifecycle beyond pending/paid/refunded, store a per-order pay token
-- for QR / payment-link checkout, and add two audit tables:
--   * stripe_webhook_events — every webhook delivery, used both for replay
--     protection (event ids are unique) and as a forensic record.
--   * order_audit_log — who changed what on an order (admin edits, Stripe
--     transitions, refunds), so the ledger is fully auditable.

-- ── sales: Stripe linkage + payment lifecycle ──────────────────────────────
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS amount_refunded numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS pay_token uuid NOT NULL DEFAULT gen_random_uuid();

-- One ledger row per Checkout Session / pay token.
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_stripe_session_id
  ON sales (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_stripe_payment_intent_id
  ON sales (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_pay_token ON sales (pay_token);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales (payment_method);

-- Widen the payment_status lifecycle. Existing data ('pending','paid',
-- 'refunded') remains valid; the new states are set by the Stripe webhook.
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_status_check
  CHECK (payment_status IN (
    'pending',            -- awaiting payment (e-transfer, cash, or open Stripe session)
    'paid',               -- funds captured
    'failed',             -- Stripe payment attempt failed (async methods)
    'expired',            -- Stripe Checkout session expired unpaid
    'refunded',           -- fully refunded
    'partially_refunded', -- some but not all of the charge refunded
    'disputed'            -- chargeback opened on the charge
  ));

-- ── stripe_webhook_events: replay protection + event audit ─────────────────
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id            text PRIMARY KEY,          -- Stripe event id (evt_...)
  type          text NOT NULL,
  api_version   text,
  payload       jsonb,
  status        text NOT NULL DEFAULT 'processing'
                CHECK (status IN ('processing', 'processed', 'skipped', 'error')),
  error         text,
  sale_id       uuid,
  order_number  text,
  received_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_received
  ON stripe_webhook_events (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_webhook_events (type);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access"
  ON stripe_webhook_events FOR ALL USING (true) WITH CHECK (true);

-- ── order_audit_log: who changed what on an order ──────────────────────────
-- sale_id is intentionally NOT a foreign key: audit history must survive a
-- deleted order, and order_number is denormalised for the same reason.
CREATE TABLE IF NOT EXISTS order_audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       uuid,
  order_number  text,
  actor         text NOT NULL,   -- 'admin' | 'system:stripe' | 'customer'
  action        text NOT NULL,   -- 'order_created', 'order_updated', 'payment_paid', 'refund_issued', ...
  details       jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_audit_sale ON order_audit_log (sale_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_created
  ON order_audit_log (created_at DESC);

ALTER TABLE order_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access"
  ON order_audit_log FOR ALL USING (true) WITH CHECK (true);
