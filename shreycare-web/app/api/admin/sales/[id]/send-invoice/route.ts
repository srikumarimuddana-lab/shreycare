import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import { generateInvoicePdf } from "@/lib/payments/invoice";
import { sendInvoiceEmail } from "@/lib/payments/emails";
import { logOrderAudit } from "@/lib/payments/audit";
import {
  buildInvoiceData,
  payUrlForToken,
  INVOICE_SALE_COLUMNS,
  type InvoiceSaleRow,
} from "@/lib/payments/invoice-data";
import { isPayableStatus, payLinkExpiryFromNow } from "@/lib/payments/status";

// Email an invoice (PDF attached) to the customer. For unpaid orders the email
// includes a Pay-now link and the pay-link window is refreshed to a fresh 7
// days so the link the customer receives is always valid. Safe to call again
// to re-send.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as { email?: string };

  const { data: sale, error } = await supabaseAdmin
    .from("sales")
    .select(INVOICE_SALE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !sale) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const recipient = (body.email || sale.customer_email || "").trim();
  if (!recipient) {
    return NextResponse.json(
      { error: "No customer email on file. Add one to send the invoice." },
      { status: 400 },
    );
  }

  const now = new Date();
  const unpaid = isPayableStatus(sale.payment_status);

  // Refresh the pay-link window on unpaid orders so the emailed link stays
  // valid for a full 7 days from this send.
  const refreshedExpiry = unpaid ? payLinkExpiryFromNow(now) : sale.pay_link_expires_at;
  const saleForInvoice: InvoiceSaleRow = {
    ...(sale as unknown as InvoiceSaleRow),
    customer_email: recipient,
    pay_link_expires_at: refreshedExpiry,
  };

  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const invoice = buildInvoiceData(saleForInvoice, origin, now);
  const pdf = await generateInvoicePdf(invoice);

  const sent = await sendInvoiceEmail({
    to: recipient,
    customerName: sale.customer_name,
    orderNumber: sale.order_number,
    items: (sale.items ?? []) as { productName: string; quantity: number; unitPrice: number }[],
    subtotal: Number(sale.subtotal ?? 0),
    shippingAmount: Number(sale.shipping_amount ?? 0),
    taxAmount: Number(sale.tax_amount ?? 0),
    total: Number(sale.total ?? 0),
    paymentStatus: sale.payment_status,
    payUrl: unpaid ? payUrlForToken(sale.pay_token, origin) : null,
    payLinkExpiresAt: unpaid ? refreshedExpiry : null,
    pdf,
    resend: (sale.invoice_count ?? 0) > 0,
  });

  if (!sent.ok) {
    return NextResponse.json({ error: sent.error || "Failed to send invoice." }, { status: 502 });
  }

  await supabaseAdmin
    .from("sales")
    .update({
      customer_email: recipient,
      invoice_sent_at: now.toISOString(),
      invoice_count: (sale.invoice_count ?? 0) + 1,
      ...(unpaid ? { pay_link_expires_at: refreshedExpiry } : {}),
    })
    .eq("id", sale.id);

  logOrderAudit({
    saleId: sale.id,
    orderNumber: sale.order_number,
    actor: "admin",
    action: (sale.invoice_count ?? 0) > 0 ? "invoice_resent" : "invoice_sent",
    details: {
      to: recipient,
      with_pay_link: unpaid,
      pay_link_expires_at: unpaid ? refreshedExpiry : null,
    },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    sentTo: recipient,
    withPayLink: unpaid,
    payLinkExpiresAt: unpaid ? refreshedExpiry : null,
  });
}
