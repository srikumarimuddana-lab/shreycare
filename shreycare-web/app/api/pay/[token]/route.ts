import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isStripeConfigured } from "@/lib/stripe";
import { createOrReuseCheckoutSession } from "@/lib/payments/stripe-checkout";
import { logOrderAudit } from "@/lib/payments/audit";
import { isPayLinkExpired } from "@/lib/payments/status";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Start a Stripe Checkout Session for an existing order via its pay token
// (QR code / payment link). Works for any still-unpaid order regardless of
// how it was originally created — an e-transfer order can be settled by card.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: "Invalid payment link" }, { status: 404 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Card payments are not available right now." },
      { status: 503 },
    );
  }

  const limited = rateLimit(`pay:${clientIp(req.headers)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const { data: sale, error } = await supabaseAdmin
    .from("sales")
    .select(
      "id, order_number, customer_email, items, shipping_amount, tax_amount, tax_rate, total, payment_status, fulfillment, pay_link_expires_at, stripe_session_id",
    )
    .eq("pay_token", token)
    .maybeSingle();

  if (error || !sale) {
    return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
  }
  if (sale.fulfillment === "cancelled") {
    return NextResponse.json({ error: "This order was cancelled." }, { status: 409 });
  }
  if (!["pending", "failed", "expired"].includes(sale.payment_status)) {
    return NextResponse.json(
      { error: "This order has already been paid." },
      { status: 409 },
    );
  }
  if (isPayLinkExpired(sale.pay_link_expires_at, new Date())) {
    return NextResponse.json(
      { error: "This payment link has expired. Please contact us for a new one." },
      { status: 410 },
    );
  }

  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const session = await createOrReuseCheckoutSession(sale, origin);

    if (!session.reused) {
      await supabaseAdmin
        .from("sales")
        .update({ stripe_session_id: session.sessionId })
        .eq("id", sale.id);
    }

    logOrderAudit({
      saleId: sale.id,
      orderNumber: sale.order_number,
      actor: "customer",
      action: "pay_link_opened",
      details: { session_id: session.sessionId, reused: session.reused },
    }).catch(() => {});

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[pay] session creation failed:", err);
    return NextResponse.json(
      { error: "Unable to start payment. Please try again." },
      { status: 500 },
    );
  }
}
