import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isStripeConfigured } from "@/lib/stripe";
import { priceOrder } from "@/lib/payments/pricing";
import { generateUniqueOrderNumber } from "@/lib/payments/order-number";
import { createOrReuseCheckoutSession } from "@/lib/payments/stripe-checkout";
import { logOrderAudit } from "@/lib/payments/audit";
import {
  validateOrderPayload,
  toShippingAddress,
  type OrderPayload,
} from "@/lib/payments/types";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Card checkout: record the order in the ledger first (payment pending), then
// send the customer to a Stripe Checkout Session whose amounts come entirely
// from server-side pricing. The webhook flips the ledger row to paid — the
// browser redirect is never trusted as proof of payment.
export async function POST(request: NextRequest) {
  try {
    if (!(await isStripeConfigured())) {
      return NextResponse.json(
        { error: "Card payments are not available right now. Please choose e-Transfer instead." },
        { status: 503 },
      );
    }

    const limited = rateLimit(`checkout:${clientIp(request.headers)}`, 10, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
      );
    }

    const body = (await request.json()) as OrderPayload;
    const invalid = validateOrderPayload(body);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }
    const { customer, items } = body;

    const priced = await priceOrder(items, {
      city: customer.city,
      state: customer.state,
    });

    const unavailable = priced.items.find((i) => !i.inStock);
    if (unavailable) {
      return NextResponse.json(
        { error: `${unavailable.name} is currently out of stock.` },
        { status: 409 },
      );
    }

    const orderNumber = await generateUniqueOrderNumber();
    const saleItems = priced.items.map((i) => ({
      productName: i.name,
      quantity: i.quantity,
      unitPrice: i.price,
    }));

    const { data: sale, error: dbErr } = await supabaseAdmin
      .from("sales")
      .insert({
        order_number: orderNumber,
        type: "online",
        sale_date: new Date().toISOString(),
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        shipping_address: toShippingAddress(customer),
        items: saleItems,
        subtotal: priced.subtotal,
        shipping_amount: priced.shipping,
        tax_rate: priced.taxRate,
        tax_amount: priced.taxAmount,
        total: priced.total,
        payment_method: "stripe",
        payment_status: "pending",
        fulfillment: "pending",
        notes: customer.notes || null,
      })
      .select("id, order_number, customer_email, items, shipping_amount, tax_amount, tax_rate, stripe_session_id")
      .single();

    if (dbErr || !sale) {
      console.error("[checkout] sales insert failed:", dbErr);
      return NextResponse.json(
        { error: "Unable to start checkout. Please try again." },
        { status: 500 },
      );
    }

    const session = await createOrReuseCheckoutSession(
      sale,
      request.nextUrl.origin,
    );

    await supabaseAdmin
      .from("sales")
      .update({ stripe_session_id: session.sessionId })
      .eq("id", sale.id);

    logOrderAudit({
      saleId: sale.id,
      orderNumber,
      actor: "customer",
      action: "order_created",
      details: {
        channel: "stripe_checkout",
        session_id: session.sessionId,
        total: priced.total,
      },
    }).catch(() => {});

    return NextResponse.json({ url: session.url, orderNumber });
  } catch (error) {
    console.error("[checkout] error:", error);
    return NextResponse.json(
      { error: "Checkout failed. Please try again." },
      { status: 500 },
    );
  }
}
