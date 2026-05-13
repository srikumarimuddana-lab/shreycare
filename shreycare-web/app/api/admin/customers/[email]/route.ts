import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import {
  aggregateCustomersFromSales,
  computeRFM,
  mergeCustomerMetadata,
  type SaleForAnalytics,
} from "@/lib/customers/analytics";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> },
) {
  if (!isAuthorized(req)) return unauthorized();

  const { email: encoded } = await params;
  const email = decodeURIComponent(encoded).trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const [salesRes, metaRes] = await Promise.all([
    supabaseAdmin
      .from("sales")
      .select(
        "id, order_number, sale_date, customer_name, customer_email, customer_phone, payment_status, type, fulfillment, subtotal, tax_amount, total, items, payment_method, notes",
      )
      .ilike("customer_email", email)
      .order("sale_date", { ascending: false }),
    supabaseAdmin.from("customers").select("*").eq("email", email).maybeSingle(),
  ]);

  if (salesRes.error) {
    console.error("[admin/customers/[email]] error:", salesRes.error);
    return NextResponse.json({ error: salesRes.error.message }, { status: 500 });
  }

  const sales = (salesRes.data ?? []) as SaleForAnalytics[];
  if (sales.length === 0 && !metaRes.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // To compute RFM scores correctly, the customer needs to be ranked against
  // the full population — fetch all customers' aggregates for context.
  const { data: allSales } = await supabaseAdmin
    .from("sales")
    .select(
      "id, order_number, sale_date, customer_name, customer_email, customer_phone, payment_status, type, fulfillment, subtotal, tax_amount, total",
    );

  const allStats = computeRFM(aggregateCustomersFromSales((allSales ?? []) as SaleForAnalytics[]));
  const meta = metaRes.data ? [metaRes.data] : [];
  const merged = mergeCustomerMetadata(allStats, meta);
  const customer = merged.find((c) => c.email === email);

  return NextResponse.json({
    customer,
    orders: sales,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> },
) {
  if (!isAuthorized(req)) return unauthorized();

  const { email: encoded } = await params;
  const email = decodeURIComponent(encoded).trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const body = await req.json();

  const upsertRow: Record<string, unknown> = {
    email,
    updated_at: new Date().toISOString(),
  };
  if (body.name !== undefined) upsertRow.name = body.name || null;
  if (body.phone !== undefined) upsertRow.phone = body.phone || null;
  if (body.notes !== undefined) upsertRow.notes = body.notes || null;
  if (body.tags !== undefined) {
    upsertRow.tags = Array.isArray(body.tags) ? body.tags : [];
  }
  if (body.segmentOverride !== undefined) {
    upsertRow.segment_override = body.segmentOverride || null;
  }

  const { data, error } = await supabaseAdmin
    .from("customers")
    .upsert(upsertRow, { onConflict: "email" })
    .select()
    .single();

  if (error) {
    console.error("[admin/customers/[email]] PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
