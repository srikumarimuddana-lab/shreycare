import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { decrementStockForSale } from "@/lib/inventory/decrement-stock";
import { logOrderAudit } from "@/lib/payments/audit";
import { sendPaymentReceipt, notifyAdmin, type ReceiptItem } from "@/lib/payments/emails";
import { shouldMarkPaid, refundStatus } from "@/lib/payments/status";

export interface SaleRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  items: ReceiptItem[];
  subtotal: number | string;
  shipping_amount: number | string | null;
  tax_amount: number | string;
  total: number | string;
  payment_method: string;
  payment_status: string;
  amount_refunded: number | string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
}

const SALE_COLUMNS =
  "id, order_number, customer_name, customer_email, items, subtotal, shipping_amount, tax_amount, total, payment_method, payment_status, amount_refunded, stripe_session_id, stripe_payment_intent_id";

// Resolve a ledger row from whatever reference a Stripe event carries.
// Preference order: our own sale_id from metadata (authoritative), then the
// session id, then the payment intent id.
export async function findSaleByStripeRef(ref: {
  saleId?: string | null;
  sessionId?: string | null;
  paymentIntentId?: string | null;
}): Promise<SaleRow | null> {
  if (ref.saleId) {
    const { data } = await supabaseAdmin
      .from("sales")
      .select(SALE_COLUMNS)
      .eq("id", ref.saleId)
      .maybeSingle();
    if (data) return data as unknown as SaleRow;
  }
  if (ref.sessionId) {
    const { data } = await supabaseAdmin
      .from("sales")
      .select(SALE_COLUMNS)
      .eq("stripe_session_id", ref.sessionId)
      .maybeSingle();
    if (data) return data as unknown as SaleRow;
  }
  if (ref.paymentIntentId) {
    const { data } = await supabaseAdmin
      .from("sales")
      .select(SALE_COLUMNS)
      .eq("stripe_payment_intent_id", ref.paymentIntentId)
      .maybeSingle();
    if (data) return data as unknown as SaleRow;
  }
  return null;
}

// Mark an order paid exactly once. Idempotent under Stripe's at-least-once
// delivery: the conditional update only wins when the row is still in a
// not-yet-paid state, so retried/duplicate events never double-decrement
// stock or double-send receipts.
export async function markSalePaid(
  sale: SaleRow,
  info: {
    sessionId?: string | null;
    paymentIntentId?: string | null;
    customerEmail?: string | null;
    eventId: string;
  },
): Promise<{ transitioned: boolean }> {
  if (!shouldMarkPaid(sale.payment_status)) {
    return { transitioned: false };
  }

  const { data: updated, error } = await supabaseAdmin
    .from("sales")
    .update({
      payment_status: "paid",
      payment_method: "stripe",
      paid_at: new Date().toISOString(),
      stripe_session_id: info.sessionId ?? sale.stripe_session_id,
      stripe_payment_intent_id:
        info.paymentIntentId ?? sale.stripe_payment_intent_id,
      customer_email: sale.customer_email || info.customerEmail || null,
    })
    .eq("id", sale.id)
    .in("payment_status", ["pending", "failed", "expired"])
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`sales update failed: ${error.message}`);
  if (!updated) return { transitioned: false }; // lost the race — already handled

  await logOrderAudit({
    saleId: sale.id,
    orderNumber: sale.order_number,
    actor: "system:stripe",
    action: "payment_paid",
    details: {
      event_id: info.eventId,
      session_id: info.sessionId ?? sale.stripe_session_id,
      payment_intent: info.paymentIntentId ?? sale.stripe_payment_intent_id,
      total: Number(sale.total),
    },
  });

  decrementStockForSale(sale.id, sale.items).catch((err) => {
    console.error("[payments] decrementStockForSale failed:", err);
  });

  const email = sale.customer_email || info.customerEmail;
  if (email) {
    sendPaymentReceipt({
      to: email,
      customerName: sale.customer_name,
      orderNumber: sale.order_number,
      items: sale.items,
      subtotal: Number(sale.subtotal),
      shippingAmount: Number(sale.shipping_amount ?? 0),
      taxAmount: Number(sale.tax_amount),
      total: Number(sale.total),
      paymentMethod: "card (Stripe)",
    }).catch((err) => console.error("[payments] receipt failed:", err));
  }

  notifyAdmin(
    `Payment received — ${sale.order_number} — $${Number(sale.total).toFixed(2)}`,
    `Stripe payment captured for order ${sale.order_number} (${sale.customer_name}).\n` +
      `Total: $${Number(sale.total).toFixed(2)}\n` +
      `Payment intent: ${info.paymentIntentId ?? "n/a"}\n\n` +
      `The order is marked paid in the ledger and is ready to fulfil.`,
  ).catch((err) => console.error("[payments] admin notice failed:", err));

  return { transitioned: true };
}

// Apply a (possibly partial) refund reported by Stripe. `amountRefundedCents`
// is the cumulative refunded amount on the charge, so replays and multiple
// partial refunds all converge on the same final state.
export async function applyRefundToSale(
  sale: SaleRow,
  amountRefundedCents: number,
  eventId: string,
): Promise<void> {
  const totalCents = Math.round(Number(sale.total) * 100);
  const status = refundStatus(totalCents, amountRefundedCents);
  const refunded = +(amountRefundedCents / 100).toFixed(2);

  const { error } = await supabaseAdmin
    .from("sales")
    .update({
      amount_refunded: refunded,
      payment_status: status,
      refunded_at: amountRefundedCents > 0 ? new Date().toISOString() : null,
    })
    .eq("id", sale.id)
    // Never resurrect a disputed order from a refund replay.
    .neq("payment_status", "disputed")
    .select("id");

  if (error) throw new Error(`refund update failed: ${error.message}`);

  await logOrderAudit({
    saleId: sale.id,
    orderNumber: sale.order_number,
    actor: "system:stripe",
    action: status === "refunded" ? "refund_full" : "refund_partial",
    details: { event_id: eventId, amount_refunded: refunded },
  });
}

// Extract the payment intent id from a Checkout Session, which may be a
// string id or an expanded object depending on how the event was delivered.
export function paymentIntentId(
  session: Stripe.Checkout.Session,
): string | null {
  const pi = session.payment_intent;
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
}
