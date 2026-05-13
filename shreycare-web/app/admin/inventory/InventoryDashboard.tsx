"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

interface PerProductRow {
  productId: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  costPrice: number;
  unitLabel: string;
  totalUnitsSold: number;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  margin: number;
  isLowStock: boolean;
}

interface UnmatchedProduct {
  name: string;
  unitsSold: number;
  revenue: number;
}

interface InventorySummary {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  profitMargin: number;
  roi: number;
  totalInventoryValue: number;
  lowStockCount: number;
  perProduct: PerProductRow[];
  unmatchedProducts: UnmatchedProduct[];
}

interface SanityProduct {
  _id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface InventoryProduct {
  id: string;
  name: string;
  sanity_id: string | null;
  cost_price: number;
  current_stock: number;
  reorder_point: number;
  unit_label: string;
  is_active: boolean;
}

const fieldClass =
  "w-full px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function InventoryDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddPO, setShowAddPO] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);

  const fetchAll = useCallback(async () => {
    const [sumRes, prodRes] = await Promise.all([
      fetch("/api/admin/inventory/summary"),
      fetch("/api/admin/inventory/products"),
    ]);

    if (sumRes.status === 401 || prodRes.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (sumRes.ok) setSummary(await sumRes.json());
    if (prodRes.ok) setProducts(await prodRes.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-on-surface-variant text-sm">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card icon="payments" label="Revenue (paid)" value={`$${summary.totalRevenue.toFixed(2)}`} sub="From paid sales" />
            <Card icon="local_atm" label="COGS" value={`$${summary.totalCOGS.toFixed(2)}`} sub="Cost of goods sold" accent="text-on-surface-variant" />
            <Card icon="trending_up" label="Gross profit" value={`$${summary.grossProfit.toFixed(2)}`} sub={`Margin ${summary.profitMargin.toFixed(1)}%`} accent="text-green-700" />
            <Card icon="percent" label="ROI" value={`${summary.roi.toFixed(1)}%`} sub="(profit / COGS)" accent="text-secondary" />
            <Card icon="warehouse" label="Stock value" value={`$${summary.totalInventoryValue.toFixed(2)}`} sub="On hand at cost" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card icon="inventory_2" label="Products tracked" value={`${products.length}`} sub="Active" />
            <Card
              icon="warning"
              label="Low stock alerts"
              value={`${summary.lowStockCount}`}
              sub={summary.lowStockCount > 0 ? "Needs restocking" : "All good"}
              accent={summary.lowStockCount > 0 ? "text-yellow-700" : "text-green-700"}
            />
            <Card icon="sell" label="Avg margin" value={`${summary.profitMargin.toFixed(1)}%`} sub="On paid sales" />
          </div>

          {summary.unmatchedProducts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <span className="material-symbols-outlined text-yellow-700 shrink-0">warning</span>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-semibold text-yellow-900">Unmatched products in sales</p>
                <p className="text-yellow-800/80 mt-0.5">
                  These names appear in sales but have no inventory record — their revenue is counted but their COGS is $0, inflating margin.
                </p>
                <ul className="mt-2 space-y-0.5">
                  {summary.unmatchedProducts.slice(0, 8).map((u) => (
                    <li key={u.name} className="text-xs text-yellow-900">
                      <span className="font-mono">{u.name}</span> — sold {u.unitsSold}, revenue ${u.revenue.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Add product
          </button>
          <button
            onClick={() => {
              if (products.length === 0) {
                toast("Add a product first.", "error");
                return;
              }
              setShowAddPO(true);
            }}
            className="border border-primary text-primary px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/5 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add_box</span>
            Record purchase order
          </button>
        </div>
        <Link
          href="/admin/inventory/purchases"
          className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
        >
          Purchase history
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>

      {/* Product/ROI table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-botanical">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-primary">Product</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Stock</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Reorder</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Cost</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Sold</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Revenue</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">COGS</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Profit</th>
              <th className="px-4 py-3 font-semibold text-primary text-right">Margin</th>
              <th className="px-4 py-3 font-semibold text-primary text-center">Status</th>
              <th className="px-4 py-3 font-semibold text-primary text-center">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {summary?.perProduct.map((row) => {
              const product = products.find((p) => p.id === row.productId);
              return (
                <tr key={row.productId} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-on-surface">{row.name}</td>
                  <td className="px-4 py-3 text-right font-bold">{row.currentStock}</td>
                  <td className="px-4 py-3 text-right text-on-surface-variant">{row.reorderPoint}</td>
                  <td className="px-4 py-3 text-right">${row.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{row.totalUnitsSold}</td>
                  <td className="px-4 py-3 text-right">${row.totalRevenue.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-on-surface-variant">${row.totalCOGS.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">${row.grossProfit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{row.margin.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center"><StockBadge stock={row.currentStock} reorder={row.reorderPoint} /></td>
                  <td className="px-4 py-3 text-center">
                    {product && (
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {(!summary || summary.perProduct.length === 0) && (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2 block">inventory_2</span>
                  No products tracked yet. Click &quot;Add product&quot; above to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddProduct && (
        <AddProductModal
          existingNames={products.map((p) => p.name.toLowerCase())}
          onCancel={() => setShowAddProduct(false)}
          onSaved={() => {
            setShowAddProduct(false);
            toast("Product added.", "success");
            fetchAll();
          }}
        />
      )}

      {showAddPO && (
        <AddPurchaseOrderModal
          products={products}
          onCancel={() => setShowAddPO(false)}
          onSaved={() => {
            setShowAddPO(false);
            toast("Purchase order recorded.", "success");
            fetchAll();
          }}
        />
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onCancel={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null);
            toast("Product updated.", "success");
            fetchAll();
          }}
        />
      )}
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

function StockBadge({ stock, reorder }: { stock: number; reorder: number }) {
  if (stock <= 0) {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">OUT</span>;
  }
  if (stock <= reorder) {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800">LOW</span>;
  }
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">OK</span>;
}

function AddProductModal({
  existingNames,
  onCancel,
  onSaved,
}: {
  existingNames: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [sanityProducts, setSanityProducts] = useState<SanityProduct[]>([]);
  const [name, setName] = useState("");
  const [sanityId, setSanityId] = useState<string | null>(null);
  const [costPrice, setCostPrice] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);
  const [reorderPoint, setReorderPoint] = useState(5);
  const [unitLabel, setUnitLabel] = useState("units");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/inventory/sanity-products")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSanityProducts)
      .catch(() => setSanityProducts([]));
  }, []);

  function pickSanity(id: string) {
    const p = sanityProducts.find((x) => x._id === id);
    if (p) {
      setSanityId(p._id);
      setName(p.name);
    } else {
      setSanityId(null);
    }
  }

  async function submit() {
    if (!name.trim()) {
      toast("Name required.", "error");
      return;
    }
    if (existingNames.includes(name.trim().toLowerCase())) {
      toast("A product with that name already exists.", "error");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/inventory/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        sanityId,
        costPrice,
        currentStock,
        reorderPoint,
        unitLabel,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Failed to add product.", "error");
      return;
    }
    onSaved();
  }

  return (
    <Modal title="Add product" onClose={onCancel}>
      <div className="space-y-4">
        <div>
          <Label>Pick from Sanity (optional)</Label>
          <select
            value={sanityId ?? ""}
            onChange={(e) => pickSanity(e.target.value)}
            className={fieldClass}
          >
            <option value="">— Type name manually —</option>
            {sanityProducts.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} (${p.price})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-on-surface-variant mt-1">
            Picking here keeps the name in sync with what online checkout records.
          </p>
        </div>

        <div>
          <Label>Product name *</Label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            placeholder="Coconut Hair Oil"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Cost per unit ($)</Label>
            <input
              type="number"
              step={0.01}
              min={0}
              value={costPrice || ""}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              className={fieldClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Initial stock</Label>
            <input
              type="number"
              min={0}
              value={currentStock || ""}
              onChange={(e) => setCurrentStock(Number(e.target.value))}
              className={fieldClass}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Reorder point</Label>
            <input
              type="number"
              min={0}
              value={reorderPoint || ""}
              onChange={(e) => setReorderPoint(Number(e.target.value))}
              className={fieldClass}
              placeholder="5"
            />
          </div>
          <div>
            <Label>Unit label</Label>
            <input
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              className={fieldClass}
              placeholder="bottles"
            />
          </div>
        </div>

        <ModalActions onCancel={onCancel} onSubmit={submit} submitting={submitting} submitLabel="Add product" />
      </div>
    </Modal>
  );
}

function EditProductModal({
  product,
  onCancel,
  onSaved,
}: {
  product: InventoryProduct;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [costPrice, setCostPrice] = useState(Number(product.cost_price));
  const [currentStock, setCurrentStock] = useState(product.current_stock);
  const [reorderPoint, setReorderPoint] = useState(product.reorder_point);
  const [unitLabel, setUnitLabel] = useState(product.unit_label);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const res = await fetch("/api/admin/inventory/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: product.id,
        costPrice,
        currentStock,
        reorderPoint,
        unitLabel,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast("Update failed.", "error");
      return;
    }
    onSaved();
  }

  async function deactivate() {
    if (!confirm(`Deactivate "${product.name}"? It will be hidden but transactions are kept.`)) return;
    const res = await fetch("/api/admin/inventory/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id }),
    });
    if (res.ok) {
      toast("Product deactivated.", "success");
      onSaved();
    } else {
      toast("Failed to deactivate.", "error");
    }
  }

  return (
    <Modal title={`Edit ${product.name}`} onClose={onCancel}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Cost per unit ($)</Label>
            <input
              type="number"
              step={0.01}
              min={0}
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              className={fieldClass}
            />
            <p className="text-[10px] text-on-surface-variant mt-1">
              Auto-recomputed from POs as weighted avg. Manual override OK.
            </p>
          </div>
          <div>
            <Label>Current stock</Label>
            <input
              type="number"
              value={currentStock}
              onChange={(e) => setCurrentStock(Number(e.target.value))}
              className={fieldClass}
            />
            <p className="text-[10px] text-on-surface-variant mt-1">
              Manual changes log a stock_transaction entry.
            </p>
          </div>
          <div>
            <Label>Reorder point</Label>
            <input
              type="number"
              min={0}
              value={reorderPoint}
              onChange={(e) => setReorderPoint(Number(e.target.value))}
              className={fieldClass}
            />
          </div>
          <div>
            <Label>Unit label</Label>
            <input
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant">
          <button
            onClick={deactivate}
            className="text-error text-sm font-semibold hover:underline"
          >
            Deactivate
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-lg border border-outline text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AddPurchaseOrderModal({
  products,
  onCancel,
  onSaved,
}: {
  products: InventoryProduct[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [orderedAt, setOrderedAt] = useState(new Date().toISOString().slice(0, 10));
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!productId) {
      toast("Pick a product.", "error");
      return;
    }
    if (!quantity || quantity <= 0) {
      toast("Quantity must be > 0.", "error");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/inventory/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, unitCost, orderedAt, supplier, notes }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Failed to record PO.", "error");
      return;
    }
    onSaved();
  }

  const totalCost = quantity * unitCost;

  return (
    <Modal title="Record purchase order" onClose={onCancel}>
      <div className="space-y-4">
        <div>
          <Label>Product *</Label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={fieldClass}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — current stock {p.current_stock}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Quantity *</Label>
            <input
              type="number"
              min={1}
              value={quantity || ""}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={fieldClass}
            />
          </div>
          <div>
            <Label>Unit cost ($)</Label>
            <input
              type="number"
              step={0.01}
              min={0}
              value={unitCost || ""}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className={fieldClass}
            />
          </div>
          <div>
            <Label>Date</Label>
            <input
              type="date"
              value={orderedAt}
              onChange={(e) => setOrderedAt(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <Label>Supplier (optional)</Label>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className={fieldClass}
              placeholder="Name or vendor"
            />
          </div>
        </div>

        <div>
          <Label>Notes (optional)</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={fieldClass}
          />
        </div>

        <div className="bg-surface-container rounded-md px-3 py-2 text-sm flex items-center justify-between">
          <span className="text-on-surface-variant">Total cost</span>
          <span className="font-bold text-primary">${totalCost.toFixed(2)}</span>
        </div>

        <ModalActions onCancel={onCancel} onSubmit={submit} submitting={submitting} submitLabel="Record PO" />
      </div>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-background/50" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-xl shadow-botanical-lg border border-outline-variant w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl text-primary font-bold">{title}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary text-2xl" aria-label="Close">&times;</button>
        </div>
        {children}
      </div>
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

function ModalActions({
  onCancel,
  onSubmit,
  submitting,
  submitLabel,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
      <button
        onClick={onCancel}
        className="px-5 py-2 rounded-lg border border-outline text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={submitting}
        className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
