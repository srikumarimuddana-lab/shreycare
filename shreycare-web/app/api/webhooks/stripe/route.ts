import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { logOrderAudit } from "@/lib/payments/audit";
import { notifyAdmin } from "@/lib/payments/emails";
import {
  findSaleByStripeRef,
  markSalePaid,
  applyRefundToSale,
  paymentIntentId,
  type SaleRow,
} from "@/lib/payments/fulfil";
import {
  shouldMarkExpired,
  shouldMarkFailed,
  refundStatus,
} from "@/lib/payments/status";

interface Outcome {
  status: "processed" | "skipped";
  saleId?: string | null;
  orderNumber?: string | null;
  note?: string;
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Replay protection: claim the event id before doing any work. Stripe
  // delivers at-least-once, so duplicates are expected and must be no-ops.
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from("stripe_webhook_events")
    .upsert(
      {
        id: event.id,
        type: event.type,
        api_version: event.api_version ?? null,
        payload: event.data.object as unknown as Record<string, unknown>,
        status: "processing",
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id");

  if (claimErr) {
    console.error("[stripe-webhook] event claim failed:", claimErr);
    return NextResponse.json({ error: "Event store unavailable" }, { status: 500 });
  }

  if (!claimed || claimed.length === 0) {
    // Already seen. Only re-run events whose previous attempt errored.
    const { data: existing } = await supabaseAdmin
      .from("stripe_webhook_events")
      .select("status")
      .eq("id", event.id)
      .maybeSingle();

    if (existing?.status !== "error") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    await supabaseAdmin
      .from("stripe_webhook_events")
      .update({ status: "processing", error: null })
      .eq("id", event.id);
  }

  try {
    const outcome = await handleEvent(event);
    await supabaseAdmin
      .from("stripe_webhook_events")
      .update({
        status: outcome.status,
        sale_id: outcome.saleId ?? null,
        order_number: outcome.orderNumber ?? null,
        error: outcome.note ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", event.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe-webhook] ${event.type} failed:`, err);
    await supabaseAdmin
      .from("stripe_webhook_events")
      .update({ status: "error", error: message, processed_at: new Date().toISOString() })
      .eq("id", event.id);
    // 500 makes Stripe retry with backoff; the claim logic above lets the
    // retry re-run because the row is marked "error".
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function handleEvent(event: Stripe.Event): Promise<Outcome> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const sale = await findSaleForSession(session);
      if (!sale) return orphan(event, session.id);

      // `completed` fires for async methods before funds settle; only treat
      // it as money-in-hand when Stripe says the session is actually paid.
      if (session.payment_status !== "paid") {
        await logOrderAudit({
          saleId: sale.id,
          orderNumber: sale.order_number,
          actor: "system:stripe",
          action: "payment_processing",
          details: { event_id: event.id, session_id: session.id },
        });
        return { status: "processed", saleId: sale.id, orderNumber: sale.order_number, note: "awaiting async payment" };
      }

      const { transitioned } = await markSalePaid(sale, {
        sessionId: session.id,
        paymentIntentId: paymentIntentId(session),
        customerEmail: session.customer_details?.email ?? null,
        eventId: event.id,
      });
      return {
        status: "processed",
        saleId: sale.id,
        orderNumber: sale.order_number,
        note: transitioned ? undefined : "already paid — no-op",
      };
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const sale = await findSaleForSession(session);
      if (!sale) return orphan(event, session.id);

      if (shouldMarkFailed(sale.payment_status)) {
        await supabaseAdmin
          .from("sales")
          .update({ payment_status: "failed" })
          .eq("id", sale.id)
          .eq("payment_status", "pending");
        await logOrderAudit({
          saleId: sale.id,
          orderNumber: sale.order_number,
          actor: "system:stripe",
          action: "payment_failed",
          details: { event_id: event.id, session_id: session.id },
        });
        notifyAdmin(
          `Payment failed — ${sale.order_number}`,
          `The async payment for order ${sale.order_number} (${sale.customer_name}) failed.\n` +
            `The customer was not charged. You may want to follow up with an alternative payment method.`,
        ).catch(() => {});
      }
      return { status: "processed", saleId: sale.id, orderNumber: sale.order_number };
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const sale = await findSaleForSession(session);
      if (!sale) return orphan(event, session.id);

      if (shouldMarkExpired(sale.payment_status)) {
        await supabaseAdmin
          .from("sales")
          .update({ payment_status: "expired" })
          .eq("id", sale.id)
          .eq("payment_status", "pending");
        await logOrderAudit({
          saleId: sale.id,
          orderNumber: sale.order_number,
          actor: "system:stripe",
          action: "checkout_expired",
          details: { event_id: event.id, session_id: session.id },
        });
      }
      return { status: "processed", saleId: sale.id, orderNumber: sale.order_number };
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const sale = await findSaleByStripeRef({
        saleId: intent.metadata?.sale_id,
        paymentIntentId: intent.id,
      });
      // Declined attempts inside a still-open session are normal — just keep
      // an audit trail; the session stays payable.
      if (sale) {
        await logOrderAudit({
          saleId: sale.id,
          orderNumber: sale.order_number,
          actor: "system:stripe",
          action: "payment_attempt_failed",
          details: {
            event_id: event.id,
            payment_intent: intent.id,
            reason: intent.last_payment_error?.message ?? null,
          },
        });
      }
      return {
        status: "processed",
        saleId: sale?.id,
        orderNumber: sale?.order_number,
        note: sale ? undefined : "no matching sale",
      };
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const sale = await findSaleByStripeRef({
        saleId: charge.metadata?.sale_id,
        paymentIntentId:
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id,
      });
      if (!sale) return orphan(event, charge.id);

      await applyRefundToSale(sale, charge.amount_refunded, event.id);
      notifyAdmin(
        `Refund processed — ${sale.order_number}`,
        `Stripe refunded $${(charge.amount_refunded / 100).toFixed(2)} on order ${sale.order_number}.\n` +
          `Charge: ${charge.id}`,
      ).catch(() => {});
      return { status: "processed", saleId: sale.id, orderNumber: sale.order_number };
    }

    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      const sale = await findSaleByStripeRef({
        paymentIntentId:
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id,
      });
      if (!sale) return orphan(event, dispute.id);

      await supabaseAdmin
        .from("sales")
        .update({ payment_status: "disputed" })
        .eq("id", sale.id);
      await logOrderAudit({
        saleId: sale.id,
        orderNumber: sale.order_number,
        actor: "system:stripe",
        action: "dispute_opened",
        details: {
          event_id: event.id,
          dispute_id: dispute.id,
          reason: dispute.reason,
          amount: dispute.amount / 100,
        },
      });
      notifyAdmin(
        `⚠️ Chargeback opened — ${sale.order_number}`,
        `A dispute was opened on order ${sale.order_number} (${sale.customer_name}).\n` +
          `Reason: ${dispute.reason}\nAmount: $${(dispute.amount / 100).toFixed(2)}\n\n` +
          `Respond in the Stripe Dashboard before the evidence deadline.`,
      ).catch(() => {});
      return { status: "processed", saleId: sale.id, orderNumber: sale.order_number };
    }

    case "charge.dispute.closed": {
      const dispute = event.data.object as Stripe.Dispute;
      const sale = await findSaleByStripeRef({
        paymentIntentId:
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id,
      });
      if (!sale) return orphan(event, dispute.id);

      // Won: restore the pre-dispute state (paid, or the refund state if a
      // partial refund had been issued). Lost: funds are gone — refunded.
      const totalCents = Math.round(Number(sale.total) * 100);
      const refundedCents = Math.round(Number(sale.amount_refunded ?? 0) * 100);
      const restored =
        dispute.status === "won"
          ? refundStatus(totalCents, refundedCents)
          : "refunded";

      await supabaseAdmin
        .from("sales")
        .update({ payment_status: restored })
        .eq("id", sale.id)
        .eq("payment_status", "disputed");
      await logOrderAudit({
        saleId: sale.id,
        orderNumber: sale.order_number,
        actor: "system:stripe",
        action: dispute.status === "won" ? "dispute_won" : "dispute_lost",
        details: { event_id: event.id, dispute_id: dispute.id, status: dispute.status },
      });
      notifyAdmin(
        `Dispute ${dispute.status} — ${sale.order_number}`,
        `The dispute on order ${sale.order_number} closed with status "${dispute.status}".`,
      ).catch(() => {});
      return { status: "processed", saleId: sale.id, orderNumber: sale.order_number };
    }

    default:
      return { status: "skipped", note: `unhandled event type ${event.type}` };
  }
}

async function findSaleForSession(
  session: Stripe.Checkout.Session,
): Promise<SaleRow | null> {
  return findSaleByStripeRef({
    saleId: session.metadata?.sale_id ?? session.client_reference_id,
    sessionId: session.id,
    paymentIntentId: paymentIntentId(session),
  });
}

// A Stripe object we can't tie to a ledger row — most likely created outside
// this app (e.g. directly in the Dashboard). Surface it rather than erroring
// so Stripe doesn't retry forever.
function orphan(event: Stripe.Event, ref: string): Outcome {
  console.warn(`[stripe-webhook] no sale found for ${event.type} (${ref})`);
  notifyAdmin(
    `Stripe event without a matching order (${event.type})`,
    `Event ${event.id} referenced ${ref}, but no ledger order matches it.\n` +
      `If this payment was created outside the website, record it manually in the ledger.`,
  ).catch(() => {});
  return { status: "skipped", note: `no matching sale for ${ref}` };
}
