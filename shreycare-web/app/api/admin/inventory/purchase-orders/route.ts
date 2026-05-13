import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface POJoined {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  ordered_at: string;
  supplier: string | null;
  notes: string | null;
  created_at: string;
  inventory_products: { name: string; unit_label: string } | null;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");

  let query = supabaseAdmin
    .from("purchase_orders")
    .select("*, inventory_products!inner(name, unit_label)")
    .order("ordered_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (productId) query = query.eq("product_id", productId);

  const { data, error } = await query;
  if (error) {
    console.error("[admin/inventory/purchase-orders] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the join for the client.
  const flat = ((data ?? []) as POJoined[]).map((row) => ({
    id: row.id,
    product_id: row.product_id,
    product_name: row.inventory_products?.name ?? "(deleted)",
    unit_label: row.inventory_products?.unit_label ?? "units",
    quantity: row.quantity,
    unit_cost: Number(row.unit_cost),
    total_cost: Number(row.total_cost),
    ordered_at: row.ordered_at,
    supplier: row.supplier,
    notes: row.notes,
    created_at: row.created_at,
  }));

  return NextResponse.json(flat);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const body = await req.json();
  const productId = body?.productId;
  const quantity = Math.floor(Number(body?.quantity));
  const unitCost = +(Number(body?.unitCost) || 0).toFixed(2);

  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
  if (!quantity || quantity <= 0) {
    return NextResponse.json({ error: "quantity must be > 0" }, { status: 400 });
  }
  if (unitCost < 0) {
    return NextResponse.json({ error: "unit_cost must be >= 0" }, { status: 400 });
  }

  // 1. Insert the PO.
  const { data: po, error: poErr } = await supabaseAdmin
    .from("purchase_orders")
    .insert({
      product_id: productId,
      quantity,
      unit_cost: unitCost,
      ordered_at: body.orderedAt || new Date().toISOString().slice(0, 10),
      supplier: body.supplier || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (poErr) {
    console.error("[admin/inventory/purchase-orders] POST insert error:", poErr);
    return NextResponse.json({ error: poErr.message }, { status: 500 });
  }

  // 2. Increment current_stock.
  const { data: product } = await supabaseAdmin
    .from("inventory_products")
    .select("current_stock")
    .eq("id", productId)
    .single();

  const newStock = Number(product?.current_stock ?? 0) + quantity;

  // 3. Recompute weighted average cost across all POs for this product.
  const { data: allPOs } = await supabaseAdmin
    .from("purchase_orders")
    .select("quantity, unit_cost")
    .eq("product_id", productId);

  const totals = (allPOs ?? []).reduce(
    (acc, p) => {
      const q = Number(p.quantity ?? 0);
      const c = Number(p.unit_cost ?? 0);
      return { qty: acc.qty + q, cost: acc.cost + q * c };
    },
    { qty: 0, cost: 0 },
  );
  const newWAC = totals.qty > 0 ? +(totals.cost / totals.qty).toFixed(2) : 0;

  await supabaseAdmin
    .from("inventory_products")
    .update({
      current_stock: newStock,
      cost_price: newWAC,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  // 4. Append audit row.
  await supabaseAdmin.from("stock_transactions").insert({
    product_id: productId,
    quantity_delta: quantity,
    source: "purchase_order",
    reference_id: po.id,
    note: body.supplier ? `PO from ${body.supplier}` : "Purchase order",
  });

  return NextResponse.json(po, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("purchase_orders").delete().eq("id", id);
  if (error) {
    console.error("[admin/inventory/purchase-orders] DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Stock is intentionally NOT reversed — the units may already have been sold.
  return NextResponse.json({
    ok: true,
    warning: "Stock level was not adjusted. If needed, edit stock manually.",
  });
}
