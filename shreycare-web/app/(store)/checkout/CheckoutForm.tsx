"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { useToast } from "@/components/ui/ToastProvider";
import { calculateShipping, bottlesUntilFreeShipping } from "@/lib/cart/shipping";
import { calculateTax } from "@/lib/cart/tax";

interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
}

const initial: CustomerInput = {
  name: "",
  email: "",
  phone: "+1 ",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "SK",
  postalCode: "",
  country: "Canada",
  notes: "",
};

const PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland & Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

const fieldClass =
  "w-full px-4 py-3 rounded-lg border border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-sm";
const labelClass =
  "block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5";
const sectionCard =
  "bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 space-y-5 shadow-sm";

export function CheckoutForm() {
  const router = useRouter();
  const toast = useToast();
  const { state, total, bottleCount, hasFreeShipping, clearCart } = useCart();
  const [customer, setCustomer] = useState<CustomerInput>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setCustomer((c) => {
      const next = { ...c, [key]: value };
      if (key === "city" && (value as string).trim().toLowerCase() === "regina") {
        next.state = "SK";
      }
      return next;
    });
  }

  const isLocalDelivery = customer.city.trim().toLowerCase() === "regina";
  const province = isLocalDelivery ? "SK" : customer.state;

  const shipping = useMemo(() => {
    if (isLocalDelivery || hasFreeShipping) return 0;
    return calculateShipping(bottleCount);
  }, [isLocalDelivery, hasFreeShipping, bottleCount]);

  const tax = useMemo(
    () => calculateTax(total + shipping, province),
    [total, shipping, province],
  );

  const grandTotal = total + shipping + tax.amount;

  const shippingNudgeTiers = useMemo(() => {
    if (isLocalDelivery || hasFreeShipping || shipping === 0) return [];
    const until = bottlesUntilFreeShipping(bottleCount);
    return Array.from({ length: until }, (_, i) => {
      const add = until - i;
      const newCount = bottleCount + add;
      const newShipping = newCount >= 4 ? 0 : calculateShipping(newCount);
      const saved = +(shipping - newShipping).toFixed(2);
      const pct = Math.round((saved / grandTotal) * 100);
      return { add, saved, pct, isFree: newCount >= 4 };
    });
  }, [isLocalDelivery, hasFreeShipping, shipping, bottleCount, grandTotal]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.items.length === 0) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      customer: { ...customer, state: province },
      items: state.items,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to place order.");
      clearCart();
      router.push(`/order/thank-you?ref=${encodeURIComponent(data.orderNumber)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to place order.";
      setError(msg);
      toast(msg, "error");
      setSubmitting(false);
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-12 text-center space-y-6">
        <h2 className="font-headline text-2xl text-primary">Your cart is empty</h2>
        <p className="text-on-surface-variant">Add a product before checking out.</p>
        <Link
          href="/products"
          className="inline-block bg-primary text-on-primary px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

      {/* ── Left: form ── */}
      <div className="lg:col-span-3 space-y-6">

        {/* Your details */}
        <div className={sectionCard}>
          <h2 className="font-headline text-lg text-primary border-b border-outline-variant/40 pb-3">
            Your details
          </h2>
          <div>
            <label htmlFor="name" className={labelClass}>Full name</label>
            <input id="name" type="text" required autoComplete="name"
              value={customer.name} onChange={(e) => update("name", e.target.value)}
              className={fieldClass} placeholder="Jane Smith" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input id="email" type="email" required autoComplete="email"
                value={customer.email} onChange={(e) => update("email", e.target.value)}
                className={fieldClass} placeholder="jane@example.com" />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input id="phone" type="tel" required autoComplete="tel"
                value={customer.phone} onChange={(e) => update("phone", e.target.value)}
                className={fieldClass} placeholder="+1 306 000 0000" />
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className={sectionCard}>
          <h2 className="font-headline text-lg text-primary border-b border-outline-variant/40 pb-3">
            Shipping address
          </h2>
          <div>
            <label htmlFor="addressLine1" className={labelClass}>Address line 1</label>
            <input id="addressLine1" type="text" required autoComplete="address-line1"
              value={customer.addressLine1} onChange={(e) => update("addressLine1", e.target.value)}
              className={fieldClass} placeholder="123 Main Street" />
          </div>
          <div>
            <label htmlFor="addressLine2" className={labelClass}>
              Address line 2{" "}
              <span className="text-on-surface-variant font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input id="addressLine2" type="text" autoComplete="address-line2"
              value={customer.addressLine2} onChange={(e) => update("addressLine2", e.target.value)}
              className={fieldClass} placeholder="Apt, suite, unit…" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className={labelClass}>City</label>
              <input id="city" type="text" required autoComplete="address-level2"
                value={customer.city} onChange={(e) => update("city", e.target.value)}
                className={fieldClass} placeholder="Regina" />
            </div>

            {!isLocalDelivery && (
              <div>
                <label htmlFor="state" className={labelClass}>Province</label>
                <select id="state" required autoComplete="address-level1"
                  value={customer.state} onChange={(e) => update("state", e.target.value)}
                  className={fieldClass}>
                  {PROVINCES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="postalCode" className={labelClass}>Postal code</label>
              <input id="postalCode" type="text" required autoComplete="postal-code"
                value={customer.postalCode} onChange={(e) => update("postalCode", e.target.value)}
                className={fieldClass} placeholder="S4P 0A1" />
            </div>
            <div>
              <label htmlFor="country" className={labelClass}>Country</label>
              <input id="country" type="text" required autoComplete="country-name"
                value={customer.country} onChange={(e) => update("country", e.target.value)}
                className={fieldClass} placeholder="Canada" />
            </div>
          </div>

          {isLocalDelivery && (
            <div className="flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-lg px-4 py-3 text-sm text-primary">
              <span className="text-lg leading-none mt-0.5">🌿</span>
              <span className="font-semibold leading-snug">
                You&apos;re in Regina — FREE local delivery on all orders!
              </span>
            </div>
          )}
        </div>

        {/* Order notes */}
        <div className={sectionCard}>
          <h2 className="font-headline text-lg text-primary border-b border-outline-variant/40 pb-3">
            Order notes{" "}
            <span className="text-on-surface-variant font-sans font-normal text-sm">(optional)</span>
          </h2>
          <textarea id="notes" rows={3}
            placeholder="Preferred payment method (Interac e-Transfer or cash), delivery instructions, or anything else."
            value={customer.notes} onChange={(e) => update("notes", e.target.value)}
            className={fieldClass} />
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container px-5 py-4 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* ── Right: order summary ── */}
      <aside className="lg:col-span-2 sticky top-28 space-y-4">

        {/* Items + totals card */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low">
            <h2 className="font-headline text-lg text-primary">Order summary</h2>
          </div>

          {/* Item list */}
          <ul className="divide-y divide-outline-variant/40 px-6">
            {state.items.map((item) => (
              <li key={item.productId} className="py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface leading-snug">{item.name}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-on-surface whitespace-nowrap">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          {/* Totals */}
          <div className="px-6 pb-2 pt-2 border-t border-outline-variant/40 space-y-2.5 text-sm bg-surface-container-low/40">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="font-semibold text-on-surface">${total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant">Shipping</span>
              {isLocalDelivery ? (
                <span className="text-right">
                  <span className="font-bold text-primary block">FREE</span>
                  <span className="text-xs text-primary/70">local delivery</span>
                </span>
              ) : shipping === 0 ? (
                <span className="font-bold text-primary">FREE</span>
              ) : (
                <span className="font-semibold text-on-surface">${shipping.toFixed(2)}</span>
              )}
            </div>

            {tax.amount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">PST (6%)</span>
                <span className="font-semibold text-on-surface">${tax.amount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Grand total */}
          <div className="px-6 py-4 border-t-2 border-primary/15 bg-surface-container-low flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total</span>
            <span className="text-xl font-bold text-primary whitespace-nowrap">${grandTotal.toFixed(2)} CAD</span>
          </div>
        </div>

        {/* Shipping savings nudge */}
        {shippingNudgeTiers.length > 0 && (
          <div className="bg-surface-container-lowest border border-secondary/25 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-secondary/10 px-5 py-3 flex items-center gap-2">
              <span className="text-base">💡</span>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">
                Add more — save on shipping
              </p>
            </div>
            <ul className="divide-y divide-outline-variant/40">
              {shippingNudgeTiers.map(({ add, saved, pct, isFree }) => (
                <li key={add} className={`px-5 py-3.5 ${isFree ? "bg-primary/5" : ""}`}>
                  <div className="flex items-center justify-between gap-3 mb-0.5">
                    <span className="text-sm font-semibold text-on-surface">
                      Add {add} more bottle{add > 1 ? "s" : ""}
                    </span>
                    <span className={`text-sm font-bold whitespace-nowrap ${isFree ? "text-primary" : "text-secondary"}`}>
                      {isFree ? "🌿 FREE shipping" : `-$${saved.toFixed(2)}`}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {isFree
                      ? "Unlock free shipping on your whole order"
                      : `Save ${pct}% on your order total`}
                  </p>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t border-outline-variant/40 bg-surface-container-low/60">
              <Link
                href="/products"
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
              >
                Go back and add more bottles
                <span className="text-base leading-none">→</span>
              </Link>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm space-y-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
          <p className="text-xs text-on-surface-variant text-center leading-relaxed">
            By placing this order you agree to our{" "}
            <Link href="/policies/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
            . Our team will email you payment instructions after you submit.
          </p>
        </div>
      </aside>
    </form>
  );
}
