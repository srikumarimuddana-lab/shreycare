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

export interface InvoiceEmailOptions {
  to: string;
  customerName: string;
  orderNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  paymentStatus: string;
  payUrl?: string | null;
  payLinkExpiresAt?: string | null;
  pdf: Uint8Array;
  resend?: boolean;
}

// Invoice email with the PDF attached and, for unpaid orders, a prominent
// "Pay now" button linking to the /pay/<token> page (which lives for the
// pay-link window and mints a fresh Stripe Checkout session on click).
export async function sendInvoiceEmail(opts: InvoiceEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const unpaid = opts.paymentStatus !== "paid" && Boolean(opts.payUrl);

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
    .map((i) => `  - ${i.productName} (x${i.quantity}) = ${CURRENCY} ${(i.unitPrice * i.quantity).toFixed(2)}`)
    .join("\n");

  const expiryNote = opts.payLinkExpiresAt
    ? `This payment link expires on ${new Date(opts.payLinkExpiresAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}.`
    : "";

  const payBlockHtml = unpaid
    ? `<div style="margin:24px 0;padding:20px;background:#f2f5ed;border:1px solid #384527;border-radius:8px;text-align:center;">
        <p style="margin:0 0 12px;color:#384527;font-weight:bold;">Pay securely by card</p>
        <a href="${opts.payUrl}" style="display:inline-block;background:#384527;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;">Pay ${CURRENCY} ${opts.total.toFixed(2)} now</a>
        <p style="margin:12px 0 0;font-size:12px;color:#45483f;">Or open this link: <a href="${opts.payUrl}" style="color:#2f6bb5;">${escapeHtml(opts.payUrl!)}</a></p>
        ${expiryNote ? `<p style="margin:8px 0 0;font-size:11px;color:#75716b;">${expiryNote}</p>` : ""}
      </div>`
    : `<p style="color:#1b5e20;font-weight:bold;margin:16px 0;">This invoice has been paid — thank you!</p>`;

  const payBlockText = unpaid
    ? `\nPay securely by card: ${opts.payUrl}\n${expiryNote}\n`
    : `\nThis invoice has been paid — thank you!\n`;

  const subject = opts.resend
    ? `Invoice ${opts.orderNumber} (resent) — ShreyCare Organics`
    : `Invoice ${opts.orderNumber} — ShreyCare Organics`;

  const text = `Hi ${opts.customerName},

Please find attached your invoice ${opts.orderNumber} from ShreyCare Organics.

Items:
${itemsText}

Subtotal: ${CURRENCY} ${opts.subtotal.toFixed(2)}
Shipping: ${opts.shippingAmount > 0 ? `${CURRENCY} ${opts.shippingAmount.toFixed(2)}` : "FREE"}${opts.taxAmount > 0 ? `\nTax: ${CURRENCY} ${opts.taxAmount.toFixed(2)}` : ""}
Total: ${CURRENCY} ${opts.total.toFixed(2)}
${payBlockText}
A PDF copy of this invoice is attached.

For any questions, email us at ${SUPPORT_EMAIL}.

— ShreyCare Organics
`;

  const html = `
<div style="font-family:Arial,sans-serif;color:#1c1c19;max-width:640px;margin:0 auto;">
  <h2 style="color:#384527;">Invoice ${escapeHtml(opts.orderNumber)}</h2>
  <p>Hi ${escapeHtml(opts.customerName)}, here is your invoice from ShreyCare Organics. A PDF copy is attached.</p>

  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">
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
        <td colspan="2" style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">Total</td>
        <td style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #384527;">${CURRENCY} ${opts.total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  ${payBlockHtml}

  <p style="margin-top:24px;color:#45483f;font-size:12px;">
    For questions about this invoice, email
    <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}">${escapeHtml(SUPPORT_EMAIL)}</a>.
  </p>
  <p style="margin-top:16px;">Rooted in nature, crafted with care.<br/>— The ShreyCare Organics team</p>
</div>`;

  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: [opts.to],
    replyTo: SUPPORT_EMAIL,
    subject,
    text,
    html,
    attachments: [
      {
        filename: `invoice-${opts.orderNumber}.pdf`,
        content: Buffer.from(opts.pdf),
      },
    ],
  });
  if (result.error) {
    console.error("[payments] invoice email failed:", result.error);
    return { ok: false, error: "Failed to send invoice email." };
  }
  return { ok: true };
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
