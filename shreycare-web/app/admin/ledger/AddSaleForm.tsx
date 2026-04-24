"use client";

import { useState } from "react";

interface LineItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

const fieldClass =
  "w-full px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function generateOrderNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SC-${code}`;
}

// Returns current local date-time formatted for <input type="datetime-local">
function nowLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddSaleForm({ onDone }: { onDone: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+1 ");
  const [saleDate, setSaleDate] = useState(nowLocal());
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [items, setItems] = useState<LineItem[]>([{ productName: "", quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { productName: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/admin/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: generateOrderNumber(),
        type: "offline",
        date: new Date(saleDate).toISOString(),
        customerName,
        customerEmail: customerEmail.trim() || null,
        customerPhone: customerPhone.trim() && customerPhone.trim() !== "+1" ? customerPhone.trim() : null,
        items: items.filter((i) => i.productName),
        subtotal,
        paymentMethod,
        paymentStatus,
        fulfillment: "delivered",
        notes: notes || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save.");
      setSubmitting(false);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 space-y-5">
      <h2 className="font-headline text-xl text-primary font-bold">Add offline sale</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Customer name <span className="text-error">*</span>
          </label>
          <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Date &amp; time
          </label>
          <input
            type="datetime-local"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Email <span className="text-on-surface-variant font-normal normal-case">(optional — sends receipt)</span>
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className={fieldClass}
            placeholder="customer@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Phone <span className="text-on-surface-variant font-normal normal-case">(optional)</span>
          </label>
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-1">Payment method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={fieldClass}>
            <option value="cash">Cash</option>
            <option value="interac">Interac</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-1">Payment status</label>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={fieldClass}>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-primary uppercase tracking-widest">Items</label>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <input
              placeholder="Product name"
              value={item.productName}
              onChange={(e) => updateItem(idx, "productName", e.target.value)}
              className={`${fieldClass} col-span-6`}
              required
            />
            <input
              type="number"
              min={1}
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
              className={`${fieldClass} col-span-2 text-center`}
            />
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="Price"
              value={item.unitPrice || ""}
              onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
              className={`${fieldClass} col-span-3`}
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="col-span-1 text-error hover:text-on-error-container text-lg text-center"
              aria-label="Remove item"
            >
              &times;
            </button>
          </div>
        ))}
        <button type="button" onClick={addItem} className="text-sm text-primary font-semibold hover:underline">
          + Add item
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-1">Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={fieldClass} />
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-lg font-bold text-primary">Subtotal: ${subtotal.toFixed(2)}</p>
        {error && <p className="text-error text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-on-primary px-8 py-2.5 rounded-md font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save sale"}
        </button>
      </div>
    </form>
  );
}
