"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

interface PORow {
  id: string;
  product_id: string;
  product_name: string;
  unit_label: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  ordered_at: string;
  supplier: string | null;
  notes: string | null;
  created_at: string;
}

export function PurchaseOrdersView() {
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState<PORow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const res = await fetch("/api/admin/inventory/purchase-orders");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function deletePO(po: PORow) {
    if (!confirm(`Delete PO for ${po.product_name} (${po.quantity} units)? Stock will NOT be reversed.`)) return;
    const res = await fetch("/api/admin/inventory/purchase-orders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: po.id }),
    });
    if (res.ok) {
      toast("PO deleted. Stock unchanged.", "info");
      fetchAll();
    } else {
      toast("Delete failed.", "error");
    }
  }

  const totalSpend = orders.reduce((s, p) => s + Number(p.total_cost), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-on-surface-variant text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Total restocking spend</p>
          <p className="text-2xl font-bold text-primary">${totalSpend.toFixed(2)}</p>
          <p className="text-xs text-on-surface-variant">Across {orders.length} purchase orders</p>
        </div>
        <Link
          href="/admin/inventory"
          className="border border-primary text-primary px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/5 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Inventory
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-primary">Date</th>
              <th className="px-4 py-3 font-semibold text-primary">Product</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Qty</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Unit cost</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Total</th>
              <th className="px-4 py-3 font-semibold text-primary">Supplier</th>
              <th className="px-4 py-3 font-semibold text-primary">Notes</th>
              <th className="px-4 py-3 font-semibold text-primary text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {orders.map((po) => (
              <tr key={po.id} className="hover:bg-surface-container-low/50">
                <td className="px-4 py-3 whitespace-nowrap">{new Date(po.ordered_at).toLocaleDateString("en-CA")}</td>
                <td className="px-4 py-3 font-medium">{po.product_name}</td>
                <td className="px-4 py-3 text-right font-bold">{po.quantity}</td>
                <td className="px-4 py-3 text-right">${Number(po.unit_cost).toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-semibold">${Number(po.total_cost).toFixed(2)}</td>
                <td className="px-4 py-3 text-on-surface-variant">{po.supplier || "—"}</td>
                <td className="px-4 py-3 text-on-surface-variant text-xs max-w-xs truncate">{po.notes || ""}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => deletePO(po)}
                    className="p-1.5 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2 block">receipt_long</span>
                  No purchase orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
