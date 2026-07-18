import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import { generateUniqueOrderNumber } from "@/lib/payments/order-number";
import { logOrderAudit } from "@/lib/payments/audit";

// Recreate a new order from an existing one — typically to re-book a cancelled
// order that was actually fulfilled offline, so the ledger balances. The new
// order is an independent row with its own order number and pay token; the
// source order is left untouched.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as {
    paymentMethod?: string;
    paymentStatus?: string;
    type?: "online" | "offline";
  };

  const { data: source, error } = await supabaseAdmin
    .from("sales")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !source) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orderNumber = await generateUniqueOrderNumber();
  // Default to an offline, paid cash re-booking (the common ledger-balancing
  // case), but let the caller override method/status/type.
  const paymentMethod = body.paymentMethod || "cash";
  const paymentStatus = body.paymentStatus || (paymentMethod === "stripe" ? "pending" : "paid");

  const { data: created, error: insertErr } = await supabaseAdmin
    .from("sales")
    .insert({
      order_number: orderNumber,
      type: body.type || source.type || "offline",
      sale_date: new Date().toISOString(),
      customer_name: source.customer_name,
      customer_email: source.customer_email,
      customer_phone: source.customer_phone,
      shipping_address: source.shipping_address,
      items: source.items,
      subtotal: source.subtotal,
      shipping_amount: source.shipping_amount ?? 0,
      tax_rate: source.tax_rate,
      tax_amount: source.tax_amount,
      total: source.total,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      fulfillment: paymentStatus === "paid" ? "delivered" : "pending",
      notes: source.notes
        ? `${source.notes}\n(Recreated from ${source.order_number})`
        : `Recreated from ${source.order_number}`,
    })
    .select("id, order_number")
    .single();

  if (insertErr || !created) {
    console.error("[duplicate] insert failed:", insertErr);
    return NextResponse.json({ error: "Failed to recreate order." }, { status: 500 });
  }

  await logOrderAudit({
    saleId: created.id,
    orderNumber: created.order_number,
    actor: "admin",
    action: "order_recreated",
    details: { from_order: source.order_number, from_id: source.id, payment_method: paymentMethod, payment_status: paymentStatus },
  });

  return NextResponse.json(
    { ok: true, id: created.id, orderNumber: created.order_number },
    { status: 201 },
  );
}
