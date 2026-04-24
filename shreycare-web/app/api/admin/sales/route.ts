import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

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

Total: ${CURRENCY} ${opts.subtotal.toFixed(2)}

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
        <td colspan="2" style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">Total</td>
        <td style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">${CURRENCY} ${opts.subtotal.toFixed(2)}</td>
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
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = supabaseAdmin
    .from("sales")
    .select("*")
    .order("sale_date", { ascending: false })
    .limit(500);

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("payment_status", status);
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
  const { data, error } = await supabaseAdmin
    .from("sales")
    .insert({
      order_number: body.orderNumber,
      type: body.type || "offline",
      sale_date: body.date || new Date().toISOString(),
      customer_name: body.customerName,
      customer_email: body.customerEmail || null,
      customer_phone: body.customerPhone || null,
      items: body.items || [],
      subtotal: body.subtotal || 0,
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

  // Fire-and-forget email receipt when an email is provided.
  if (body.customerEmail && data) {
    sendReceipt({
      to: body.customerEmail,
      customerName: body.customerName,
      orderNumber: data.order_number,
      saleDate: data.sale_date,
      items: (body.items as SaleItem[]) || [],
      subtotal: Number(data.subtotal),
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

  const updates: Record<string, unknown> = {};
  if (body.paymentStatus) updates.payment_status = body.paymentStatus;
  if (body.fulfillment) updates.fulfillment = body.fulfillment;
  if (body.paymentMethod) updates.payment_method = body.paymentMethod;
  if (body.notes !== undefined) updates.notes = body.notes;

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
  return NextResponse.json(data);
}
