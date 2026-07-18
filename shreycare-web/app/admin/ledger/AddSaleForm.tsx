"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { SK_PST_RATE } from "@/lib/cart/tax";
import {
  ProductCombobox,
  useAdminProducts,
  type ProductOption,
} from "@/components/admin/ProductCombobox";

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

// A freshly-created order row, enough for the ledger to pop a payment QR for
// it right after saving.
export interface CreatedSale {
  id: string;
  order_number: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  [key: string]: unknown;
}

export function AddSaleForm({
  onDone,
}: {
  onDone: (result: { emailed: boolean; qrSale?: CreatedSale }) => void;
}) {
  const toast = useToast();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+1 ");
  const [saleDate, setSaleDate] = useState(nowLocal());
  // "stripe_link" is a UI-only choice: it books the order as an unpaid Stripe
  // order the customer pays by card via a QR (shown in person) and/or an
  // emailed Pay-now link.
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [items, setItems] = useState<LineItem[]>([{ productName: "", quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState("");
  const [applyPst, setApplyPst] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const products = useAdminProducts();

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxRate = applyPst ? SK_PST_RATE : 0;
  const taxAmount = +(subtotal * taxRate).toFixed(2);
  const total = +(subtotal + taxAmount).toFixed(2);

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

  // Selecting a product from the dropdown fills both its name and current
  // price; the admin can still adjust the price after.
  function selectProduct(idx: number, p: ProductOption) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, productName: p.name, unitPrice: p.price } : item,
      ),
    );
  }

  // Stripe card payment: the customer pays by card/debit via QR or link. Email
  // is optional — with an email we also send the invoice + Pay-now link; either
  // way we pop a QR to show in person.
  const stripePay = paymentMethod === "stripe_link";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // A Stripe card order is booked unpaid and pending; cash / interac / other
    // keep the admin-chosen status. Unpaid orders aren't "delivered" yet.
    const effectiveMethod = stripePay ? "stripe" : paymentMethod;
    const effectiveStatus = stripePay ? "pending" : paymentStatus;
    const email = customerEmail.trim();

    const res = await fetch("/api/admin/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: generateOrderNumber(),
        type: "offline",
        date: new Date(saleDate).toISOString(),
        customerName,
        customerEmail: email || null,
        customerPhone: customerPhone.trim() && customerPhone.trim() !== "+1" ? customerPhone.trim() : null,
        items: items.filter((i) => i.productName),
        subtotal,
        taxRate,
        taxAmount,
        total,
        paymentMethod: effectiveMethod,
        paymentStatus: effectiveStatus,
        fulfillment: stripePay || effectiveStatus !== "paid" ? "pending" : "delivered",
        notes: notes || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save.");
      toast(data.error || "Failed to save sale.", "error");
      setSubmitting(false);
      return;
    }

    // Stripe card order: pop a QR to show in person, and — if we have an email
    // — also send the invoice with the Pay-now link (7-day expiry).
    if (stripePay) {
      const created = (await res.json()) as CreatedSale;
      if (email) {
        const inv = await fetch(`/api/admin/sales/${created.id}/send-invoice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (inv.ok) {
          toast(`Sale saved. Payment link emailed to ${email}. Show the QR to pay in person.`, "success");
        } else {
          const data = await inv.json().catch(() => ({}));
          toast(
            `Sale saved, but the email failed: ${data.error || "unknown error"}. You can still show the QR or resend from the ledger.`,
            "error",
          );
        }
      } else {
        toast("Sale saved. Show the QR for the customer to pay by card.", "success");
      }
      onDone({ emailed: Boolean(email), qrSale: created });
      return;
    }

    onDone({ emailed: !!customerEmail.trim() });
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
            <option value="stripe_link">Stripe card — QR / payment link</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-1">Payment status</label>
          {stripePay ? (
            <div className={`${fieldClass} flex items-center text-on-surface-variant bg-surface-container-low`}>
              Pending — customer pays by card
            </div>
          ) : (
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={fieldClass}>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          )}
        </div>
      </div>

      {stripePay && (
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-md px-4 py-3 text-sm text-primary">
          <span className="material-symbols-outlined text-lg leading-5">qr_code_2</span>
          <span>
            After saving, a <strong>payment QR</strong> appears — show it to the
            customer to scan and pay by credit or debit card. Email is{" "}
            <strong>optional</strong>: add one to also send the invoice with a
            Pay-now link (valid 7 days). The order stays pending until they pay.
          </span>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-primary uppercase tracking-widest">Items</label>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <ProductCombobox
              value={item.productName}
              products={products}
              containerClassName="col-span-6"
              className={fieldClass}
              placeholder="Search inventory or type a name…"
              required={idx === 0}
              onChange={(name) => updateItem(idx, "productName", name)}
              onSelect={(p) => selectProduct(idx, p)}
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

      <div className="flex items-center gap-2">
        <input
          id="apply-pst"
          type="checkbox"
          checked={applyPst}
          onChange={(e) => setApplyPst(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <label htmlFor="apply-pst" className="text-sm text-on-surface">
          Apply Saskatchewan PST ({(SK_PST_RATE * 100).toFixed(0)}%)
        </label>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-2 border-t border-outline-variant">
        <div className="space-y-0.5 text-sm">
          <p className="text-on-surface-variant">Subtotal: <span className="text-on-surface font-medium">${subtotal.toFixed(2)}</span></p>
          <p className="text-on-surface-variant">Tax: <span className="text-on-surface font-medium">${taxAmount.toFixed(2)}</span></p>
          <p className="text-lg font-bold text-primary">Total: ${total.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-error text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-on-primary px-8 py-2.5 rounded-md font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting
              ? "Saving..."
              : stripePay
                ? "Save & show payment QR"
                : "Save sale"}
          </button>
        </div>
      </div>
    </form>
  );
}
