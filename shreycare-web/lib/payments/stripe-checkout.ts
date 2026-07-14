import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import type { ReceiptItem } from "@/lib/payments/emails";

export interface PayableSale {
  id: string;
  order_number: string;
  customer_email: string | null;
  items: ReceiptItem[];
  shipping_amount: number | string | null;
  tax_amount: number | string | null;
  tax_rate: number | string | null;
  stripe_session_id: string | null;
}

const CURRENCY = (process.env.NEXT_PUBLIC_STORE_CURRENCY || "CAD").toLowerCase();
const SESSION_TTL_SECONDS = 30 * 60;

// Derive the line-item type straight from the create() method signature so we
// don't depend on the exact namespace path of the params type (which varies
// across SDK minors).
type CheckoutCreateParams = NonNullable<
  Parameters<Stripe["checkout"]["sessions"]["create"]>[0]
>;
type CheckoutLineItem = NonNullable<CheckoutCreateParams["line_items"]>[number];

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// Build Stripe line items from the ledger row so the amount charged always
// equals the order total we computed server-side (products + shipping + tax
// as explicit lines — no client-supplied numbers anywhere).
function buildLineItems(sale: PayableSale): CheckoutLineItem[] {
  const lines: CheckoutLineItem[] = sale.items.map(
    (item) => ({
      price_data: {
        currency: CURRENCY,
        product_data: { name: item.productName },
        unit_amount: toCents(item.unitPrice),
      },
      quantity: item.quantity,
    }),
  );

  const shipping = Number(sale.shipping_amount ?? 0);
  if (shipping > 0) {
    lines.push({
      price_data: {
        currency: CURRENCY,
        product_data: { name: "Shipping" },
        unit_amount: toCents(shipping),
      },
      quantity: 1,
    });
  }

  const tax = Number(sale.tax_amount ?? 0);
  if (tax > 0) {
    const rate = Number(sale.tax_rate ?? 0);
    lines.push({
      price_data: {
        currency: CURRENCY,
        product_data: {
          name: rate > 0 ? `PST (${(rate * 100).toFixed(0)}%)` : "Tax",
        },
        unit_amount: toCents(tax),
      },
      quantity: 1,
    });
  }

  return lines;
}

// Create a Checkout Session for an existing ledger order, reusing a
// still-open session when one exists so double clicks / QR re-scans don't
// spawn parallel payable sessions for the same order.
export async function createOrReuseCheckoutSession(
  sale: PayableSale,
  origin: string,
): Promise<{ url: string; sessionId: string; reused: boolean }> {
  const stripe = getStripe();

  if (sale.stripe_session_id) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(
        sale.stripe_session_id,
      );
      if (
        existing.status === "open" &&
        existing.url &&
        (existing.expires_at ?? 0) * 1000 > Date.now() + 60_000
      ) {
        return { url: existing.url, sessionId: existing.id, reused: true };
      }
    } catch (err) {
      // A stale/foreign session id must not block payment — fall through and
      // mint a fresh session.
      console.warn("[payments] could not reuse session:", err);
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: buildLineItems(sale),
    customer_email: sale.customer_email || undefined,
    client_reference_id: sale.id,
    metadata: { sale_id: sale.id, order_number: sale.order_number },
    payment_intent_data: {
      description: `ShreyCare order ${sale.order_number}`,
      metadata: { sale_id: sale.id, order_number: sale.order_number },
    },
    expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }
  return { url: session.url, sessionId: session.id, reused: false };
}
