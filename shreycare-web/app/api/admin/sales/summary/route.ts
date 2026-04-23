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

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [all, paid, pending, online, offline] = await Promise.all([
    supabaseAdmin.from("sales").select("subtotal"),
    supabaseAdmin.from("sales").select("subtotal").eq("payment_status", "paid"),
    supabaseAdmin.from("sales").select("subtotal").eq("payment_status", "pending"),
    supabaseAdmin.from("sales").select("subtotal").eq("type", "online"),
    supabaseAdmin.from("sales").select("subtotal").eq("type", "offline"),
  ]);

  const sum = (rows: { subtotal: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + Number(r.subtotal), 0);

  return NextResponse.json({
    totalSales: all.data?.length ?? 0,
    totalRevenue: sum(all.data as { subtotal: number }[] | null),
    paidRevenue: sum(paid.data as { subtotal: number }[] | null),
    pendingRevenue: sum(pending.data as { subtotal: number }[] | null),
    onlineCount: online.data?.length ?? 0,
    offlineCount: offline.data?.length ?? 0,
    onlineRevenue: sum(online.data as { subtotal: number }[] | null),
    offlineRevenue: sum(offline.data as { subtotal: number }[] | null),
  });
}
