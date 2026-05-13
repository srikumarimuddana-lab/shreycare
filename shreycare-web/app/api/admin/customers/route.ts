import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import {
  aggregateCustomersFromSales,
  computeRFM,
  mergeCustomerMetadata,
  type SaleForAnalytics,
} from "@/lib/customers/analytics";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const segment = url.searchParams.get("segment");
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
  const sortBy = url.searchParams.get("sortBy") ?? "totalSpent";

  const [salesRes, metaRes] = await Promise.all([
    supabaseAdmin
      .from("sales")
      .select(
        "id, order_number, sale_date, customer_name, customer_email, customer_phone, payment_status, type, fulfillment, subtotal, tax_amount, total",
      ),
    supabaseAdmin.from("customers").select("*"),
  ]);

  if (salesRes.error) {
    console.error("[admin/customers] sales error:", salesRes.error);
    return NextResponse.json({ error: salesRes.error.message }, { status: 500 });
  }

  const stats = computeRFM(aggregateCustomersFromSales((salesRes.data ?? []) as SaleForAnalytics[]));
  let merged = mergeCustomerMetadata(stats, metaRes.data ?? []);

  if (segment) {
    merged = merged.filter((c) => c.effectiveSegment.toLowerCase() === segment.toLowerCase());
  }
  if (search) {
    merged = merged.filter(
      (c) =>
        c.email.includes(search) ||
        c.name.toLowerCase().includes(search) ||
        (c.phone ?? "").toLowerCase().includes(search),
    );
  }

  // Sorting.
  merged.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "lastOrder":
        return b.lastOrderDate.localeCompare(a.lastOrderDate);
      case "orders":
        return b.totalOrders - a.totalOrders;
      case "aov":
        return b.averageOrderValue - a.averageOrderValue;
      case "totalSpent":
      default:
        return b.totalSpent - a.totalSpent;
    }
  });

  return NextResponse.json(merged);
}
