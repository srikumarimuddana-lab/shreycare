-- Online orders capture a full shipping address at checkout, but it was only
-- ever emailed to the team — never stored on the sales row. As a result the
-- ledger showed no address for any order. Persist it as JSONB so the admin
-- dashboard can display (and export) where each online order ships.
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS shipping_address jsonb;
