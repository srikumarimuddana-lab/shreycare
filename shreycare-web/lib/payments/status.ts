// Pure payment-lifecycle rules shared by the Stripe webhook, the admin sales
// API, and the UI. Keeping these as plain functions makes the edge cases
// (double webhooks, out-of-order events, partial refunds, edit locking)
// directly unit-testable.

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "expired",
  "refunded",
  "partially_refunded",
  "disputed",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Statuses an admin may set by hand. Stripe-driven states (failed, expired,
// disputed, partially_refunded) only ever come from the webhook so the ledger
// can't drift from what actually happened at the processor.
export const MANUAL_PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "paid",
  "refunded",
];

// A "paid" webhook may arrive twice (Stripe retries) or after a refund/dispute
// event that raced ahead of it. Only ever move forward from a not-yet-paid
// state — never clobber refunded/disputed with paid.
export function shouldMarkPaid(current: string): boolean {
  return current === "pending" || current === "failed" || current === "expired";
}

// Session-expired events can arrive after the customer already paid via a
// second session or the admin marked the order paid manually.
export function shouldMarkExpired(current: string): boolean {
  return current === "pending";
}

export function shouldMarkFailed(current: string): boolean {
  return current === "pending";
}

// charge.refunded carries the cumulative amount_refunded on the charge.
export function refundStatus(
  totalCents: number,
  refundedCents: number,
): PaymentStatus {
  if (refundedCents <= 0) return "paid";
  return refundedCents >= totalCents ? "refunded" : "partially_refunded";
}

export interface EditLockSale {
  payment_method: string;
  payment_status: string;
  stripe_payment_intent_id?: string | null;
}

// Once Stripe has captured (or refunded/disputed) real money for an order,
// its financial fields (items, amounts, payment status/method) must mirror
// the processor — corrections happen via Stripe refunds, not ledger edits.
// Orders paid outside Stripe (cash, e-transfer) stay fully editable.
export function isFinanciallyLocked(sale: EditLockSale): boolean {
  if (sale.payment_method !== "stripe") return false;
  if (!sale.stripe_payment_intent_id) return false;
  return sale.payment_status !== "pending" && sale.payment_status !== "expired" && sale.payment_status !== "failed";
}

// Default lifetime of a shareable payment link (the /pay/<token> page). The
// underlying Stripe Checkout session is minted fresh on each visit (Stripe
// caps those at 24h), so this longer window governs how long the link a
// customer received by email/QR stays usable.
export const PAY_LINK_TTL_DAYS = 7;

export function payLinkExpiryFromNow(now: Date): string {
  return new Date(now.getTime() + PAY_LINK_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

// A pay link is usable only while unpaid AND before its expiry. A missing
// expiry (legacy rows created before the column existed) is treated as
// non-expiring so those orders stay payable.
export function isPayLinkExpired(
  expiresAt: string | null | undefined,
  now: Date,
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

export const PAYABLE_STATUSES = ["pending", "failed", "expired"] as const;

export function isPayableStatus(status: string): boolean {
  return (PAYABLE_STATUSES as readonly string[]).includes(status);
}

export const FINANCIAL_FIELDS = [
  "items",
  "subtotal",
  "taxRate",
  "taxAmount",
  "paymentStatus",
  "paymentMethod",
] as const;

// Which requested fields on an admin edit are financial. Used to reject the
// edit with a helpful message instead of silently dropping fields.
export function lockedFieldsInUpdate(body: Record<string, unknown>): string[] {
  return FINANCIAL_FIELDS.filter((f) => body[f] !== undefined);
}
