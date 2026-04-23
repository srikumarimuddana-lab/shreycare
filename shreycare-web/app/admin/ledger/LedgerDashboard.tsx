"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddSaleForm } from "./AddSaleForm";

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Sale {
  id: string;
  order_number: string;
  type: "online" | "offline";
  sale_date: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  items: SaleItem[];
  subtotal: number;
  payment_method: string;
  payment_status: string;
  fulfillment: string;
  notes: string | null;
}

interface Summary {
  totalSales: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  onlineCount: number;
  offlineCount: number;
  onlineRevenue: number;
  offlineRevenue: number;
}

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  refunded: "bg-red-100 text-red-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function LedgerDashboard() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterStatus) params.set("status", filterStatus);

    const [salesRes, summaryRes] = await Promise.all([
      fetch(`/api/admin/sales?${params}`),
      fetch("/api/admin/sales/summary"),
    ]);

    if (salesRes.status === 401 || summaryRes.status === 401) {
      router.push("/admin/login");
      return;
    }

    const salesData = await salesRes.json();
    const summaryData = await summaryRes.json();
    setSales(Array.isArray(salesData) ? salesData : []);
    setSummary(summaryData);
    setLoading(false);
  }, [filterType, filterStatus, router]);

  // Fetch from API is an external-system sync — safe to set state here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateSale(id: string, field: string, value: string) {
    await fetch("/api/admin/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    fetchData();
  }

  if (loading) {
    return <p className="text-on-surface-variant py-20 text-center">Loading...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="Total Revenue" value={`$${summary.totalRevenue.toFixed(2)}`} sub={`${summary.totalSales} sales`} />
          <Card label="Collected" value={`$${summary.paidRevenue.toFixed(2)}`} sub="Paid" color="text-green-700" />
          <Card label="Pending" value={`$${summary.pendingRevenue.toFixed(2)}`} sub="Awaiting payment" color="text-yellow-700" />
          <Card label="Online / Offline" value={`${summary.onlineCount} / ${summary.offlineCount}`} sub={`$${summary.onlineRevenue.toFixed(2)} / $${summary.offlineRevenue.toFixed(2)}`} />
        </div>
      )}

      {/* Actions + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-md font-bold text-sm hover:opacity-90 transition-opacity"
        >
          {showForm ? "Cancel" : "+ Add offline sale"}
        </button>
        <div className="flex gap-2 text-sm">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface"
          >
            <option value="">All types</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Add sale form */}
      {showForm && (
        <AddSaleForm
          onDone={() => {
            setShowForm(false);
            fetchData();
          }}
        />
      )}

      {/* Sales table */}
      <div className="overflow-x-auto rounded-lg border border-outline-variant">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-primary">Order</th>
              <th className="px-4 py-3 font-semibold text-primary">Type</th>
              <th className="px-4 py-3 font-semibold text-primary">Date</th>
              <th className="px-4 py-3 font-semibold text-primary">Customer</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-primary">Payment</th>
              <th className="px-4 py-3 font-semibold text-primary">Status</th>
              <th className="px-4 py-3 font-semibold text-primary">Fulfillment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-primary">{s.order_number}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${s.type === "online" ? "bg-blue-100 text-blue-800" : "bg-surface-container text-on-surface-variant"}`}>
                    {s.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                  {new Date(s.sale_date).toLocaleDateString("en-CA")}
                </td>
                <td className="px-4 py-3">
                  <div className="text-on-surface font-medium">{s.customer_name}</div>
                  {s.customer_phone && (
                    <div className="text-on-surface-variant text-xs">{s.customer_phone}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-on-surface">
                  ${Number(s.subtotal).toFixed(2)}
                </td>
                <td className="px-4 py-3 capitalize text-on-surface-variant">{s.payment_method}</td>
                <td className="px-4 py-3">
                  <select
                    value={s.payment_status}
                    onChange={(e) => updateSale(s.id, "paymentStatus", e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${statusColors[s.payment_status] || ""}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={s.fulfillment}
                    onChange={(e) => updateSale(s.id, "fulfillment", e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${statusColors[s.fulfillment] || ""}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-on-surface-variant">
                  No sales found. Add your first sale above.
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
  label,
  value,
  sub,
  color = "text-primary",
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5">
      <p className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-on-surface-variant mt-1">{sub}</p>
    </div>
  );
}
