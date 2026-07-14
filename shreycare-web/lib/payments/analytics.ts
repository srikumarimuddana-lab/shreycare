// Pure aggregation for the admin payments portal. Kept free of I/O so the
// numbers the dashboard shows are directly unit-testable.

export interface SaleForPayments {
  type: "online" | "offline";
  sale_date: string;
  payment_method: string;
  payment_status: string;
  subtotal: number | string | null;
  tax_amount: number | string | null;
  total: number | string | null;
  amount_refunded: number | string | null;
}

export const PAYMENT_METHODS = ["stripe", "interac", "cash", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface MethodBucket {
  method: PaymentMethod;
  count: number;
  grossRevenue: number; // sum of totals across all statuses
  collected: number; // captured money net of refunds
  pending: number; // awaiting payment
  refunded: number; // amount actually returned
  disputed: number; // totals currently under dispute
  failedOrExpired: number; // orders whose payment fell through
}

export interface MonthPoint {
  month: string; // YYYY-MM
  stripe: number;
  interac: number;
  cash: number;
  other: number;
  total: number;
}

export interface PaymentsAnalytics {
  totalOrders: number;
  grossRevenue: number;
  collected: number;
  pending: number;
  refunded: number;
  disputed: number;
  averageOrderValue: number;
  byMethod: MethodBucket[];
  monthly: MonthPoint[];
  statusCounts: Record<string, number>;
}

function toMethod(method: string): PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(method)
    ? (method as PaymentMethod)
    : "other";
}

function effectiveTotal(s: SaleForPayments): number {
  const total = Number(s.total ?? 0);
  if (total > 0) return total;
  return Number(s.subtotal ?? 0) + Number(s.tax_amount ?? 0);
}

// A sale contributes to "collected" once money was captured — including
// partially refunded (net) and disputed sales (money currently held).
const CAPTURED_STATUSES = new Set([
  "paid",
  "partially_refunded",
  "refunded",
  "disputed",
]);

export function aggregatePayments(
  sales: SaleForPayments[],
  now: Date = new Date(),
  monthsBack = 12,
): PaymentsAnalytics {
  const buckets = new Map<PaymentMethod, MethodBucket>(
    PAYMENT_METHODS.map((m) => [
      m,
      {
        method: m,
        count: 0,
        grossRevenue: 0,
        collected: 0,
        pending: 0,
        refunded: 0,
        disputed: 0,
        failedOrExpired: 0,
      },
    ]),
  );

  // Pre-build the month axis so months with zero sales still render.
  const months: MonthPoint[] = [];
  const monthIndex = new Map<string, MonthPoint>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    const point: MonthPoint = { month: key, stripe: 0, interac: 0, cash: 0, other: 0, total: 0 };
    months.push(point);
    monthIndex.set(key, point);
  }

  const statusCounts: Record<string, number> = {};
  let paidOrderCount = 0;
  let collectedGross = 0;

  for (const sale of sales) {
    const method = toMethod(sale.payment_method);
    const bucket = buckets.get(method)!;
    const total = effectiveTotal(sale);
    const refunded = Number(sale.amount_refunded ?? 0);
    const status = sale.payment_status;

    bucket.count += 1;
    bucket.grossRevenue += total;
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;

    if (CAPTURED_STATUSES.has(status)) {
      bucket.collected += total - refundedAmount(status, total, refunded);
      bucket.refunded += refundedAmount(status, total, refunded);
      collectedGross += total;
      paidOrderCount += 1;
      if (status === "disputed") bucket.disputed += total;

      const key = sale.sale_date?.slice(0, 7);
      const point = key ? monthIndex.get(key) : undefined;
      if (point) {
        point[method] = +(point[method] + total).toFixed(2);
        point.total = +(point.total + total).toFixed(2);
      }
    } else if (status === "pending") {
      bucket.pending += total;
    } else if (status === "failed" || status === "expired") {
      bucket.failedOrExpired += total;
    }
  }

  const round = (n: number) => +n.toFixed(2);
  const byMethod = [...buckets.values()].map((b) => ({
    ...b,
    grossRevenue: round(b.grossRevenue),
    collected: round(b.collected),
    pending: round(b.pending),
    refunded: round(b.refunded),
    disputed: round(b.disputed),
    failedOrExpired: round(b.failedOrExpired),
  }));

  const sum = (fn: (b: MethodBucket) => number) =>
    round(byMethod.reduce((acc, b) => acc + fn(b), 0));

  return {
    totalOrders: sales.length,
    grossRevenue: sum((b) => b.grossRevenue),
    collected: sum((b) => b.collected),
    pending: sum((b) => b.pending),
    refunded: sum((b) => b.refunded),
    disputed: sum((b) => b.disputed),
    averageOrderValue:
      paidOrderCount > 0 ? round(collectedGross / paidOrderCount) : 0,
    byMethod,
    monthly: months,
    statusCounts,
  };
}

// How much of a sale's money went back to the customer, given its status.
// Fully refunded legacy rows may have amount_refunded=0 (pre-Stripe manual
// refunds), so "refunded" status falls back to the full total.
function refundedAmount(
  status: string,
  total: number,
  amountRefunded: number,
): number {
  if (status === "refunded") return amountRefunded > 0 ? amountRefunded : total;
  if (status === "partially_refunded") return amountRefunded;
  return 0;
}
