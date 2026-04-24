"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddSaleForm } from "./AddSaleForm";
import { useToast } from "@/components/ui/ToastProvider";

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
  totalSubtotal: number;
  totalTax: number;
  paidRevenue: number;
  pendingRevenue: number;
  onlineCount: number;
  offlineCount: number;
  onlineRevenue: number;
  offlineRevenue: number;
  fulfillmentPending: number;
  fulfillmentShipped: number;
  fulfillmentDelivered: number;
  fulfillmentCancelled: number;
}

const statusBadge: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  refunded: "bg-red-100 text-red-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const selectClass =
  "px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-outline-variant/50 cursor-pointer bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20";

export function LedgerDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);

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
  }, [filterType, filterStatus, filterFrom, filterTo, router]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateSale(id: string, field: string, value: string) {
    const res = await fetch("/api/admin/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    if (res.ok) {
      const label = field === "paymentStatus" ? "Payment" : "Fulfillment";
      toast(`${label} updated to ${value}.`, "success");
      fetchData();
    } else {
      toast("Update failed. Please try again.", "error");
    }
  }

  function exportCSV() {
    if (sales.length === 0) {
      toast("No sales to export.", "error");
      return;
    }
    const header = [
      "Order Number", "Type", "Date", "Customer", "Email", "Phone",
      "Items", "Subtotal", "Tax", "Total", "Payment Method",
      "Payment Status", "Fulfillment", "Notes",
    ];
    const rows = sales.map((s) => [
      s.order_number,
      s.type,
      new Date(s.sale_date).toLocaleDateString("en-CA"),
      s.customer_name,
      s.customer_email ?? "",
      s.customer_phone ?? "",
      (s.items as SaleItem[])
        ?.map((i) => `${i.productName} x${i.quantity} @$${i.unitPrice}`)
        .join("; ") ?? "",
      Number(s.subtotal).toFixed(2),
      "0.00",
      Number(s.subtotal).toFixed(2),
      s.payment_method,
      s.payment_status,
      s.fulfillment,
      (s.notes ?? "").replace(/\n/g, " "),
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `shreycare-sales-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${sales.length} sales to CSV.`, "success");
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-on-surface-variant text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary cards ── */}
      {summary && (<>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <SummaryCard
            icon="payments"
            label="Total Revenue"
            value={`$${summary.totalRevenue.toFixed(2)}`}
            sub={`${summary.totalSales} sales`}
          />
          <SummaryCard
            icon="check_circle"
            label="Collected"
            value={`$${summary.paidRevenue.toFixed(2)}`}
            sub="Paid"
            accent="text-green-700"
          />
          <SummaryCard
            icon="schedule"
            label="Pending"
            value={`$${summary.pendingRevenue.toFixed(2)}`}
            sub="Awaiting payment"
            accent="text-yellow-700"
          />
          <SummaryCard
            icon="receipt_long"
            label="Tax Collected"
            value={`$${summary.totalTax.toFixed(2)}`}
            sub={`On $${summary.totalSubtotal.toFixed(2)} in sales`}
            accent="text-secondary"
          />
          <SummaryCard
            icon="sync_alt"
            label="Online / Offline"
            value={`${summary.onlineCount} / ${summary.offlineCount}`}
            sub={`$${summary.onlineRevenue.toFixed(2)} / $${summary.offlineRevenue.toFixed(2)}`}
          />
        </div>

        {/* Fulfillment stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard
            icon="pending_actions"
            label="To fulfill"
            value={`${summary.fulfillmentPending}`}
            sub="Orders pending"
            accent="text-yellow-700"
          />
          <SummaryCard
            icon="local_shipping"
            label="Shipped"
            value={`${summary.fulfillmentShipped}`}
            sub="In transit"
            accent="text-blue-700"
          />
          <SummaryCard
            icon="inventory"
            label="Delivered"
            value={`${summary.fulfillmentDelivered}`}
            sub="Completed"
            accent="text-green-700"
          />
          <SummaryCard
            icon="cancel"
            label="Cancelled"
            value={`${summary.fulfillmentCancelled}`}
            sub="Cancelled orders"
            accent="text-red-700"
          />
        </div>
      </>)}

      {/* ── Actions + Filters ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">
              {showForm ? "close" : "add_circle"}
            </span>
            {showForm ? "Cancel" : "Add offline sale"}
          </button>
          <button
            onClick={exportCSV}
            disabled={sales.length === 0}
            className="border border-primary text-primary px-5 py-3 rounded-lg font-bold text-sm hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-sm items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-primary uppercase tracking-widest">From</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className={selectClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-primary uppercase tracking-widest">To</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className={selectClass}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={selectClass}
          >
            <option value="">All types</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
          {(filterFrom || filterTo || filterType || filterStatus) && (
            <button
              onClick={() => {
                setFilterFrom("");
                setFilterTo("");
                setFilterType("");
                setFilterStatus("");
              }}
              className="text-error text-xs font-semibold hover:underline px-2 py-1.5"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Add sale form ── */}
      {showForm && (
        <AddSaleForm
          onDone={(emailed) => {
            setShowForm(false);
            toast(
              emailed
                ? "Sale saved. Receipt emailed to customer."
                : "Sale saved.",
              "success",
            );
            fetchData();
          }}
        />
      )}

      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-botanical">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-left">
            <tr>
              <th className="px-4 py-3.5 font-semibold text-primary">Order</th>
              <th className="px-4 py-3.5 font-semibold text-primary">Type</th>
              <th className="px-4 py-3.5 font-semibold text-primary">Date</th>
              <th className="px-4 py-3.5 font-semibold text-primary">Customer</th>
              <th className="px-4 py-3.5 font-semibold text-primary text-right">Amount</th>
              <th className="px-4 py-3.5 font-semibold text-primary">Payment</th>
              <th className="px-4 py-3.5 font-semibold text-primary">Status</th>
              <th className="px-4 py-3.5 font-semibold text-primary">Fulfillment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-4 py-3.5 font-mono text-xs text-primary font-semibold">{s.order_number}</td>
                <td className="px-4 py-3.5">
                  <TypeBadge type={s.type} />
                </td>
                <td className="px-4 py-3.5 text-on-surface-variant whitespace-nowrap">
                  {formatDate(s.sale_date)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-on-surface font-medium">{s.customer_name}</div>
                  {s.customer_phone && (
                    <div className="text-on-surface-variant text-xs">{s.customer_phone}</div>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-on-surface">
                  ${Number(s.subtotal).toFixed(2)}
                </td>
                <td className="px-4 py-3.5 capitalize text-on-surface-variant text-xs font-medium">
                  {s.payment_method}
                </td>
                <td className="px-4 py-3.5">
                  <select
                    value={s.payment_status}
                    onChange={(e) => updateSale(s.id, "paymentStatus", e.target.value)}
                    className={`${selectClass} ${statusBadge[s.payment_status] || ""}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </td>
                <td className="px-4 py-3.5">
                  <select
                    value={s.fulfillment}
                    onChange={(e) => updateSale(s.id, "fulfillment", e.target.value)}
                    className={`${selectClass} ${statusBadge[s.fulfillment] || ""}`}
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
                <td colSpan={8} className="px-4 py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2 block">receipt_long</span>
                  No sales found. Add your first sale above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {sales.length === 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2 block">receipt_long</span>
            <p className="text-on-surface-variant">No sales found. Add your first sale above.</p>
          </div>
        )}
        {sales.map((s) => {
          const expanded = expandedId === s.id;
          return (
            <div
              key={s.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm"
            >
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : s.id)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TypeBadge type={s.type} />
                    <span className="font-mono text-xs text-primary font-semibold">{s.order_number}</span>
                  </div>
                  <div className="text-on-surface font-medium text-sm">{s.customer_name}</div>
                  <div className="text-on-surface-variant text-xs">{formatDate(s.sale_date)}</div>
                </div>
                <div className="text-right pl-4">
                  <div className="text-on-surface font-bold">${Number(s.subtotal).toFixed(2)}</div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 ${statusBadge[s.payment_status] || ""}`}>
                    {s.payment_status}
                  </span>
                </div>
              </button>
              {expanded && (
                <div className="border-t border-outline-variant/50 px-4 py-4 space-y-4 bg-surface-container-low/30">
                  {s.customer_phone && (
                    <div className="text-sm">
                      <span className="text-on-surface-variant">Phone: </span>
                      <a href={`tel:${s.customer_phone}`} className="text-primary">{s.customer_phone}</a>
                    </div>
                  )}
                  {s.customer_email && (
                    <div className="text-sm">
                      <span className="text-on-surface-variant">Email: </span>
                      <a href={`mailto:${s.customer_email}`} className="text-primary">{s.customer_email}</a>
                    </div>
                  )}
                  {(s.items as SaleItem[])?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Items</p>
                      <ul className="space-y-1">
                        {(s.items as SaleItem[]).map((item, i) => (
                          <li key={i} className="text-sm text-on-surface flex justify-between">
                            <span>{item.productName} x{item.quantity}</span>
                            <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {s.notes && (
                    <p className="text-sm text-on-surface-variant italic">{s.notes}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-primary uppercase tracking-widest block mb-1">Payment</label>
                      <select
                        value={s.payment_status}
                        onChange={(e) => updateSale(s.id, "paymentStatus", e.target.value)}
                        className={`w-full ${selectClass} ${statusBadge[s.payment_status] || ""}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-primary uppercase tracking-widest block mb-1">Fulfillment</label>
                      <select
                        value={s.fulfillment}
                        onChange={(e) => updateSale(s.id, "fulfillment", e.target.value)}
                        className={`w-full ${selectClass} ${statusBadge[s.fulfillment] || ""}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
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
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
          {label}
        </p>
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>
    </div>
  );
}

function TypeBadge({ type }: { type: "online" | "offline" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        type === "online"
          ? "bg-blue-50 text-blue-700"
          : "bg-surface-container text-on-surface-variant"
      }`}
    >
      <span className="material-symbols-outlined text-xs">
        {type === "online" ? "language" : "storefront"}
      </span>
      {type}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
