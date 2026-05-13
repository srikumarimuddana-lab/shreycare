"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

interface Customer {
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

interface OrderRow {
  id: string;
  order_number: string;
  sale_date: string;
  payment_status: string;
  fulfillment: string;
  type: "online" | "offline";
  payment_method: string;
  subtotal: number | string | null;
  tax_amount: number | string | null;
  total: number | string | null;
  items: Array<{ productName: string; quantity: number; unitPrice: number }> | null;
  notes: string | null;
}

const SEGMENT_OPTIONS = [
  "",
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

const fieldClass =
  "w-full px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function CustomerDetail({ emailParam }: { emailParam: string }) {
  const router = useRouter();
  const toast = useToast();
  const email = decodeURIComponent(emailParam);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [segmentOverride, setSegmentOverride] = useState("");
  const [tagInput, setTagInput] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}`);
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      toast("Failed to load customer.", "error");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCustomer(data.customer);
    setOrders(data.orders);
    if (data.customer) {
      setName(data.customer.name ?? "");
      setPhone(data.customer.phone ?? "");
      setNotes(data.customer.notes ?? "");
      setTags(data.customer.tags ?? []);
      setSegmentOverride(data.customer.segmentOverride ?? "");
    }
    setLoading(false);
  }, [email, router, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function save(updates: Record<string, unknown>) {
    const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      toast("Save failed.", "error");
      return false;
    }
    toast("Saved.", "success");
    return true;
  }

  async function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    await save({ tags: next });
  }

  async function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    await save({ tags: next });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-24">
        <span className="material-symbols-outlined text-5xl text-outline mb-2 block">person_off</span>
        <p className="text-on-surface-variant">No customer found for {email}.</p>
        <Link href="/admin/customers" className="text-primary font-semibold hover:underline mt-4 inline-block">
          ← Back to customers
        </Link>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/customers" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          All customers
        </Link>
        <SegmentBadge seg={customer.effectiveSegment} large />
      </div>

      {/* Header card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <div>
              <Label>Name</Label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => save({ name })}
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <input value={customer.email} readOnly className={`${fieldClass} text-on-surface-variant`} />
              </div>
              <div>
                <Label>Phone</Label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => save({ phone })}
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <a
              href={`mailto:${customer.email}`}
              className="border border-primary text-primary px-4 py-2 rounded-lg font-bold text-sm text-center hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              Email
            </a>
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="border border-primary text-primary px-4 py-2 rounded-lg font-bold text-sm text-center hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">call</span>
                Call
              </a>
            )}
          </div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <Tile label="Total spent" value={`$${customer.totalSpent.toFixed(2)}`} accent="text-primary" />
        <Tile label="Orders" value={`${customer.totalOrders}`} sub={`${customer.paidOrders} paid`} />
        <Tile label="AOV" value={`$${customer.averageOrderValue.toFixed(2)}`} accent="text-secondary" />
        <Tile label="First order" value={new Date(customer.firstOrderDate).toLocaleDateString("en-CA")} />
        <Tile label="Last order" value={new Date(customer.lastOrderDate).toLocaleDateString("en-CA")} />
        <Tile
          label="Days since"
          value={`${customer.daysSinceLastOrder}`}
          accent={customer.daysSinceLastOrder > 90 ? "text-red-700" : "text-on-surface"}
          sub={customer.daysSinceLastOrder > 90 ? "Churn risk" : "Active"}
        />
      </div>

      {/* RFM scores */}
      {customer.recencyScore !== undefined && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <h2 className="font-headline text-sm uppercase tracking-widest text-primary font-bold mb-3">RFM scores</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <ScoreCircle label="Recency" score={customer.recencyScore} />
            <ScoreCircle label="Frequency" score={customer.frequencyScore ?? 0} />
            <ScoreCircle label="Monetary" score={customer.monetaryScore ?? 0} />
          </div>
        </div>
      )}

      {/* Tags & notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <h2 className="font-headline text-sm uppercase tracking-widest text-primary font-bold mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-semibold">
                {t}
                <button
                  onClick={() => removeTag(t)}
                  className="hover:text-error"
                  aria-label={`Remove ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
            {tags.length === 0 && <p className="text-xs text-on-surface-variant">No tags yet.</p>}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="vip, wholesale, b2b..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className={`${fieldClass} flex-1`}
            />
            <button
              onClick={addTag}
              className="px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-semibold hover:opacity-90"
            >
              Add
            </button>
          </div>
          <div className="mt-4">
            <Label>Segment override</Label>
            <select
              value={segmentOverride}
              onChange={(e) => {
                const v = e.target.value;
                setSegmentOverride(v);
                save({ segmentOverride: v });
              }}
              className={fieldClass}
            >
              {SEGMENT_OPTIONS.map((s) => (
                <option key={s || "auto"} value={s}>
                  {s ? s : `Use computed (${customer.segment ?? "Others"})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <h2 className="font-headline text-sm uppercase tracking-widest text-primary font-bold mb-3">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => save({ notes })}
            rows={6}
            placeholder="Internal notes about this customer..."
            className={fieldClass}
          />
          <p className="text-[10px] text-on-surface-variant mt-1">Saved on blur.</p>
        </div>
      </div>

      {/* Order history */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <h2 className="font-headline text-sm uppercase tracking-widest text-primary font-bold">
            Order history
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-primary">Order</th>
                <th className="px-4 py-3 font-semibold text-primary">Date</th>
                <th className="px-4 py-3 font-semibold text-primary">Type</th>
                <th className="px-4 py-3 font-semibold text-primary text-right">Items</th>
                <th className="px-4 py-3 font-semibold text-primary text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-primary">Payment</th>
                <th className="px-4 py-3 font-semibold text-primary">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {orders.map((o) => {
                const t = Number(o.total ?? 0) > 0
                  ? Number(o.total)
                  : Number(o.subtotal ?? 0) + Number(o.tax_amount ?? 0);
                const itemCount = (o.items ?? []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
                return (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{o.order_number}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">
                      {new Date(o.sale_date).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-3 capitalize text-xs">{o.type}</td>
                    <td className="px-4 py-3 text-right">{itemCount}</td>
                    <td className="px-4 py-3 text-right font-bold">${t.toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge label={o.payment_status} /></td>
                    <td className="px-4 py-3"><StatusBadge label={o.fulfillment} /></td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant">No orders.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  accent = "text-on-surface",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 sm:p-4">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">{label}</p>
      <p className={`text-lg sm:text-xl font-bold ${accent} mt-1`}>{value}</p>
      {sub && <p className="text-[10px] text-on-surface-variant mt-0.5">{sub}</p>}
    </div>
  );
}

function ScoreCircle({ label, score }: { label: string; score: number }) {
  const color =
    score >= 4 ? "text-green-700 bg-green-100" : score >= 3 ? "text-secondary bg-secondary/15" : "text-yellow-700 bg-yellow-100";
  return (
    <div>
      <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${color} text-xl font-bold`}>
        {score}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mt-2">{label}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold text-primary uppercase tracking-widest mb-1">
      {children}
    </label>
  );
}

function SegmentBadge({ seg, large = false }: { seg: string; large?: boolean }) {
  const className = segmentColors[seg] ?? segmentColors.Others;
  return (
    <span className={`inline-block ${large ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]"} rounded-full font-bold uppercase tracking-wider ${className}`}>
      {seg}
    </span>
  );
}

function StatusBadge({ label }: { label: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    refunded: "bg-red-100 text-red-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${map[label] ?? "bg-surface-container text-on-surface-variant"}`}>
      {label}
    </span>
  );
}
