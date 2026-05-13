-- Inventory management schema
-- Three tables: inventory_products (cost/stock bridge), purchase_orders (restocks),
-- stock_transactions (immutable audit log).

CREATE TABLE IF NOT EXISTS inventory_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  sanity_id     text,
  cost_price    numeric(10,2) NOT NULL DEFAULT 0,
  current_stock integer NOT NULL DEFAULT 0,
  reorder_point integer NOT NULL DEFAULT 5,
  unit_label    text NOT NULL DEFAULT 'units',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_products_name
  ON inventory_products (name);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES inventory_products(id) ON DELETE RESTRICT,
  quantity    integer NOT NULL CHECK (quantity > 0),
  unit_cost   numeric(10,2) NOT NULL CHECK (unit_cost >= 0),
  total_cost  numeric(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  ordered_at  date NOT NULL DEFAULT CURRENT_DATE,
  supplier    text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_product_id ON purchase_orders (product_id);
CREATE INDEX IF NOT EXISTS idx_po_ordered_at ON purchase_orders (ordered_at DESC);

CREATE TABLE IF NOT EXISTS stock_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES inventory_products(id) ON DELETE RESTRICT,
  quantity_delta  integer NOT NULL,
  source          text NOT NULL CHECK (source IN ('purchase_order', 'sale', 'adjustment')),
  reference_id    uuid,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_tx_product_id
  ON stock_transactions (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_tx_created_at
  ON stock_transactions (created_at DESC);

ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON inventory_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);
