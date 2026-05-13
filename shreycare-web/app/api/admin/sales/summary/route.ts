import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function authorized(req: NextRequest): boolean {
  if (!ADMIN_SECRET) return false;
  const header = req.headers.get("x-admin-secret");
  if (header === ADMIN_SECRET) return true;
  const cookie = req.cookies.get("admin_secret")?.value;
  return cookie === ADMIN_SECRET;
}

interface Row {
  type: "online" | "offline";
  payment_status: string;
  fulfillment: string;
  subtotal: number | string | null;
  tax_amount: number | string | null;
  total: number | string | null;
}

// Effective total: prefer the stored `total`; fall back to subtotal + tax_amount
// for legacy rows where `total` was never set (e.g. offline sales saved before
// the POST endpoint was fixed). Returns a number.
function effectiveTotal(r: Row): number {
  const total = Number(r.total ?? 0);
  if (total > 0) return total;
  return Number(r.subtotal ?? 0) + Number(r.tax_amount ?? 0);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("sales")
    .select("type, payment_status, fulfillment, subtotal, tax_amount, total");

  if (error) {
    console.error("[admin/sales/summary] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];

  // Aggregate everything in a single pass so we never miss a row and so
  // each metric is consistently split by online vs offline.
  type Bucket = {
    count: number;
    revenue: number;
    subtotal: number;
    tax: number;
    paidRevenue: number;
    pendingRevenue: number;
    refundedRevenue: number;
    fulfillmentPending: number;
    fulfillmentShipped: number;
    fulfillmentDelivered: number;
    fulfillmentCancelled: number;
  };
  const emptyBucket = (): Bucket => ({
    count: 0,
    revenue: 0,
    subtotal: 0,
    tax: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    refundedRevenue: 0,
    fulfillmentPending: 0,
    fulfillmentShipped: 0,
    fulfillmentDelivered: 0,
    fulfillmentCancelled: 0,
  });
  const online = emptyBucket();
  const offline = emptyBucket();

  for (const r of rows) {
    const bucket = r.type === "offline" ? offline : online;
    const total = effectiveTotal(r);
    const subtotal = Number(r.subtotal ?? 0);
    const tax = Number(r.tax_amount ?? 0);

    bucket.count += 1;
    bucket.revenue += total;
    bucket.subtotal += subtotal;
    bucket.tax += tax;

    if (r.payment_status === "paid") bucket.paidRevenue += total;
    else if (r.payment_status === "pending") bucket.pendingRevenue += total;
    else if (r.payment_status === "refunded") bucket.refundedRevenue += total;

    if (r.fulfillment === "pending") bucket.fulfillmentPending += 1;
    else if (r.fulfillment === "shipped") bucket.fulfillmentShipped += 1;
    else if (r.fulfillment === "delivered") bucket.fulfillmentDelivered += 1;
    else if (r.fulfillment === "cancelled") bucket.fulfillmentCancelled += 1;
  }

  const round = (n: number) => +n.toFixed(2);
  const totals = {
    totalSales: online.count + offline.count,
    totalRevenue: round(online.revenue + offline.revenue),
    totalSubtotal: round(online.subtotal + offline.subtotal),
    totalTax: round(online.tax + offline.tax),
    paidRevenue: round(online.paidRevenue + offline.paidRevenue),
    pendingRevenue: round(online.pendingRevenue + offline.pendingRevenue),
    refundedRevenue: round(online.refundedRevenue + offline.refundedRevenue),
    onlineCount: online.count,
    offlineCount: offline.count,
    onlineRevenue: round(online.revenue),
    offlineRevenue: round(offline.revenue),
    fulfillmentPending: online.fulfillmentPending + offline.fulfillmentPending,
    fulfillmentShipped: online.fulfillmentShipped + offline.fulfillmentShipped,
    fulfillmentDelivered: online.fulfillmentDelivered + offline.fulfillmentDelivered,
    fulfillmentCancelled: online.fulfillmentCancelled + offline.fulfillmentCancelled,
  };

  const breakdown = {
    online: {
      count: online.count,
      revenue: round(online.revenue),
      subtotal: round(online.subtotal),
      tax: round(online.tax),
      paidRevenue: round(online.paidRevenue),
      pendingRevenue: round(online.pendingRevenue),
      refundedRevenue: round(online.refundedRevenue),
      fulfillmentPending: online.fulfillmentPending,
      fulfillmentShipped: online.fulfillmentShipped,
      fulfillmentDelivered: online.fulfillmentDelivered,
      fulfillmentCancelled: online.fulfillmentCancelled,
    },
    offline: {
      count: offline.count,
      revenue: round(offline.revenue),
      subtotal: round(offline.subtotal),
      tax: round(offline.tax),
      paidRevenue: round(offline.paidRevenue),
      pendingRevenue: round(offline.pendingRevenue),
      refundedRevenue: round(offline.refundedRevenue),
      fulfillmentPending: offline.fulfillmentPending,
      fulfillmentShipped: offline.fulfillmentShipped,
      fulfillmentDelivered: offline.fulfillmentDelivered,
      fulfillmentCancelled: offline.fulfillmentCancelled,
    },
  };

  return NextResponse.json({ ...totals, breakdown });
}
