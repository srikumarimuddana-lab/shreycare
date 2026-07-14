import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import { getStripeMode } from "@/lib/stripe";
import {
  aggregatePayments,
  type SaleForPayments,
} from "@/lib/payments/analytics";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let salesQuery = supabaseAdmin
    .from("sales")
    .select(
      "type, sale_date, payment_method, payment_status, subtotal, tax_amount, total, amount_refunded",
    );
  if (from) salesQuery = salesQuery.gte("sale_date", from);
  if (to) salesQuery = salesQuery.lte("sale_date", `${to}T23:59:59Z`);

  const [salesRes, eventsRes, auditRes] = await Promise.all([
    salesQuery,
    supabaseAdmin
      .from("stripe_webhook_events")
      .select("id, type, status, order_number, error, received_at")
      .order("received_at", { ascending: false })
      .limit(25),
    supabaseAdmin
      .from("order_audit_log")
      .select("id, order_number, actor, action, details, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (salesRes.error) {
    console.error("[payments/analytics] sales query error:", salesRes.error);
    return NextResponse.json({ error: salesRes.error.message }, { status: 500 });
  }

  const analytics = aggregatePayments(
    (salesRes.data ?? []) as SaleForPayments[],
  );

  // The audit tables may not exist until the migration runs — treat that as
  // empty rather than a hard failure so the dashboard still loads.
  const webhookEvents = eventsRes.error ? [] : (eventsRes.data ?? []);
  const auditLog = auditRes.error ? [] : (auditRes.data ?? []);

  return NextResponse.json({
    ...analytics,
    stripeMode: getStripeMode(),
    webhookEvents,
    auditLog,
    auditTablesMissing: Boolean(eventsRes.error || auditRes.error),
  });
}
