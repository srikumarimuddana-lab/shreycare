import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function authorized(req: NextRequest): boolean {
  if (!ADMIN_SECRET) return false;
  const header = req.headers.get("x-admin-secret");
  if (header === ADMIN_SECRET) return true;
  const cookie = req.cookies.get("admin_secret")?.value;
  return cookie === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return unauthorized();

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = supabaseAdmin
    .from("sales")
    .select("*")
    .order("sale_date", { ascending: false })
    .limit(500);

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("payment_status", status);
  if (from) query = query.gte("sale_date", from);
  if (to) query = query.lte("sale_date", `${to}T23:59:59Z`);

  const { data, error } = await query;
  if (error) {
    console.error("[admin/sales] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return unauthorized();

  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("sales")
    .insert({
      order_number: body.orderNumber,
      type: body.type || "offline",
      sale_date: body.date || new Date().toISOString(),
      customer_name: body.customerName,
      customer_email: body.customerEmail || null,
      customer_phone: body.customerPhone || null,
      items: body.items || [],
      subtotal: body.subtotal || 0,
      payment_method: body.paymentMethod || "cash",
      payment_status: body.paymentStatus || "pending",
      fulfillment: body.fulfillment || "pending",
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/sales] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return unauthorized();

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.paymentStatus) updates.payment_status = body.paymentStatus;
  if (body.fulfillment) updates.fulfillment = body.fulfillment;
  if (body.paymentMethod) updates.payment_method = body.paymentMethod;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error } = await supabaseAdmin
    .from("sales")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("[admin/sales] PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
