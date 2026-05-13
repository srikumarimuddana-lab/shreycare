import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import {
  aggregateCustomersFromSales,
  computeCustomerKPIs,
  computeRFM,
  type SaleForAnalytics,
} from "@/lib/customers/analytics";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("sales")
    .select(
      "id, order_number, sale_date, customer_name, customer_email, customer_phone, payment_status, type, fulfillment, subtotal, tax_amount, total",
    );

  if (error) {
    console.error("[admin/customers/summary] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats = computeRFM(aggregateCustomersFromSales((data ?? []) as SaleForAnalytics[]));
  const kpis = computeCustomerKPIs(stats);

  return NextResponse.json(kpis);
}
