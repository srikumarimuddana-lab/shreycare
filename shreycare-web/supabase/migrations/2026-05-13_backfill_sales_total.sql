-- Backfill `total` for legacy sales rows (mostly offline sales saved before
-- the POST endpoint persisted tax_amount/total). Without this, the ledger
-- summary aggregations report $0 revenue for those rows.

UPDATE sales
SET total = ROUND((COALESCE(subtotal, 0) + COALESCE(tax_amount, 0))::numeric, 2)
WHERE COALESCE(total, 0) = 0
  AND COALESCE(subtotal, 0) > 0;
