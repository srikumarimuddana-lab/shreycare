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
  subtotal: number;
  tax_amount: number;
  total: number;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [all, paid, pending, online, offline] = await Promise.all([
    supabaseAdmin.from("sales").select("subtotal, tax_amount, total"),
    supabaseAdmin.from("sales").select("subtotal, tax_amount, total").eq("payment_status", "paid"),
    supabaseAdmin.from("sales").select("subtotal, tax_amount, total").eq("payment_status", "pending"),
    supabaseAdmin.from("sales").select("subtotal, tax_amount, total").eq("type", "online"),
    supabaseAdmin.from("sales").select("subtotal, tax_amount, total").eq("type", "offline"),
  ]);

  const sumField = (rows: Row[] | null, field: keyof Row) =>
    (rows ?? []).reduce((s, r) => s + Number(r[field] ?? 0), 0);

  return NextResponse.json({
    totalSales: all.data?.length ?? 0,
    totalRevenue: sumField(all.data as Row[] | null, "total"),
    totalSubtotal: sumField(all.data as Row[] | null, "subtotal"),
    totalTax: sumField(all.data as Row[] | null, "tax_amount"),
    paidRevenue: sumField(paid.data as Row[] | null, "total"),
    pendingRevenue: sumField(pending.data as Row[] | null, "total"),
    onlineCount: online.data?.length ?? 0,
    offlineCount: offline.data?.length ?? 0,
    onlineRevenue: sumField(online.data as Row[] | null, "total"),
    offlineRevenue: sumField(offline.data as Row[] | null, "total"),
  });
}
