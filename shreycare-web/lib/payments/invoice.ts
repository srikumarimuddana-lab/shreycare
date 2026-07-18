import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const CURRENCY = process.env.NEXT_PUBLIC_STORE_CURRENCY || "CAD";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "contact@shreycare.com";

// Brand ink, matching the botanical green used across the site.
const GREEN = rgb(0.22, 0.27, 0.15);
const INK = rgb(0.11, 0.11, 0.1);
const MUTED = rgb(0.46, 0.44, 0.42);
const LINE = rgb(0.9, 0.89, 0.87);

export interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceShippingAddress {
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface InvoiceData {
  orderNumber: string;
  saleDate: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: InvoiceShippingAddress | null;
  items: InvoiceItem[];
  subtotal: number;
  shippingAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountRefunded?: number;
  paymentMethod: string;
  paymentStatus: string;
  payUrl?: string | null;
  payLinkExpiresAt?: string | null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: "Card (Stripe)",
  interac: "Interac e-Transfer",
  cash: "Cash",
  other: "Other",
};

function money(n: number): string {
  return `${CURRENCY} ${n.toFixed(2)}`;
}

function addressLines(a?: InvoiceShippingAddress | null): string[] {
  if (!a) return [];
  const lines: string[] = [];
  if (a.line1) lines.push(a.line1);
  if (a.line2) lines.push(a.line2);
  const cityState = [a.city, a.state].filter(Boolean).join(", ");
  const cityLine = [cityState, a.postalCode].filter(Boolean).join(" ").trim();
  if (cityLine) lines.push(cityLine);
  if (a.country) lines.push(a.country);
  return lines;
}

// Generate a branded, printable invoice PDF for an order. Pure pdf-lib
// (standard Helvetica, no external font/file access) so it runs anywhere the
// route does — no chromium, no fs.
export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Invoice ${data.orderNumber}`);
  doc.setAuthor("ShreyCare Organics");
  doc.setSubject(`Invoice for order ${data.orderNumber}`);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const M = 50;
  let y = height - M;

  const text = (
    s: string,
    x: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: typeof INK } = {},
  ) => {
    page.drawText(s, {
      x,
      y: yy,
      size: opts.size ?? 10,
      font: opts.font ?? font,
      color: opts.color ?? INK,
    });
  };

  const rightText = (
    s: string,
    xRight: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: typeof INK } = {},
  ) => {
    const f = opts.font ?? font;
    const size = opts.size ?? 10;
    const w = f.widthOfTextAtSize(s, size);
    text(s, xRight - w, yy, opts);
  };

  // ── Header ──
  text("ShreyCare Organics", M, y, { font: bold, size: 20, color: GREEN });
  rightText("INVOICE", width - M, y, { font: bold, size: 20, color: GREEN });
  y -= 18;
  text("Rooted in nature, crafted with care.", M, y, { size: 9, color: MUTED });
  rightText(`# ${data.orderNumber}`, width - M, y, { size: 10, color: INK });
  y -= 12;
  rightText(
    new Date(data.saleDate).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    width - M,
    y,
    { size: 9, color: MUTED },
  );

  y -= 28;
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 1, color: LINE });
  y -= 26;

  // ── Bill to + payment meta (two columns) ──
  const colR = width / 2 + 10;
  const topY = y;
  text("BILL TO", M, y, { font: bold, size: 8, color: MUTED });
  y -= 14;
  text(data.customerName, M, y, { font: bold, size: 11 });
  y -= 13;
  for (const line of [
    data.customerEmail || null,
    data.customerPhone || null,
    ...addressLines(data.shippingAddress),
  ].filter(Boolean) as string[]) {
    text(line, M, y, { size: 9, color: MUTED });
    y -= 12;
  }

  // right column: payment details
  let ry = topY;
  text("PAYMENT", colR, ry, { font: bold, size: 8, color: MUTED });
  ry -= 14;
  text(`Method: ${PAYMENT_METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod}`, colR, ry, { size: 9 });
  ry -= 12;
  text(`Status: ${data.paymentStatus.replace(/_/g, " ")}`, colR, ry, {
    size: 9,
    color: data.paymentStatus === "paid" ? GREEN : INK,
  });
  if (data.amountRefunded && data.amountRefunded > 0) {
    ry -= 12;
    text(`Refunded: ${money(data.amountRefunded)}`, colR, ry, { size: 9, color: MUTED });
  }

  y = Math.min(y, ry) - 24;

  // ── Items table ──
  const cQty = width - M - 210;
  const cPrice = width - M - 110;
  const cTotal = width - M;

  page.drawRectangle({
    x: M,
    y: y - 4,
    width: width - 2 * M,
    height: 20,
    color: rgb(0.94, 0.93, 0.91),
  });
  text("DESCRIPTION", M + 8, y + 2, { font: bold, size: 8, color: MUTED });
  rightText("QTY", cQty + 20, y + 2, { font: bold, size: 8, color: MUTED });
  rightText("PRICE", cPrice, y + 2, { font: bold, size: 8, color: MUTED });
  rightText("AMOUNT", cTotal, y + 2, { font: bold, size: 8, color: MUTED });
  y -= 22;

  const ensureSpace = (): PDFPage => page; // single page is enough for typical orders
  ensureSpace();

  for (const item of data.items) {
    text(item.productName, M + 8, y, { size: 10 });
    rightText(String(item.quantity), cQty + 20, y, { size: 10 });
    rightText(money(item.unitPrice), cPrice, y, { size: 10 });
    rightText(money(item.unitPrice * item.quantity), cTotal, y, { size: 10 });
    y -= 16;
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: width - M, y: y + 4 }, thickness: 0.5, color: LINE });
    y -= 4;
  }

  // ── Totals ──
  y -= 8;
  const labelX = cPrice;
  const totalsRow = (label: string, value: string, opts: { bold?: boolean } = {}) => {
    rightText(label, labelX, y, {
      size: opts.bold ? 11 : 10,
      font: opts.bold ? bold : font,
      color: opts.bold ? INK : MUTED,
    });
    rightText(value, cTotal, y, {
      size: opts.bold ? 11 : 10,
      font: opts.bold ? bold : font,
      color: opts.bold ? GREEN : INK,
    });
    y -= 16;
  };

  totalsRow("Subtotal", money(data.subtotal));
  totalsRow("Shipping", data.shippingAmount > 0 ? money(data.shippingAmount) : "FREE");
  if (data.taxAmount > 0) {
    const pct = data.taxRate > 0 ? ` (${(data.taxRate * 100).toFixed(0)}%)` : "";
    totalsRow(`PST${pct}`, money(data.taxAmount));
  }
  y -= 2;
  page.drawLine({ start: { x: labelX - 100, y: y + 8 }, end: { x: cTotal, y: y + 8 }, thickness: 1, color: GREEN });
  totalsRow("Total", money(data.total), { bold: true });

  // ── Pay-now call to action for unpaid orders ──
  if (data.payUrl && data.paymentStatus !== "paid") {
    y -= 16;
    page.drawRectangle({
      x: M,
      y: y - 30,
      width: width - 2 * M,
      height: 46,
      color: rgb(0.95, 0.96, 0.93),
      borderColor: GREEN,
      borderWidth: 1,
    });
    text("Pay online", M + 12, y, { font: bold, size: 11, color: GREEN });
    y -= 14;
    text("Pay securely by card at:", M + 12, y, { size: 9, color: MUTED });
    text(data.payUrl, M + 130, y, { size: 9, color: rgb(0.18, 0.42, 0.71) });
    if (data.payLinkExpiresAt) {
      y -= 12;
      text(
        `This payment link expires ${new Date(data.payLinkExpiresAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}.`,
        M + 12,
        y,
        { size: 8, color: MUTED },
      );
    }
    y -= 24;
  }

  // ── Footer ──
  text(
    `Questions about this invoice? Email ${SUPPORT_EMAIL}`,
    M,
    M,
    { size: 8, color: MUTED },
  );
  text("Thank you for supporting ShreyCare Organics.", M, M - 12, { size: 8, color: MUTED });

  return doc.save();
}
