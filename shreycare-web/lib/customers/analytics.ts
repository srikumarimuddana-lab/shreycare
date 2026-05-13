// Customer analytics — pure functions over sales rows.
// All metrics (LTV, AOV, RFM, churn) are computed live from the sales table
// grouped by lowercased email. The customers table only stores supplemental
// metadata (notes, tags, segment_override).

export interface SaleForAnalytics {
  id: string;
  order_number: string;
  sale_date: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  payment_status: string;
  type: "online" | "offline";
  fulfillment: string;
  subtotal: number | string | null;
  tax_amount: number | string | null;
  total: number | string | null;
}

export interface CustomerStats {
  email: string;
  name: string;
  phone: string | null;
  totalOrders: number;
  paidOrders: number;
  totalSpent: number;        // paid revenue only
  lifetimeRevenue: number;   // includes pending (excludes refunded)
  averageOrderValue: number; // totalSpent / paidOrders
  firstOrderDate: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  // RFM (filled in by computeRFM)
  recencyScore?: number;
  frequencyScore?: number;
  monetaryScore?: number;
  segment?: string;
}

export interface CustomerMetadata {
  email: string;
  notes?: string | null;
  tags?: string[];
  segment_override?: string | null;
  name?: string | null;
  phone?: string | null;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function effectiveTotal(s: SaleForAnalytics): number {
  const t = Number(s.total ?? 0);
  if (t > 0) return t;
  return Number(s.subtotal ?? 0) + Number(s.tax_amount ?? 0);
}

// Group sales by lowercased email (sales without an email are skipped).
// Returns one CustomerStats per unique email.
export function aggregateCustomersFromSales(sales: SaleForAnalytics[]): CustomerStats[] {
  const map = new Map<string, CustomerStats>();
  const now = Date.now();

  for (const s of sales) {
    const rawEmail = (s.customer_email ?? "").trim();
    if (!rawEmail) continue;
    const email = rawEmail.toLowerCase();
    const total = effectiveTotal(s);
    const isPaid = s.payment_status === "paid";
    const isRefunded = s.payment_status === "refunded";

    const existing = map.get(email);
    if (!existing) {
      map.set(email, {
        email,
        name: s.customer_name ?? rawEmail,
        phone: s.customer_phone ?? null,
        totalOrders: 1,
        paidOrders: isPaid ? 1 : 0,
        totalSpent: isPaid ? total : 0,
        lifetimeRevenue: isRefunded ? 0 : total,
        averageOrderValue: 0,
        firstOrderDate: s.sale_date,
        lastOrderDate: s.sale_date,
        daysSinceLastOrder: 0,
      });
      continue;
    }

    existing.totalOrders += 1;
    if (isPaid) {
      existing.paidOrders += 1;
      existing.totalSpent += total;
    }
    if (!isRefunded) existing.lifetimeRevenue += total;

    if (s.sale_date < existing.firstOrderDate) existing.firstOrderDate = s.sale_date;
    if (s.sale_date > existing.lastOrderDate) {
      existing.lastOrderDate = s.sale_date;
      // Prefer most recent name/phone as canonical.
      if (s.customer_name) existing.name = s.customer_name;
      if (s.customer_phone) existing.phone = s.customer_phone;
    }
  }

  // Compute derived fields.
  for (const c of map.values()) {
    c.averageOrderValue = c.paidOrders > 0 ? +(c.totalSpent / c.paidOrders).toFixed(2) : 0;
    c.totalSpent = +c.totalSpent.toFixed(2);
    c.lifetimeRevenue = +c.lifetimeRevenue.toFixed(2);
    c.daysSinceLastOrder = Math.floor((now - new Date(c.lastOrderDate).getTime()) / MS_PER_DAY);
  }

  return Array.from(map.values());
}

// Quintile bucket helper — given a sorted array and a value, returns 1-5.
// Higher rank = more recent / more frequent / higher monetary value.
function quintileRank(sortedAsc: number[], value: number): number {
  if (sortedAsc.length === 0) return 1;
  // Binary-search-ish position; for our scale a linear scan is fine.
  const idx = sortedAsc.findIndex((v) => v >= value);
  const position = idx === -1 ? sortedAsc.length - 1 : idx;
  const rank = Math.floor((position / Math.max(1, sortedAsc.length - 1)) * 4) + 1;
  return Math.max(1, Math.min(5, rank));
}

// Compute RFM scores (1-5 quintiles) and bucket into named segments.
// Recency: lower days_since = higher score (5 = most recent).
// Frequency: higher orders = higher score.
// Monetary: higher spend = higher score.
export function computeRFM(customers: CustomerStats[]): CustomerStats[] {
  if (customers.length === 0) return customers;

  // For recency, we invert: sort days-since ASC, then customers with low
  // days-since (recent) end up at the top of the array → high quintile.
  const recencyAsc = customers.map((c) => -c.daysSinceLastOrder).sort((a, b) => a - b);
  const frequencyAsc = customers.map((c) => c.totalOrders).sort((a, b) => a - b);
  const monetaryAsc = customers.map((c) => c.totalSpent).sort((a, b) => a - b);

  for (const c of customers) {
    c.recencyScore = quintileRank(recencyAsc, -c.daysSinceLastOrder);
    c.frequencyScore = quintileRank(frequencyAsc, c.totalOrders);
    c.monetaryScore = quintileRank(monetaryAsc, c.totalSpent);
    c.segment = bucketSegment(c.recencyScore, c.frequencyScore, c.monetaryScore);
  }

  return customers;
}

function bucketSegment(r: number, f: number, m: number): string {
  if (r >= 4 && f >= 4 && m >= 4) return "Champions";
  if (f >= 4 && m >= 3) return "Loyal";
  if (r >= 4 && f <= 2 && f >= 1 && m >= 1) {
    if (r === 5 && f === 1) return "New";
    return "Potential Loyalist";
  }
  if (r === 5 && f === 1) return "New";
  if (r <= 2 && f >= 3) return "At Risk";
  if (r === 1 && f <= 2) return "Hibernating";
  return "Others";
}

// Merge admin-set metadata (notes, tags, segment override) into computed stats.
export function mergeCustomerMetadata(
  stats: CustomerStats[],
  metadata: CustomerMetadata[],
): Array<CustomerStats & {
  notes: string | null;
  tags: string[];
  segmentOverride: string | null;
  effectiveSegment: string;
}> {
  const metaByEmail = new Map<string, CustomerMetadata>(
    metadata.map((m) => [m.email.toLowerCase(), m]),
  );
  return stats.map((c) => {
    const meta = metaByEmail.get(c.email);
    const segmentOverride = meta?.segment_override ?? null;
    return {
      ...c,
      // Honor admin-set canonical name/phone when provided.
      name: meta?.name || c.name,
      phone: meta?.phone || c.phone,
      notes: meta?.notes ?? null,
      tags: meta?.tags ?? [],
      segmentOverride,
      effectiveSegment: segmentOverride || c.segment || "Others",
    };
  });
}

// Top-line KPIs for the customers dashboard.
export function computeCustomerKPIs(customers: CustomerStats[]) {
  const total = customers.length;
  const new30d = customers.filter((c) => {
    const days = Math.floor((Date.now() - new Date(c.firstOrderDate).getTime()) / MS_PER_DAY);
    return days <= 30;
  }).length;
  const returning = customers.filter((c) => c.totalOrders >= 2).length;
  const repeatPurchaseRate = total > 0 ? +((returning / total) * 100).toFixed(2) : 0;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.paidOrders, 0);
  const aov = totalOrders > 0 ? +(totalRevenue / totalOrders).toFixed(2) : 0;
  const ltv = total > 0 ? +(totalRevenue / total).toFixed(2) : 0;
  const purchaseFrequency = total > 0 ? +(totalOrders / total).toFixed(2) : 0;
  const churnRiskCount = customers.filter((c) => c.daysSinceLastOrder > 90).length;

  // Segment counts.
  const segmentCounts: Record<string, number> = {};
  for (const c of customers) {
    const seg = c.segment ?? "Others";
    segmentCounts[seg] = (segmentCounts[seg] ?? 0) + 1;
  }

  return {
    totalCustomers: total,
    newCustomers30d: new30d,
    returningCustomers: returning,
    repeatPurchaseRate,
    averageOrderValue: aov,
    customerLifetimeValue: ltv,
    purchaseFrequency,
    churnRiskCount,
    totalRevenue: +totalRevenue.toFixed(2),
    totalOrders,
    segmentCounts,
  };
}
