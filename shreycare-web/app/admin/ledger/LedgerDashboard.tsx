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

interface ShippingAddress {
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface Sale {
  id: string;
  order_number: string;
  type: "online" | "offline";
  sale_date: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address?: ShippingAddress | null;
  items: SaleItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  fulfillment: string;
  notes: string | null;
  stripe_payment_intent_id?: string | null;
  amount_refunded?: number | string | null;
  pay_link_expires_at?: string | null;
  invoice_count?: number | null;
}

// Orders whose money moved through Stripe mirror the processor — their
// amounts and payment state can't be hand-edited (the API enforces this
// too); refunds go through the Refund action.
function isStripeLocked(s: Sale): boolean {
  return (
    s.payment_method === "stripe" &&
    Boolean(s.stripe_payment_intent_id) &&
    !["pending", "expired", "failed"].includes(s.payment_status)
  );
}

// Statuses from which an order can still be taken to payment via QR / link.
function isPayable(s: Sale): boolean {
  return (
    ["pending", "failed", "expired"].includes(s.payment_status) &&
    s.fulfillment !== "cancelled"
  );
}

interface ChannelBreakdown {
  count: number;
  revenue: number;
  subtotal: number;
  tax: number;
  paidRevenue: number;
  pendingRevenue: number;
  refundedRevenue: number;
  fulfillmentPending: number;
  fulfillmentShipped: number;
  fulfillmentDelivered: number;
  fulfillmentCancelled: number;
}

interface Summary {
  totalSales: number;
  totalRevenue: number;
  totalSubtotal: number;
  totalTax: number;
  paidRevenue: number;
  pendingRevenue: number;
  refundedRevenue: number;
  onlineCount: number;
  offlineCount: number;
  onlineRevenue: number;
  offlineRevenue: number;
  fulfillmentPending: number;
  fulfillmentShipped: number;
  fulfillmentDelivered: number;
  fulfillmentCancelled: number;
  breakdown: {
    online: ChannelBreakdown;
    offline: ChannelBreakdown;
  };
}

// Format a structured shipping address into display-ready lines, skipping any
// empty parts. Returns [] when there's no usable address (e.g. offline sales
// or legacy orders saved before addresses were persisted).
function addressLines(a?: ShippingAddress | null): string[] {
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

// Effective total for a sale row: prefer the stored `total`, fall back to
// subtotal + tax_amount so legacy offline rows (total=0) still render right.
function saleTotal(s: Sale): number {
  const t = Number(s.total ?? 0);
  if (t > 0) return t;
  return Number(s.subtotal ?? 0) + Number(s.tax_amount ?? 0);
}

const statusBadge: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  refunded: "bg-red-100 text-red-800",
  partially_refunded: "bg-orange-100 text-orange-800",
  failed: "bg-red-100 text-red-800",
  expired: "bg-surface-container text-on-surface-variant",
  disputed: "bg-red-100 text-red-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabel = (s: string) => s.replace(/_/g, " ");

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
  const [filterMethod, setFilterMethod] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [qrSale, setQrSale] = useState<Sale | null>(null);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterStatus) params.set("status", filterStatus);
    if (filterMethod) params.set("method", filterMethod);
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
  }, [filterType, filterStatus, filterMethod, filterFrom, filterTo, router]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const [editingSale, setEditingSale] = useState<Sale | null>(null);

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
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Update failed. Please try again.", "error");
      fetchData();
    }
  }

  async function refundSale(sale: Sale) {
    const remaining =
      saleTotal(sale) - Number(sale.amount_refunded ?? 0);
    const input = prompt(
      `Refund order ${sale.order_number} via Stripe.\n\n` +
        `Refundable: $${remaining.toFixed(2)}\n` +
        `Enter an amount for a partial refund, or leave as-is for a full refund.`,
      remaining.toFixed(2),
    );
    if (input === null) return;
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining) {
      toast(`Enter an amount between $0.01 and $${remaining.toFixed(2)}.`, "error");
      return;
    }
    if (!confirm(`Refund $${amount.toFixed(2)} to the customer's card? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/sales/${sale.id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast(`Refunded $${amount.toFixed(2)} on ${sale.order_number}.`, "success");
      fetchData();
    } else {
      toast(data.error || "Refund failed.", "error");
    }
  }

  async function downloadInvoice(sale: Sale) {
    try {
      const res = await fetch(`/api/admin/sales/${sale.id}/invoice`);
      if (!res.ok) {
        toast("Could not generate the invoice PDF.", "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${sale.order_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast("Could not download the invoice.", "error");
    }
  }

  async function sendInvoice(sale: Sale) {
    let email = sale.customer_email ?? "";
    if (!email) {
      const input = prompt(`Email the invoice for ${sale.order_number} to:`);
      if (input === null) return;
      email = input.trim();
      if (!email) return;
    }
    const unpaid = isPayable(sale);
    const verb = sale.invoice_count && sale.invoice_count > 0 ? "Resend" : "Send";
    if (
      !confirm(
        `${verb} invoice ${sale.order_number} to ${email}?` +
          (unpaid ? "\n\nIt will include a Pay-now card link valid for 7 days." : ""),
      )
    )
      return;

    const res = await fetch(`/api/admin/sales/${sale.id}/send-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast(
        data.withPayLink
          ? `Invoice + payment link sent to ${data.sentTo}.`
          : `Invoice sent to ${data.sentTo}.`,
        "success",
      );
      fetchData();
    } else {
      toast(data.error || "Failed to send invoice.", "error");
    }
  }

  async function recreateOrder(sale: Sale) {
    if (
      !confirm(
        `Recreate a new order from ${sale.order_number}?\n\n` +
          `This creates a fresh offline order (paid, cash) with the same items and customer — ` +
          `useful to rebalance the ledger after a cancellation. The original is left unchanged.`,
      )
    )
      return;
    const res = await fetch(`/api/admin/sales/${sale.id}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast(`Created ${data.orderNumber} from ${sale.order_number}.`, "success");
      fetchData();
    } else {
      toast(data.error || "Failed to recreate order.", "error");
    }
  }

  async function deleteSale(id: string, orderNumber: string) {
    if (!confirm(`Delete order ${orderNumber}? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/sales", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast(`Order ${orderNumber} deleted.`, "success");
      fetchData();
    } else {
      toast("Delete failed. Please try again.", "error");
    }
  }

  async function saveEdit(sale: Sale) {
    // Financial fields are locked once Stripe has captured the charge; only
    // send the always-editable fields for those orders so the PATCH doesn't
    // 409 on the locked ones.
    const payload: Record<string, unknown> = {
      id: sale.id,
      customerName: sale.customer_name,
      customerEmail: sale.customer_email,
      customerPhone: sale.customer_phone,
      shippingAddress: sale.shipping_address,
      fulfillment: sale.fulfillment,
      notes: sale.notes,
    };
    if (!isStripeLocked(sale)) {
      payload.paymentMethod = sale.payment_method;
      payload.paymentStatus = sale.payment_status;
      payload.items = sale.items;
      payload.subtotal = sale.subtotal;
      payload.taxRate = sale.tax_rate;
      payload.taxAmount = sale.tax_amount;
    }

    const res = await fetch("/api/admin/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast("Sale updated.", "success");
      setEditingSale(null);
      fetchData();
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Update failed.", "error");
    }
  }

  function exportCSV() {
    if (sales.length === 0) {
      toast("No sales to export.", "error");
      return;
    }
    const header = [
      "Order Number", "Type", "Date", "Customer", "Email", "Phone", "Address",
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
      addressLines(s.shipping_address).join(", "),
      (s.items as SaleItem[])
        ?.map((i) => `${i.productName} x${i.quantity} @$${i.unitPrice}`)
        .join("; ") ?? "",
      Number(s.subtotal ?? 0).toFixed(2),
      Number(s.tax_amount ?? 0).toFixed(2),
      saleTotal(s).toFixed(2),
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <SummaryCard
            icon="payments"
            label="Total Revenue"
            value={`$${summary.totalRevenue.toFixed(2)}`}
            sub={`${summary.totalSales} sales`}
            online={`$${summary.breakdown.online.revenue.toFixed(2)}`}
            offline={`$${summary.breakdown.offline.revenue.toFixed(2)}`}
          />
          <SummaryCard
            icon="check_circle"
            label="Collected"
            value={`$${summary.paidRevenue.toFixed(2)}`}
            sub="Paid"
            accent="text-green-700"
            online={`$${summary.breakdown.online.paidRevenue.toFixed(2)}`}
            offline={`$${summary.breakdown.offline.paidRevenue.toFixed(2)}`}
          />
          <SummaryCard
            icon="schedule"
            label="Pending"
            value={`$${summary.pendingRevenue.toFixed(2)}`}
            sub="Awaiting payment"
            accent="text-yellow-700"
            online={`$${summary.breakdown.online.pendingRevenue.toFixed(2)}`}
            offline={`$${summary.breakdown.offline.pendingRevenue.toFixed(2)}`}
          />
          <SummaryCard
            icon="receipt_long"
            label="Tax Collected"
            value={`$${summary.totalTax.toFixed(2)}`}
            sub={`On $${summary.totalSubtotal.toFixed(2)} in sales`}
            accent="text-secondary"
            online={`$${summary.breakdown.online.tax.toFixed(2)}`}
            offline={`$${summary.breakdown.offline.tax.toFixed(2)}`}
          />
          <SummaryCard
            icon="sync_alt"
            label="Sales count"
            value={`${summary.totalSales}`}
            sub="All sales"
            online={`${summary.breakdown.online.count}`}
            offline={`${summary.breakdown.offline.count}`}
          />
        </div>

        {/* Fulfillment stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard
            icon="pending_actions"
            label="To fulfill"
            value={`${summary.fulfillmentPending}`}
            sub="Orders pending"
            accent="text-yellow-700"
            online={`${summary.breakdown.online.fulfillmentPending}`}
            offline={`${summary.breakdown.offline.fulfillmentPending}`}
          />
          <SummaryCard
            icon="local_shipping"
            label="Shipped"
            value={`${summary.fulfillmentShipped}`}
            sub="In transit"
            accent="text-blue-700"
            online={`${summary.breakdown.online.fulfillmentShipped}`}
            offline={`${summary.breakdown.offline.fulfillmentShipped}`}
          />
          <SummaryCard
            icon="inventory"
            label="Delivered"
            value={`${summary.fulfillmentDelivered}`}
            sub="Completed"
            accent="text-green-700"
            online={`${summary.breakdown.online.fulfillmentDelivered}`}
            offline={`${summary.breakdown.offline.fulfillmentDelivered}`}
          />
          <SummaryCard
            icon="cancel"
            label="Cancelled"
            value={`${summary.fulfillmentCancelled}`}
            sub="Cancelled orders"
            accent="text-red-700"
            online={`${summary.breakdown.online.fulfillmentCancelled}`}
            offline={`${summary.breakdown.offline.fulfillmentCancelled}`}
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
            <option value="failed">Failed</option>
            <option value="expired">Expired</option>
            <option value="partially_refunded">Partially refunded</option>
            <option value="refunded">Refunded</option>
            <option value="disputed">Disputed</option>
          </select>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className={selectClass}
          >
            <option value="">All methods</option>
            <option value="stripe">Card (Stripe)</option>
            <option value="interac">e-Transfer</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
          {(filterFrom || filterTo || filterType || filterStatus || filterMethod) && (
            <button
              onClick={() => {
                setFilterFrom("");
                setFilterTo("");
                setFilterType("");
                setFilterStatus("");
                setFilterMethod("");
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
              <th className="px-4 py-3.5 font-semibold text-primary text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {sales.map((s) => {
              const addr = addressLines(s.shipping_address);
              return (
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
                  {addr.length > 0 && (
                    <div className="text-on-surface-variant text-xs mt-0.5 flex items-start gap-1 max-w-[15rem]">
                      <span className="material-symbols-outlined text-sm leading-4 shrink-0">location_on</span>
                      <span>{addr.join(", ")}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-on-surface">
                  ${saleTotal(s).toFixed(2)}
                  {Number(s.tax_amount ?? 0) > 0 && (
                    <div className="text-[10px] font-normal text-on-surface-variant">
                      incl. ${Number(s.tax_amount).toFixed(2)} tax
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 capitalize text-on-surface-variant text-xs font-medium">
                  {s.payment_method}
                  {Number(s.amount_refunded ?? 0) > 0 && (
                    <div className="text-[10px] text-red-700">
                      -${Number(s.amount_refunded).toFixed(2)} refunded
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  {isStripeLocked(s) ? (
                    <span
                      className={`inline-block px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize ${statusBadge[s.payment_status] || ""}`}
                      title="Set by Stripe — use Refund to adjust"
                    >
                      {statusLabel(s.payment_status)} 🔒
                    </span>
                  ) : (
                    <select
                      value={s.payment_status}
                      onChange={(e) => updateSale(s.id, "paymentStatus", e.target.value)}
                      className={`${selectClass} ${statusBadge[s.payment_status] || ""}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                      {!["pending", "paid", "refunded"].includes(s.payment_status) && (
                        <option value={s.payment_status} disabled>
                          {statusLabel(s.payment_status)}
                        </option>
                      )}
                    </select>
                  )}
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
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    {isPayable(s) && (
                      <button
                        onClick={() => setQrSale(s)}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                        title="Payment QR / link"
                      >
                        <span className="material-symbols-outlined text-lg">qr_code_2</span>
                      </button>
                    )}
                    {isStripeLocked(s) &&
                      ["paid", "partially_refunded"].includes(s.payment_status) && (
                        <button
                          onClick={() => refundSale(s)}
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-orange-700 transition-colors"
                          title="Refund via Stripe"
                        >
                          <span className="material-symbols-outlined text-lg">currency_exchange</span>
                        </button>
                      )}
                    <button
                      onClick={() => downloadInvoice(s)}
                      className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                      title="Download invoice PDF"
                    >
                      <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                    </button>
                    <button
                      onClick={() => sendInvoice(s)}
                      className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                      title={isPayable(s) ? "Email invoice + payment link" : "Email invoice"}
                    >
                      <span className="material-symbols-outlined text-lg">forward_to_inbox</span>
                    </button>
                    {s.fulfillment === "cancelled" && (
                      <button
                        onClick={() => recreateOrder(s)}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                        title="Recreate order (ledger balance)"
                      >
                        <span className="material-symbols-outlined text-lg">restart_alt</span>
                      </button>
                    )}
                    <button
                      onClick={() => setEditingSale({ ...s })}
                      className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => deleteSale(s.id, s.order_number)}
                      className="p-1.5 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
            {sales.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-on-surface-variant">
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
          const addr = addressLines(s.shipping_address);
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
                  <div className="text-on-surface font-bold">${saleTotal(s).toFixed(2)}</div>
                  {Number(s.tax_amount ?? 0) > 0 && (
                    <div className="text-[10px] text-on-surface-variant">
                      incl. ${Number(s.tax_amount).toFixed(2)} tax
                    </div>
                  )}
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 capitalize ${statusBadge[s.payment_status] || ""}`}>
                    {statusLabel(s.payment_status)}
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
                  {addr.length > 0 && (
                    <div className="text-sm">
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Shipping address</p>
                      <div className="text-on-surface not-italic">
                        {addr.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
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
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {isPayable(s) && (
                      <button
                        onClick={() => setQrSale(s)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">qr_code_2</span>
                        Pay QR / link
                      </button>
                    )}
                    {isStripeLocked(s) &&
                      ["paid", "partially_refunded"].includes(s.payment_status) && (
                        <button
                          onClick={() => refundSale(s)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-orange-600 text-orange-700 text-sm font-semibold hover:bg-orange-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">currency_exchange</span>
                          Refund
                        </button>
                      )}
                    <button
                      onClick={() => downloadInvoice(s)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-outline text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                      Invoice
                    </button>
                    <button
                      onClick={() => sendInvoice(s)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-outline text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">forward_to_inbox</span>
                      {isPayable(s) ? "Send link" : "Send invoice"}
                    </button>
                    {s.fulfillment === "cancelled" && (
                      <button
                        onClick={() => recreateOrder(s)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">restart_alt</span>
                        Recreate
                      </button>
                    )}
                    <button
                      onClick={() => setEditingSale({ ...s })}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSale(s.id, s.order_number)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-error text-error text-sm font-semibold hover:bg-error-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Edit modal ── */}
      {editingSale && (
        <EditSaleModal
          sale={editingSale}
          onChange={setEditingSale}
          onSave={() => saveEdit(editingSale)}
          onCancel={() => setEditingSale(null)}
        />
      )}

      {/* ── Payment QR modal ── */}
      {qrSale && (
        <PaymentQrModal sale={qrSale} onClose={() => setQrSale(null)} />
      )}
    </div>
  );
}

// Fetches a payment QR + pay link for an order and lets the admin show it in
// person or copy the link to send. Uses the server QR endpoint so the link
// always resolves to the public /pay/<token> page.
function PaymentQrModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const toast = useToast();
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ready"; svg: string; url: string }
  >({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/sales/${sale.id}/qr`)
      .then(async (res) => {
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setState({ status: "error", message: data.error || "Could not generate QR." });
        } else {
          setState({ status: "ready", svg: data.svg, url: data.url });
        }
      })
      .catch(() => active && setState({ status: "error", message: "Could not generate QR." }));
    return () => {
      active = false;
    };
  }, [sale.id]);

  function copyLink() {
    if (state.status !== "ready") return;
    navigator.clipboard.writeText(state.url).then(
      () => toast("Payment link copied.", "success"),
      () => toast("Copy failed — select the link manually.", "error"),
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-background/50" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-xl shadow-botanical-lg border border-outline-variant w-full max-w-sm p-6 space-y-4 text-center">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-lg text-primary font-bold">
            Pay {sale.order_number}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary text-2xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-on-surface-variant">
          Scan to pay ${saleTotal(sale).toFixed(2)} by card, or share the link.
        </p>

        {state.status === "loading" && (
          <div className="py-16 text-sm text-on-surface-variant">Generating QR…</div>
        )}
        {state.status === "error" && (
          <div className="py-8 text-sm text-error">{state.message}</div>
        )}
        {state.status === "ready" && (
          <>
            <div
              className="mx-auto w-56 h-56 [&>svg]:w-full [&>svg]:h-full"
              // QR SVG is generated server-side by the qrcode library from a
              // trusted URL — not user input.
              dangerouslySetInnerHTML={{ __html: state.svg }}
            />
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={state.url}
                className="flex-1 text-xs font-mono bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 overflow-x-auto"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyLink}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90"
              >
                Copy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EditSaleModal({
  sale,
  onChange,
  onSave,
  onCancel,
}: {
  sale: Sale;
  onChange: (s: Sale) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const fieldClass =
    "w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass =
    "block text-[10px] font-semibold text-primary uppercase tracking-widest mb-1";

  // Recompute subtotal/tax/total whenever line items change, using the sale's
  // existing tax rate so PST stays proportional after edits.
  function recompute(items: SaleItem[]): Partial<Sale> {
    const subtotal = +items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2);
    const taxRate = Number(sale.tax_rate ?? 0);
    const tax_amount = +(subtotal * taxRate).toFixed(2);
    const total = +(subtotal + tax_amount).toFixed(2);
    return { items, subtotal, tax_amount, total };
  }

  function updateItem(idx: number, field: string, value: string | number) {
    const items = [...(sale.items as SaleItem[])];
    items[idx] = { ...items[idx], [field]: value };
    onChange({ ...sale, ...recompute(items) });
  }

  function addItem() {
    const items = [...(sale.items as SaleItem[]), { productName: "", quantity: 1, unitPrice: 0 }];
    onChange({ ...sale, items });
  }

  function removeItem(idx: number) {
    const items = (sale.items as SaleItem[]).filter((_, i) => i !== idx);
    onChange({ ...sale, ...recompute(items) });
  }

  function updateAddress(field: keyof ShippingAddress, value: string) {
    const current: ShippingAddress = sale.shipping_address ?? {};
    onChange({ ...sale, shipping_address: { ...current, [field]: value } as ShippingAddress });
  }

  const addr: ShippingAddress = sale.shipping_address ?? {};
  const locked = isStripeLocked(sale);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-background/50" onClick={onCancel} />
      <div className="relative bg-surface-container-lowest rounded-xl shadow-botanical-lg border border-outline-variant w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-xl text-primary font-bold">
            Edit {sale.order_number}
          </h2>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-primary text-2xl">&times;</button>
        </div>

        {locked && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-4 py-3 text-sm">
            <span className="material-symbols-outlined text-lg leading-5">lock</span>
            <span>
              This order was paid through Stripe, so its items, amounts and
              payment status mirror the actual charge and can&apos;t be edited
              here. You can still update contact details, address, fulfillment
              and notes. To change what was charged, issue a{" "}
              <strong>Refund</strong> from the ledger.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Customer name *</label>
            <input
              value={sale.customer_name}
              onChange={(e) => onChange({ ...sale, customer_name: e.target.value })}
              className={fieldClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={sale.customer_email || ""}
              onChange={(e) => onChange({ ...sale, customer_email: e.target.value || null })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              value={sale.customer_phone || ""}
              onChange={(e) => onChange({ ...sale, customer_phone: e.target.value || null })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Payment method</label>
            <select
              value={sale.payment_method}
              onChange={(e) => onChange({ ...sale, payment_method: e.target.value })}
              className={fieldClass}
              disabled={locked}
            >
              <option value="cash">Cash</option>
              <option value="interac">Interac</option>
              <option value="stripe">Stripe</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Payment status</label>
            <select
              value={sale.payment_status}
              onChange={(e) => onChange({ ...sale, payment_status: e.target.value })}
              className={fieldClass}
              disabled={locked}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              {!["pending", "paid", "refunded"].includes(sale.payment_status) && (
                <option value={sale.payment_status} disabled>
                  {statusLabel(sale.payment_status)}
                </option>
              )}
            </select>
          </div>
          <div>
            <label className={labelClass}>Fulfillment</label>
            <select
              value={sale.fulfillment}
              onChange={(e) => onChange({ ...sale, fulfillment: e.target.value })}
              className={fieldClass}
            >
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Shipping address</label>
          <input
            value={addr.line1 ?? ""}
            onChange={(e) => updateAddress("line1", e.target.value)}
            className={fieldClass}
            placeholder="Address line 1"
          />
          <input
            value={addr.line2 ?? ""}
            onChange={(e) => updateAddress("line2", e.target.value)}
            className={fieldClass}
            placeholder="Address line 2 (optional)"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={addr.city ?? ""}
              onChange={(e) => updateAddress("city", e.target.value)}
              className={fieldClass}
              placeholder="City"
            />
            <input
              value={addr.state ?? ""}
              onChange={(e) => updateAddress("state", e.target.value)}
              className={fieldClass}
              placeholder="Province / State"
            />
            <input
              value={addr.postalCode ?? ""}
              onChange={(e) => updateAddress("postalCode", e.target.value)}
              className={fieldClass}
              placeholder="Postal code"
            />
            <input
              value={addr.country ?? ""}
              onChange={(e) => updateAddress("country", e.target.value)}
              className={fieldClass}
              placeholder="Country"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Items</label>
          {(sale.items as SaleItem[]).map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input
                value={item.productName}
                onChange={(e) => updateItem(idx, "productName", e.target.value)}
                className={`${fieldClass} col-span-6`}
                placeholder="Product name"
                disabled={locked}
              />
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                className={`${fieldClass} col-span-2 text-center`}
                disabled={locked}
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={item.unitPrice || ""}
                onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                className={`${fieldClass} col-span-3`}
                disabled={locked}
              />
              {!locked && (
                <button
                  onClick={() => removeItem(idx)}
                  className="col-span-1 text-error hover:text-on-error-container text-lg text-center"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          {!locked && (
            <button onClick={addItem} className="text-sm text-primary font-semibold hover:underline">
              + Add item
            </button>
          )}
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={sale.notes || ""}
            onChange={(e) => onChange({ ...sale, notes: e.target.value || null })}
            rows={2}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-2 border-t border-outline-variant">
          <div className="text-sm space-y-0.5">
            <p className="text-on-surface-variant">Subtotal: <span className="text-on-surface font-medium">${Number(sale.subtotal ?? 0).toFixed(2)}</span></p>
            <p className="text-on-surface-variant">Tax: <span className="text-on-surface font-medium">${Number(sale.tax_amount ?? 0).toFixed(2)}</span></p>
            <p className="text-lg font-bold text-primary">Total: ${saleTotal(sale).toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg border border-outline text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Save changes
            </button>
          </div>
        </div>
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
  online,
  offline,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  accent?: string;
  online?: string;
  offline?: string;
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
      {(online !== undefined || offline !== undefined) && (
        <div className="mt-3 pt-3 border-t border-outline-variant/50 grid grid-cols-2 gap-2 text-xs">
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-on-surface-variant text-[10px] uppercase tracking-wider font-semibold">
              <span className="material-symbols-outlined text-xs">language</span>
              Online
            </span>
            <span className="text-on-surface font-semibold">{online ?? "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-on-surface-variant text-[10px] uppercase tracking-wider font-semibold">
              <span className="material-symbols-outlined text-xs">storefront</span>
              Offline
            </span>
            <span className="text-on-surface font-semibold">{offline ?? "—"}</span>
          </div>
        </div>
      )}
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
