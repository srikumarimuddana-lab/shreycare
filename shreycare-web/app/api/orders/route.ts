import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { decrementStockForSale } from "@/lib/inventory/decrement-stock";
import { priceOrder } from "@/lib/payments/pricing";
import { generateUniqueOrderNumber } from "@/lib/payments/order-number";
import { logOrderAudit } from "@/lib/payments/audit";
import {
  validateOrderPayload,
  toShippingAddress,
  type OrderPayload,
} from "@/lib/payments/types";

const resend = new Resend(process.env.RESEND_API_KEY);

// One human-monitored mailbox. Used as:
//   - recipient of new-order notifications
//   - Reply-To on the customer confirmation (so a reply lands here)
//   - contact address surfaced on the site
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "contact@shreycare.com";
// Outbound sender — no-reply mailbox, must be on a Resend-verified domain.
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderPayload;
    const invalid = validateOrderPayload(body);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }
    const { customer, items } = body;

    // Server-side pricing shared with the Stripe checkout flow — item prices
    // come from Sanity, shipping and tax are computed here, so client-side
    // tampering can never change what an order is worth.
    const priced = await priceOrder(items, {
      city: customer.city,
      state: customer.state,
    });
    const validatedItems = priced.items;
    const { subtotal, shipping, isLocalDelivery, total } = priced;
    const tax = { rate: priced.taxRate, amount: priced.taxAmount };

    const orderNumber = await generateUniqueOrderNumber();
    const placedAt = new Date().toISOString();

    const itemsTextLines = validatedItems.map(
      (i) =>
        `  - ${i.name} (x${i.quantity}) @ ${CURRENCY} ${i.price.toFixed(2)} = ${CURRENCY} ${(
          i.price * i.quantity
        ).toFixed(2)}${i.inStock ? "" : "  [OUT OF STOCK]"}`,
    );
    const itemsTextBlock = itemsTextLines.join("\n");

    const itemsHtmlRows = validatedItems
      .map(
        (i) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e2dd;">
            ${escapeHtml(i.name)}${i.inStock ? "" : ' <span style="color:#ba1a1a;font-size:11px;">(OUT OF STOCK)</span>'}
          </td>
          <td style="padding:8px;border-bottom:1px solid #e5e2dd;text-align:center;">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e2dd;text-align:right;">${CURRENCY} ${i.price.toFixed(2)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e2dd;text-align:right;">${CURRENCY} ${(i.price * i.quantity).toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    const shippingBlock = `${customer.addressLine1}${
      customer.addressLine2 ? "\n" + customer.addressLine2 : ""
    }\n${customer.city}, ${customer.state} ${customer.postalCode}\n${customer.country}`;

    // --- Email to admin ---
    const adminSubject = `New order ${orderNumber} — ${customer.name} — ${CURRENCY} ${total.toFixed(2)}`;
    const adminText = `New order placed on ShreyCare Organics.

Order: ${orderNumber}
Placed: ${placedAt}

Customer:
  Name:  ${customer.name}
  Email: ${customer.email}
  Phone: ${customer.phone}

Shipping address:
${shippingBlock}

${customer.notes ? `Notes from customer:\n${customer.notes}\n\n` : ""}Items:
${itemsTextBlock}

Subtotal: ${CURRENCY} ${subtotal.toFixed(2)}
Shipping: ${shipping === 0 ? `FREE${isLocalDelivery ? " (local delivery — Regina)" : ""}` : `${CURRENCY} ${shipping.toFixed(2)}`}${tax.amount > 0 ? `\nPST (6%): ${CURRENCY} ${tax.amount.toFixed(2)}` : ""}
Total: ${CURRENCY} ${total.toFixed(2)}

Reply to ${customer.email} with payment instructions to complete the order.
`;

    const adminHtml = `
<div style="font-family:Arial,sans-serif;color:#1c1c19;max-width:640px;margin:0 auto;">
  <h2 style="color:#384527;margin:0 0 8px;">New order ${escapeHtml(orderNumber)}</h2>
  <p style="color:#45483f;margin:0 0 24px;font-size:13px;">Placed ${escapeHtml(placedAt)}</p>

  <h3 style="color:#384527;margin:24px 0 8px;">Customer</h3>
  <table style="width:100%;font-size:14px;">
    <tr><td style="padding:4px 0;width:80px;color:#45483f;">Name</td><td>${escapeHtml(customer.name)}</td></tr>
    <tr><td style="padding:4px 0;color:#45483f;">Email</td><td><a href="mailto:${escapeHtml(customer.email)}">${escapeHtml(customer.email)}</a></td></tr>
    <tr><td style="padding:4px 0;color:#45483f;">Phone</td><td>${escapeHtml(customer.phone)}</td></tr>
  </table>

  <h3 style="color:#384527;margin:24px 0 8px;">Shipping address</h3>
  <pre style="font-family:Arial,sans-serif;background:#f6f3ee;padding:12px;border-radius:6px;white-space:pre-wrap;">${escapeHtml(shippingBlock)}</pre>

  ${customer.notes ? `<h3 style="color:#384527;margin:24px 0 8px;">Notes from customer</h3><pre style="font-family:Arial,sans-serif;background:#f6f3ee;padding:12px;border-radius:6px;white-space:pre-wrap;">${escapeHtml(customer.notes)}</pre>` : ""}

  <h3 style="color:#384527;margin:24px 0 8px;">Items</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#f0ede8;">
        <th style="padding:8px;text-align:left;">Product</th>
        <th style="padding:8px;text-align:center;">Qty</th>
        <th style="padding:8px;text-align:right;">Price</th>
        <th style="padding:8px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtmlRows}
      <tr>
        <td colspan="3" style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">Total</td>
        <td style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">${CURRENCY} ${total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top:24px;color:#45483f;font-size:13px;">
    Reply to <a href="mailto:${escapeHtml(customer.email)}">${escapeHtml(customer.email)}</a> with payment instructions to complete this order.
  </p>
</div>`;

    // --- Confirmation email to customer ---
    const customerSubject = `We received your order ${orderNumber} — ShreyCare Organics`;
    const customerText = `Hi ${customer.name},

Thank you for your order with ShreyCare Organics.

Order reference: ${orderNumber}
Placed: ${placedAt}

Items:
${itemsTextBlock}

Total: ${CURRENCY} ${total.toFixed(2)}

Our team will contact you shortly with payment instructions. Once we confirm payment, we'll ship your order and send a shipping update.

This is an automated message from a no-reply address. For any questions about your order, please email us at ${SUPPORT_EMAIL}.

— ShreyCare Organics
`;

    const customerHtml = `
<div style="font-family:Arial,sans-serif;color:#1c1c19;max-width:640px;margin:0 auto;">
  <h2 style="color:#384527;">Thank you for your order, ${escapeHtml(customer.name)}</h2>
  <p>We've received your order and our team will email you payment instructions shortly.</p>
  <p style="color:#45483f;font-size:14px;">Order reference: <strong>${escapeHtml(orderNumber)}</strong></p>

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
      ${validatedItems
        .map(
          (i) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #e5e2dd;">${escapeHtml(i.name)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e2dd;text-align:center;">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e2dd;text-align:right;">${CURRENCY} ${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`,
        )
        .join("")}
      <tr>
        <td colspan="2" style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">Total</td>
        <td style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">${CURRENCY} ${total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top:24px;color:#45483f;font-size:12px;">
    This is an automated message from a no-reply address. For questions
    about your order, please email
    <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}">${escapeHtml(SUPPORT_EMAIL)}</a>.
  </p>
  <p style="margin-top:16px;">Rooted in nature, crafted with care.<br/>— The ShreyCare Organics team</p>
</div>`;

    // Send admin first (most important). If it fails, log the real Resend
    // error server-side but return a generic message to the client so we
    // never leak provider internals (verified-domain errors, API keys in
    // messages, etc.) to the customer.
    const adminResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [SUPPORT_EMAIL],
      replyTo: customer.email,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
    });
    if (adminResult.error) {
      console.error("[orders] Resend admin email failed:", adminResult.error);
      return NextResponse.json(
        {
          error:
            "We couldn't submit your order right now. Please try again in a moment or email us directly.",
        },
        { status: 502 },
      );
    }

    await resend.emails
      .send({
        from: FROM_EMAIL,
        to: [customer.email],
        // If the customer hits Reply on the confirmation, route it to
        // support rather than the unmonitored no-reply mailbox.
        replyTo: SUPPORT_EMAIL,
        subject: customerSubject,
        text: customerText,
        html: customerHtml,
      })
      .catch((err) => {
        console.error("[orders] Resend customer confirmation failed:", err);
      });

    // Auto-log to Supabase ledger so the admin dashboard shows it.
    const saleItems = validatedItems.map((i) => ({
      productName: i.name,
      quantity: i.quantity,
      unitPrice: i.price,
    }));
    const { data: saleRow, error: dbErr } = await supabaseAdmin
      .from("sales")
      .insert({
        order_number: orderNumber,
        type: "online",
        sale_date: placedAt,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        shipping_address: toShippingAddress(customer),
        items: saleItems,
        subtotal,
        shipping_amount: shipping,
        tax_rate: tax.rate,
        tax_amount: tax.amount,
        total,
        payment_method: "interac",
        payment_status: "pending",
        fulfillment: "pending",
        notes: customer.notes || null,
      })
      .select("id")
      .single();

    if (dbErr) {
      console.error("[orders] Supabase insert failed:", dbErr);
    } else if (saleRow?.id) {
      decrementStockForSale(saleRow.id, saleItems).catch((err) => {
        console.error("[orders] decrementStockForSale failed:", err);
      });
      logOrderAudit({
        saleId: saleRow.id,
        orderNumber,
        actor: "customer",
        action: "order_created",
        details: { channel: "etransfer_checkout", total },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, orderNumber });
  } catch (error) {
    console.error("[orders] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to place order. Please try again." },
      { status: 500 },
    );
  }
}
