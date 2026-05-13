import { supabaseAdmin } from "@/lib/supabase";

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

// Decrement inventory_products.current_stock for each item in a sale and append
// a stock_transactions audit row. Designed to be fire-and-forget: errors are
// logged but never propagate. A sale that completed successfully must never be
// rolled back because of a missing or unmatched inventory record.
export async function decrementStockForSale(
  saleId: string,
  items: SaleItem[],
): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    if (!item?.productName || !Number.isFinite(item.quantity) || item.quantity <= 0) {
      continue;
    }

    const trimmed = item.productName.trim();
    if (!trimmed) continue;

    const { data: product, error: lookupErr } = await supabaseAdmin
      .from("inventory_products")
      .select("id, current_stock")
      .ilike("name", trimmed)
      .eq("is_active", true)
      .maybeSingle();

    if (lookupErr) {
      console.error(`[inventory] lookup failed for "${trimmed}":`, lookupErr);
      continue;
    }
    if (!product) {
      console.info(`[inventory] no record for "${trimmed}" — skipping decrement`);
      continue;
    }

    const newStock = Number(product.current_stock ?? 0) - item.quantity;

    const { error: updateErr } = await supabaseAdmin
      .from("inventory_products")
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", product.id);

    if (updateErr) {
      console.error(`[inventory] decrement failed for "${trimmed}":`, updateErr);
      continue;
    }

    const { error: txErr } = await supabaseAdmin
      .from("stock_transactions")
      .insert({
        product_id: product.id,
        quantity_delta: -item.quantity,
        source: "sale",
        reference_id: saleId,
        note: "Sale auto-decrement",
      });

    if (txErr) {
      console.error(`[inventory] stock_transactions insert failed:`, txErr);
    }
  }
}
