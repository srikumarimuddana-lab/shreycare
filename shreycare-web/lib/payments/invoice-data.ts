import type { InvoiceData } from "@/lib/payments/invoice";
import { isPayableStatus, isPayLinkExpired } from "@/lib/payments/status";

// The subset of a sales row needed to render an invoice and decide whether a
// pay link should be shown.
export interface InvoiceSaleRow {
  order_number: string;
  sale_date: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: InvoiceData["shippingAddress"];
  items: InvoiceData["items"];
  subtotal: number | string;
  shipping_amount: number | string | null;
  tax_rate: number | string | null;
  tax_amount: number | string;
  total: number | string;
  amount_refunded?: number | string | null;
  payment_method: string;
  payment_status: string;
  pay_token: string;
  pay_link_expires_at?: string | null;
  invoice_count?: number | null;
}

export function payUrlForToken(token: string, origin: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || origin;
  return `${base}/pay/${token}`;
}

// Build the invoice model from a sales row, including a pay URL only when the
// order is actually payable (unpaid and the link hasn't expired).
export function buildInvoiceData(
  sale: InvoiceSaleRow,
  origin: string,
  now: Date = new Date(),
): InvoiceData {
  const linkActive =
    isPayableStatus(sale.payment_status) &&
    !isPayLinkExpired(sale.pay_link_expires_at, now);

  return {
    orderNumber: sale.order_number,
    saleDate: sale.sale_date,
    customerName: sale.customer_name,
    customerEmail: sale.customer_email,
    customerPhone: sale.customer_phone,
    shippingAddress: sale.shipping_address,
    items: (sale.items ?? []) as InvoiceData["items"],
    subtotal: Number(sale.subtotal ?? 0),
    shippingAmount: Number(sale.shipping_amount ?? 0),
    taxRate: Number(sale.tax_rate ?? 0),
    taxAmount: Number(sale.tax_amount ?? 0),
    total: Number(sale.total ?? 0),
    amountRefunded: Number(sale.amount_refunded ?? 0),
    paymentMethod: sale.payment_method,
    paymentStatus: sale.payment_status,
    payUrl: linkActive ? payUrlForToken(sale.pay_token, origin) : null,
    payLinkExpiresAt: linkActive ? sale.pay_link_expires_at ?? null : null,
  };
}

export const INVOICE_SALE_COLUMNS =
  "id, order_number, sale_date, customer_name, customer_email, customer_phone, shipping_address, items, subtotal, shipping_amount, tax_rate, tax_amount, total, amount_refunded, payment_method, payment_status, pay_token, pay_link_expires_at, invoice_count";
