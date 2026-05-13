"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

interface CustomerKPIs {
  totalCustomers: number;
  newCustomers30d: number;
  returningCustomers: number;
  repeatPurchaseRate: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  purchaseFrequency: number;
  churnRiskCount: number;
  totalRevenue: number;
  totalOrders: number;
  segmentCounts: Record<string, number>;
}

interface CustomerRow {
  email: string;
  name: string;
  phone: string | null;
  totalOrders: number;
  paidOrders: number;
  totalSpent: number;
  lifetimeRevenue: number;
  averageOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  recencyScore?: number;
  frequencyScore?: number;
  monetaryScore?: number;
  segment?: string;
  effectiveSegment: string;
  segmentOverride: string | null;
  notes: string | null;
  tags: string[];
}

const SEGMENTS = [
  "Champions",
  "Loyal",
  "Potential Loyalist",
  "New",
  "At Risk",
  "Hibernating",
  "Others",
];

const segmentColors: Record<string, string> = {
  Champions: "bg-emerald-100 text-emerald-800",
  Loyal: "bg-green-100 text-green-800",
  "Potential Loyalist": "bg-teal-100 text-teal-800",
  New: "bg-blue-100 text-blue-800",
  "At Risk": "bg-yellow-100 text-yellow-800",
  Hibernating: "bg-red-100 text-red-800",
  Others: "bg-surface-container text-on-surface-variant",
};

const selectClass =
  "px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-outline-variant/50 cursor-pointer bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20";

export function CustomersDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [kpis, setKpis] = useState<CustomerKPIs | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSegment, setFilterSegment] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("totalSpent");

  const fetchAll = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterSegment) params.set("segment", filterSegment);
    if (search) params.set("search", search);
    if (sortBy) params.set("sortBy", sortBy);

    const [k, c] = await Promise.all([
      fetch("/api/admin/customers/summary"),
      fetch(`/api/admin/customers?${params.toString()}`),
    ]);

    if (k.status === 401 || c.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (k.ok) setKpis(await k.json());
    if (c.ok) setCustomers(await c.json());
    setLoading(false);
  }, [router, filterSegment, search, sortBy]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const top10 = useMemo(
    () => [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10),
    [customers],
  );

  function exportCSV() {
    if (customers.length === 0) {
      toast("No customers to export.", "error");
      return;
    }
    const header = ["Name", "Email", "Phone", "Orders", "Total Spent", "AOV", "First Order", "Last Order", "Days Since", "Segment", "Tags"];
    const rows = customers.map((c) => [
      c.name,
      c.email,
      c.phone ?? "",
      c.totalOrders.toString(),
      c.totalSpent.toFixed(2),
      c.averageOrderValue.toFixed(2),
      new Date(c.firstOrderDate).toLocaleDateString("en-CA"),
      new Date(c.lastOrderDate).toLocaleDateString("en-CA"),
      c.daysSinceLastOrder.toString(),
      c.effectiveSegment,
      c.tags.join("|"),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shreycare-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${customers.length} customers.`, "success");
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-on-surface-variant text-sm">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {kpis && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            <Card icon="groups" label="Customers" value={`${kpis.totalCustomers}`} sub={`${kpis.totalOrders} orders`} />
            <Card icon="person_add" label="New (30d)" value={`${kpis.newCustomers30d}`} sub="First order" accent="text-green-700" />
            <Card icon="loyalty" label="Returning" value={`${kpis.returningCustomers}`} sub={`${kpis.repeatPurchaseRate.toFixed(1)}% repeat rate`} />
            <Card icon="payments" label="AOV" value={`$${kpis.averageOrderValue.toFixed(2)}`} sub="Avg order value" accent="text-secondary" />
            <Card icon="diamond" label="LTV" value={`$${kpis.customerLifetimeValue.toFixed(2)}`} sub="Per customer" accent="text-primary" />
            <Card
              icon="warning"
              label="Churn risk"
              value={`${kpis.churnRiskCount}`}
              sub=">90 days inactive"
              accent={kpis.churnRiskCount > 0 ? "text-red-700" : "text-green-700"}
            />
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-headline text-sm uppercase tracking-widest text-primary font-bold">RFM segments</h2>
              {filterSegment && (
                <button
                  onClick={() => setFilterSegment("")}
                  className="text-error text-xs font-semibold hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {SEGMENTS.map((seg) => {
                const count = kpis.segmentCounts[seg] ?? 0;
                const active = filterSegment === seg;
                return (
                  <button
                    key={seg}
                    onClick={() => setFilterSegment(active ? "" : seg)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active ? "ring-2 ring-primary" : "hover:opacity-80"
                    } ${segmentColors[seg]}`}
                  >
                    {seg} <span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {top10.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <h2 className="font-headline text-sm uppercase tracking-widest text-primary font-bold mb-3">
            Top 10 customers by revenue
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-on-surface-variant text-xs">
                <tr>
                  <th className="py-2">#</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2 text-right">Orders</th>
                  <th className="py-2 text-right">Total spent</th>
                  <th className="py-2">Last order</th>
                  <th className="py-2">Segment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {top10.map((c, i) => (
                  <tr key={c.email}>
                    <td className="py-2 text-on-surface-variant">{i + 1}</td>
                    <td className="py-2">
                      <Link href={`/admin/customers/${encodeURIComponent(c.email)}`} className="text-primary hover:underline font-medium">
                        {c.name}
                      </Link>
                      <div className="text-xs text-on-surface-variant">{c.email}</div>
                    </td>
                    <td className="py-2 text-right">{c.totalOrders}</td>
                    <td className="py-2 text-right font-bold">${c.totalSpent.toFixed(2)}</td>
                    <td className="py-2 text-on-surface-variant">{new Date(c.lastOrderDate).toLocaleDateString("en-CA")}</td>
                    <td className="py-2">
                      <SegmentBadge seg={c.effectiveSegment} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            placeholder="Search name / email / phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${selectClass} w-64 max-w-full`}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectClass}>
            <option value="totalSpent">Sort: Total spent</option>
            <option value="orders">Sort: Orders</option>
            <option value="lastOrder">Sort: Last order</option>
            <option value="aov">Sort: AOV</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
        <button
          onClick={exportCSV}
          disabled={customers.length === 0}
          className="border border-primary text-primary px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/5 transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-base">download</span>
          Export CSV
        </button>
      </div>

      {/* Full customer table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-botanical">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-primary">Customer</th>
              <th className="px-4 py-3 font-semibold text-primary">Email</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Orders</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Spent</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">AOV</th>
              <th className="px-4 py-3 font-semibold text-primary">Last order</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Days</th>
              <th className="px-4 py-3 font-semibold text-primary">Segment</th>
              <th className="px-4 py-3 font-semibold text-primary">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {customers.map((c) => (
              <tr key={c.email} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${encodeURIComponent(c.email)}`} className="text-primary hover:underline font-medium">
                    {c.name}
                  </Link>
                  {c.phone && <div className="text-xs text-on-surface-variant">{c.phone}</div>}
                </td>
                <td className="px-4 py-3 text-on-surface-variant text-xs">{c.email}</td>
                <td className="px-4 py-3 text-right">{c.totalOrders}</td>
                <td className="px-4 py-3 text-right font-bold">${c.totalSpent.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">${c.averageOrderValue.toFixed(2)}</td>
                <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{new Date(c.lastOrderDate).toLocaleDateString("en-CA")}</td>
                <td className={`px-4 py-3 text-right text-sm ${c.daysSinceLastOrder > 90 ? "text-red-700 font-semibold" : "text-on-surface-variant"}`}>
                  {c.daysSinceLastOrder}
                </td>
                <td className="px-4 py-3"><SegmentBadge seg={c.effectiveSegment} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-semibold uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2 block">groups</span>
                  No customers match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  sub,
  accent = "text-primary",
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-base text-on-surface-variant">{icon}</span>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">{label}</p>
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>
    </div>
  );
}

function SegmentBadge({ seg }: { seg: string }) {
  const className = segmentColors[seg] ?? segmentColors.Others;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${className}`}>
      {seg}
    </span>
  );
}
