import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import { logOrderAudit } from "@/lib/payments/audit";

// Payment QR for an order: encodes the public pay-link (/pay/<token>) so a
// customer can scan it in person and pay by card through Stripe Checkout.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const { data: sale, error } = await supabaseAdmin
    .from("sales")
    .select("id, order_number, pay_token, payment_status, total")
    .eq("id", id)
    .maybeSingle();

  if (error || !sale) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!sale.pay_token) {
    return NextResponse.json(
      { error: "This order has no pay token yet. Run the latest database migration." },
      { status: 409 },
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const payUrl = `${origin}/pay/${sale.pay_token}`;

  const svg = await QRCode.toString(payUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#384527", light: "#ffffff" },
  });

  logOrderAudit({
    saleId: sale.id,
    orderNumber: sale.order_number,
    actor: "admin",
    action: "pay_link_generated",
    details: { total: Number(sale.total) },
  }).catch(() => {});

  return NextResponse.json({
    url: payUrl,
    svg,
    orderNumber: sale.order_number,
    paymentStatus: sale.payment_status,
    total: Number(sale.total),
  });
}
