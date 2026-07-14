import { Resend } from "resend";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "contact@shreycare.com";
const FROM_EMAIL =
  process.env.EMAIL_FROM || "ShreyCare Organics <no-reply@shreycare.com>";
const CURRENCY = process.env.NEXT_PUBLIC_STORE_CURRENCY || "CAD";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface ReceiptOptions {
  to: string;
  customerName: string;
  orderNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
}

// Payment confirmation sent to the customer once Stripe reports the charge
// captured. Fire-and-forget: callers must not fail an order on email errors.
export async function sendPaymentReceipt(opts: ReceiptOptions): Promise<void> {
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

  const text = `Hi ${opts.customerName},

Your payment for order ${opts.orderNumber} has been received — thank you!

Items:
${itemsText}

Subtotal: ${CURRENCY} ${opts.subtotal.toFixed(2)}
Shipping: ${opts.shippingAmount > 0 ? `${CURRENCY} ${opts.shippingAmount.toFixed(2)}` : "FREE"}${opts.taxAmount > 0 ? `\nTax: ${CURRENCY} ${opts.taxAmount.toFixed(2)}` : ""}
Total paid: ${CURRENCY} ${opts.total.toFixed(2)}
Payment method: ${opts.paymentMethod}

We'll ship your order shortly and send a shipping update.

This is an automated message from a no-reply address. For any questions about your order, please email us at ${SUPPORT_EMAIL}.

— ShreyCare Organics
`;

  const html = `
<div style="font-family:Arial,sans-serif;color:#1c1c19;max-width:640px;margin:0 auto;">
  <h2 style="color:#384527;">Payment received — thank you, ${escapeHtml(opts.customerName)}!</h2>
  <p style="color:#1b5e20;font-weight:bold;">Your payment for order ${escapeHtml(opts.orderNumber)} is confirmed.</p>

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
      <tr>
        <td colspan="2" style="padding:8px;text-align:right;color:#45483f;">Shipping</td>
        <td style="padding:8px;text-align:right;color:#45483f;">${opts.shippingAmount > 0 ? `${CURRENCY} ${opts.shippingAmount.toFixed(2)}` : "FREE"}</td>
      </tr>
      ${opts.taxAmount > 0 ? `<tr>
        <td colspan="2" style="padding:8px;text-align:right;color:#45483f;">Tax</td>
        <td style="padding:8px;text-align:right;color:#45483f;">${CURRENCY} ${opts.taxAmount.toFixed(2)}</td>
      </tr>` : ""}
      <tr>
        <td colspan="2" style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">Total paid</td>
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

  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: [opts.to],
    replyTo: SUPPORT_EMAIL,
    subject: `Payment received for ${opts.orderNumber} — ShreyCare Organics`,
    text,
    html,
  });
  if (result.error) {
    console.error("[payments] receipt email failed:", result.error);
  }
}

// Short plain-text heads-up to the store owner for payment lifecycle events
// that need a human (payment received, refund, dispute, failure).
export async function notifyAdmin(subject: string, body: string): Promise<void> {
  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: [SUPPORT_EMAIL],
    subject,
    text: body,
  });
  if (result.error) {
    console.error("[payments] admin notification failed:", result.error);
  }
}
