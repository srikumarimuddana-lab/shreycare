import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import { applyRefundToSale, type SaleRow } from "@/lib/payments/fulfil";
import { logOrderAudit } from "@/lib/payments/audit";

// Issue a full or partial refund through Stripe. The ledger is updated
// immediately for a responsive UI, and the charge.refunded webhook converges
// on the same state (both write the cumulative refunded amount).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as { amount?: number };

  const { data: sale, error } = await supabaseAdmin
    .from("sales")
    .select(
      "id, order_number, customer_name, customer_email, items, subtotal, shipping_amount, tax_amount, total, payment_method, payment_status, amount_refunded, stripe_session_id, stripe_payment_intent_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !sale) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (sale.payment_method !== "stripe" || !sale.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: "This order was not paid through Stripe. Update its payment status manually instead." },
      { status: 409 },
    );
  }
  if (!["paid", "partially_refunded"].includes(sale.payment_status)) {
    return NextResponse.json(
      { error: `Order is ${sale.payment_status} — only paid orders can be refunded.` },
      { status: 409 },
    );
  }

  const totalCents = Math.round(Number(sale.total) * 100);
  const refundedCents = Math.round(Number(sale.amount_refunded ?? 0) * 100);
  const remainingCents = totalCents - refundedCents;

  const requestedCents =
    body.amount !== undefined
      ? Math.round(Number(body.amount) * 100)
      : remainingCents;

  if (!Number.isFinite(requestedCents) || requestedCents <= 0) {
    return NextResponse.json({ error: "Refund amount must be greater than zero." }, { status: 400 });
  }
  if (requestedCents > remainingCents) {
    return NextResponse.json(
      { error: `Refund exceeds the remaining refundable amount ($${(remainingCents / 100).toFixed(2)}).` },
      { status: 400 },
    );
  }

  try {
    const refund = await (await getStripe()).refunds.create(
      {
        payment_intent: sale.stripe_payment_intent_id,
        amount: requestedCents,
        metadata: { sale_id: sale.id, order_number: sale.order_number },
      },
      {
        // Keyed on the pre-refund state so a double-submitted identical
        // request maps to the same Stripe refund instead of a second one.
        idempotencyKey: `refund:${sale.id}:${refundedCents}:${requestedCents}`,
      },
    );

    await applyRefundToSale(
      sale as unknown as SaleRow,
      refundedCents + requestedCents,
      `admin:${refund.id}`,
    );
    await logOrderAudit({
      saleId: sale.id,
      orderNumber: sale.order_number,
      actor: "admin",
      action: "refund_issued",
      details: {
        refund_id: refund.id,
        amount: requestedCents / 100,
        remaining_after: (remainingCents - requestedCents) / 100,
      },
    });

    return NextResponse.json({
      ok: true,
      refundId: refund.id,
      amountRefunded: (refundedCents + requestedCents) / 100,
      paymentStatus:
        refundedCents + requestedCents >= totalCents
          ? "refunded"
          : "partially_refunded",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe refund failed.";
    console.error("[refund] failed:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
