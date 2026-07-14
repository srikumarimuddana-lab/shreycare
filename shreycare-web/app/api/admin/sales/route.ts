import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { decrementStockForSale } from "@/lib/inventory/decrement-stock";
import { logOrderAudit } from "@/lib/payments/audit";
import {
  isFinanciallyLocked,
  lockedFieldsInUpdate,
  MANUAL_PAYMENT_STATUSES,
  type PaymentStatus,
} from "@/lib/payments/status";

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const resend = new Resend(process.env.RESEND_API_KEY);
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "contact@shreycare.com";
const FROM_EMAIL =
  process.env.EMAIL_FROM ||
  "ShreyCare Organics <no-reply@shreycare.com>";
const CURRENCY = process.env.NEXT_PUBLIC_STORE_CURRENCY || "CAD";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

async function sendReceipt(opts: {
  to: string;
  customerName: string;
  orderNumber: string;
  saleDate: string;
  items: SaleItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}) {
  const paidLine =
    opts.paymentStatus === "paid"
      ? `<p style="color:#1b5e20;font-weight:bold;">Payment received — thank you!</p>`
      : `<p style="color:#a1680f;">Payment status: ${escapeHtml(opts.paymentStatus)}</p>`;

  const itemsRows = opts.items
    .map(
      (i) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #e5e2dd;">${escapeHtml(i.productName)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e2dd;text-align:center;">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e2dd;text-align:right;">${CURRENCY} ${(i.unitPrice * i.quantity).toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const itemsText = opts.items
    .map(
      (i) =>
        `  - ${i.productName} (x${i.quantity}) = ${CURRENCY} ${(i.unitPrice * i.quantity).toFixed(2)}`,
    )
    .join("\n");

  const subject = `Receipt ${opts.orderNumber} — ShreyCare Organics`;

  const text = `Hi ${opts.customerName},

Thank you for shopping with ShreyCare Organics.

Order reference: ${opts.orderNumber}
Date: ${new Date(opts.saleDate).toLocaleString("en-CA")}
Payment: ${opts.paymentMethod} (${opts.paymentStatus})

Items:
${itemsText}

Subtotal: ${CURRENCY} ${opts.subtotal.toFixed(2)}${opts.taxAmount > 0 ? `\nTax: ${CURRENCY} ${opts.taxAmount.toFixed(2)}` : ""}
Total: ${CURRENCY} ${opts.total.toFixed(2)}

This is an automated message from a no-reply address. For any questions about your order, please email us at ${SUPPORT_EMAIL}.

— ShreyCare Organics
`;

  const html = `
<div style="font-family:Arial,sans-serif;color:#1c1c19;max-width:640px;margin:0 auto;">
  <h2 style="color:#384527;">Thank you for your purchase, ${escapeHtml(opts.customerName)}</h2>
  ${paidLine}
  <p style="color:#45483f;font-size:14px;">
    Order reference: <strong>${escapeHtml(opts.orderNumber)}</strong><br/>
    Date: ${escapeHtml(new Date(opts.saleDate).toLocaleString("en-CA"))}<br/>
    Payment: ${escapeHtml(opts.paymentMethod)}
  </p>

  <h3 style="color:#384527;margin:24px 0 8px;">Items</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#f0ede8;">
        <th style="padding:8px;text-align:left;">Product</th>
        <th style="padding:8px;text-align:center;">Qty</th>
        <th style="padding:8px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
      <tr>
        <td colspan="2" style="padding:8px;text-align:right;color:#45483f;border-top:1px solid #e5e2dd;">Subtotal</td>
        <td style="padding:8px;text-align:right;color:#45483f;border-top:1px solid #e5e2dd;">${CURRENCY} ${opts.subtotal.toFixed(2)}</td>
      </tr>
      ${opts.taxAmount > 0 ? `<tr>
        <td colspan="2" style="padding:8px;text-align:right;color:#45483f;">Tax</td>
        <td style="padding:8px;text-align:right;color:#45483f;">${CURRENCY} ${opts.taxAmount.toFixed(2)}</td>
      </tr>` : ""}
      <tr>
        <td colspan="2" style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">Total</td>
        <td style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">${CURRENCY} ${opts.total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top:24px;color:#45483f;font-size:12px;">
    This is an automated message from a no-reply address. For questions about your order, please email
    <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}">${escapeHtml(SUPPORT_EMAIL)}</a>.
  </p>
  <p style="margin-top:16px;">Rooted in nature, crafted with care.<br/>— The ShreyCare Organics team</p>
</div>`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [opts.to],
    replyTo: SUPPORT_EMAIL,
    subject,
    text,
    html,
  });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function authorized(req: NextRequest): boolean {
  if (!ADMIN_SECRET) return false;
  const header = req.headers.get("x-admin-secret");
  if (header === ADMIN_SECRET) return true;
  const cookie = req.cookies.get("admin_secret")?.value;
  return cookie === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return unauthorized();

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const method = url.searchParams.get("method");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = supabaseAdmin
    .from("sales")
    .select("*")
    .order("sale_date", { ascending: false })
    .limit(500);

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("payment_status", status);
  if (method) query = query.eq("payment_method", method);
  if (from) query = query.gte("sale_date", from);
  if (to) query = query.lte("sale_date", `${to}T23:59:59Z`);

  const { data, error } = await query;
  if (error) {
    console.error("[admin/sales] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return unauthorized();

  const body = await req.json();
  const subtotal = Number(body.subtotal) || 0;
  const taxRate = Number(body.taxRate) || 0;
  const taxAmount = +(Number(body.taxAmount) || 0).toFixed(2);
  const total = +(subtotal + taxAmount).toFixed(2);

  const { data, error } = await supabaseAdmin
    .from("sales")
    .insert({
      order_number: body.orderNumber,
      type: body.type || "offline",
      sale_date: body.date || new Date().toISOString(),
      customer_name: body.customerName,
      customer_email: body.customerEmail || null,
      customer_phone: body.customerPhone || null,
      shipping_address: body.shippingAddress || null,
      items: body.items || [],
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      payment_method: body.paymentMethod || "cash",
      payment_status: body.paymentStatus || "pending",
      fulfillment: body.fulfillment || "pending",
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/sales] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget stock decrement for each item in the sale.
  if (data?.id) {
    decrementStockForSale(data.id, (body.items as SaleItem[]) || []).catch((err) => {
      console.error("[admin/sales] decrementStockForSale failed:", err);
    });
    logOrderAudit({
      saleId: data.id,
      orderNumber: data.order_number,
      actor: "admin",
      action: "order_created",
      details: { channel: "manual_entry", total: Number(data.total) },
    }).catch(() => {});
  }

  // Fire-and-forget email receipt when an email is provided. Skip it for
  // unpaid Stripe orders — those get an invoice with a Pay-now link instead
  // (sent separately by the caller), and a "receipt" would be misleading.
  const isPendingStripe =
    (body.paymentMethod || "cash") === "stripe" &&
    (body.paymentStatus || "pending") !== "paid";
  if (body.customerEmail && data && !isPendingStripe) {
    sendReceipt({
      to: body.customerEmail,
      customerName: body.customerName,
      orderNumber: data.order_number,
      saleDate: data.sale_date,
      items: (body.items as SaleItem[]) || [],
      subtotal: Number(data.subtotal),
      taxAmount: Number(data.tax_amount),
      total: Number(data.total),
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
    }).catch((err) => {
      console.error("[admin/sales] Receipt email failed:", err);
    });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return unauthorized();

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("sales")
    .select("*")
    .eq("id", body.id)
    .maybeSingle();
  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Orders whose money actually moved through Stripe mirror the processor:
  // their financial fields can't be hand-edited. Refunds go through the
  // refund endpoint; contact info, address, fulfillment and notes stay open.
  if (isFinanciallyLocked(existing)) {
    const locked = lockedFieldsInUpdate(body);
    if (locked.length > 0) {
      return NextResponse.json(
        {
          error:
            "This order was paid through Stripe, so its amounts and payment status mirror the actual charge. Use Refund to adjust it.",
          lockedFields: locked,
        },
        { status: 409 },
      );
    }
  }

  // Admins can only set the manual statuses; Stripe-driven states (failed,
  // expired, disputed, partially_refunded) come exclusively from webhooks.
  if (
    body.paymentStatus &&
    !MANUAL_PAYMENT_STATUSES.includes(body.paymentStatus as PaymentStatus)
  ) {
    return NextResponse.json(
      { error: `Payment status "${body.paymentStatus}" can only be set by Stripe.` },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.paymentStatus) updates.payment_status = body.paymentStatus;
  if (body.fulfillment) updates.fulfillment = body.fulfillment;
  if (body.paymentMethod) updates.payment_method = body.paymentMethod;
  if (body.customerName) updates.customer_name = body.customerName;
  if (body.customerEmail !== undefined) updates.customer_email = body.customerEmail || null;
  if (body.customerPhone !== undefined) updates.customer_phone = body.customerPhone || null;
  if (body.shippingAddress !== undefined) updates.shipping_address = body.shippingAddress || null;
  if (body.items) updates.items = body.items;
  if (body.subtotal !== undefined) updates.subtotal = body.subtotal;
  if (body.taxRate !== undefined) updates.tax_rate = body.taxRate;
  if (body.taxAmount !== undefined) updates.tax_amount = +(Number(body.taxAmount) || 0).toFixed(2);
  if (body.notes !== undefined) updates.notes = body.notes;

  // Whenever subtotal or tax_amount changes, recompute total (keeping any
  // shipping charge) so the ledger aggregations stay consistent.
  if (body.subtotal !== undefined || body.taxAmount !== undefined) {
    const newSubtotal = body.subtotal !== undefined
      ? Number(body.subtotal) || 0
      : Number(existing.subtotal) || 0;
    const newTax = body.taxAmount !== undefined
      ? Number(body.taxAmount) || 0
      : Number(existing.tax_amount) || 0;
    const shipping = Number(existing.shipping_amount) || 0;
    updates.total = +(newSubtotal + shipping + newTax).toFixed(2);
  }

  const { data, error } = await supabaseAdmin
    .from("sales")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("[admin/sales] PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit only what actually changed, with before/after values.
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(updates)) {
    const before = existing[key as keyof typeof existing];
    const after = updates[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes[key] = { from: before, to: after };
    }
  }
  if (Object.keys(changes).length > 0) {
    logOrderAudit({
      saleId: existing.id,
      orderNumber: existing.order_number,
      actor: "admin",
      action: "order_updated",
      details: { changes },
    }).catch(() => {});
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return unauthorized();

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("sales")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Never delete the record of a real Stripe charge — refund it instead so
  // the ledger keeps matching the processor.
  if (isFinanciallyLocked(existing)) {
    return NextResponse.json(
      { error: "This order has a Stripe charge attached. Refund it instead of deleting, so the ledger matches Stripe." },
      { status: 409 },
    );
  }

  const { error } = await supabaseAdmin
    .from("sales")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[admin/sales] DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logOrderAudit({
    saleId: existing.id,
    orderNumber: existing.order_number,
    actor: "admin",
    action: "order_deleted",
    details: {
      snapshot: {
        customer_name: existing.customer_name,
        total: Number(existing.total),
        payment_method: existing.payment_method,
        payment_status: existing.payment_status,
      },
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
