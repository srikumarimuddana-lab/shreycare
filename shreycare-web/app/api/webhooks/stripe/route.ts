import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sanityWriteClient } from "@/lib/sanity/client";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const lineItems = await getStripe().checkout.sessions.listLineItems(session.id);

    await sanityWriteClient.create({
      _type: "order",
      orderNumber: `SC-${Date.now()}`,
      customerEmail: session.customer_details?.email,
      items: lineItems.data.map((item) => ({
        _type: "orderItem",
        _key: item.id,
        name: item.description,
        quantity: item.quantity,
        price: (item.amount_total || 0) / 100,
      })),
      total: (session.amount_total || 0) / 100,
      shippingAddress: (session as unknown as { shipping_details?: { address?: unknown } }).shipping_details?.address ?? null,
      status: "paid",
      stripeSessionId: session.id,
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ received: true });
}
