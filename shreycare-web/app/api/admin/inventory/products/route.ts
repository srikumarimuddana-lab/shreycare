import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const url = new URL(req.url);
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  let query = supabaseAdmin
    .from("inventory_products")
    .select("*")
    .order("name", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) {
    console.error("[admin/inventory/products] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const body = await req.json();
  if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Product name required" }, { status: 400 });
  }

  const initialStock = Math.max(0, Math.floor(Number(body.currentStock) || 0));

  const { data, error } = await supabaseAdmin
    .from("inventory_products")
    .insert({
      name: body.name.trim(),
      sanity_id: body.sanityId || null,
      cost_price: +(Number(body.costPrice) || 0).toFixed(2),
      current_stock: initialStock,
      reorder_point: Math.max(0, Math.floor(Number(body.reorderPoint) || 5)),
      unit_label: body.unitLabel || "units",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `A product named "${body.name}" already exists.` },
        { status: 409 },
      );
    }
    console.error("[admin/inventory/products] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data && initialStock > 0) {
    await supabaseAdmin.from("stock_transactions").insert({
      product_id: data.id,
      quantity_delta: initialStock,
      source: "adjustment",
      note: "Initial stock on product creation",
    });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const body = await req.json();
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.sanityId !== undefined) updates.sanity_id = body.sanityId || null;
  if (body.costPrice !== undefined) updates.cost_price = +(Number(body.costPrice) || 0).toFixed(2);
  if (body.reorderPoint !== undefined)
    updates.reorder_point = Math.max(0, Math.floor(Number(body.reorderPoint) || 0));
  if (body.unitLabel !== undefined) updates.unit_label = String(body.unitLabel);
  if (body.isActive !== undefined) updates.is_active = !!body.isActive;

  // Manual stock adjustment: track the delta in stock_transactions.
  let stockDelta = 0;
  if (body.currentStock !== undefined) {
    const newStock = Math.floor(Number(body.currentStock) || 0);
    const { data: existing } = await supabaseAdmin
      .from("inventory_products")
      .select("current_stock")
      .eq("id", body.id)
      .single();
    const oldStock = Number(existing?.current_stock ?? 0);
    stockDelta = newStock - oldStock;
    updates.current_stock = newStock;
  }

  const { data, error } = await supabaseAdmin
    .from("inventory_products")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("[admin/inventory/products] PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (stockDelta !== 0 && data) {
    await supabaseAdmin.from("stock_transactions").insert({
      product_id: data.id,
      quantity_delta: stockDelta,
      source: "adjustment",
      note: body.adjustmentNote || "Manual stock adjustment",
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("inventory_products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[admin/inventory/products] DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
