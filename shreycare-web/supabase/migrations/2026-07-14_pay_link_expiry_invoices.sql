-- Payment links now carry a default 7-day expiry, and invoices can be sent
-- (and re-sent) to customers. Track when a pay link expires and how many
-- times an invoice has been emailed.

ALTER TABLE sales
  -- Existing rows: give them a 7-day window from now so already-open orders
  -- remain payable rather than instantly expiring.
  ADD COLUMN IF NOT EXISTS pay_link_expires_at timestamptz
    NOT NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS invoice_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invoice_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sales_pay_link_expires
  ON sales (pay_link_expires_at);
