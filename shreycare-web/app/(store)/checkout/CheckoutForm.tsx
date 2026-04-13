"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";

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
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Canada",
  notes: "",
};

const fieldClass =
  "w-full px-4 py-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";
const labelClass =
  "block text-sm font-semibold text-primary mb-2 uppercase tracking-widest text-xs";

export function CheckoutForm() {
  const router = useRouter();
  const { state, total, clearCart } = useCart();
  const [customer, setCustomer] = useState<CustomerInput>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setCustomer((c) => ({ ...c, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.items.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items: state.items }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to place order.");
      }
      clearCart();
      router.push(`/order/thank-you?ref=${encodeURIComponent(data.orderNumber)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.");
      setSubmitting(false);
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-10 text-center space-y-6">
        <h2 className="font-headline text-2xl text-primary">Your cart is empty</h2>
        <p className="text-on-surface-variant">
          Add a product before checking out.
        </p>
        <Link
          href="/products"
          className="inline-block bg-primary text-on-primary px-8 py-3 rounded-md font-bold hover:opacity-90 transition-opacity"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-10">
        <fieldset className="space-y-5">
          <legend className="font-headline text-xl text-primary mb-4">
            Your details
          </legend>
          <div>
            <label htmlFor="name" className={labelClass}>Full name</label>
            <input
              id="name" type="text" required autoComplete="name"
              value={customer.name}
              onChange={(e) => update("name", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email" type="email" required autoComplete="email"
                value={customer.email}
                onChange={(e) => update("email", e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input
                id="phone" type="tel" required autoComplete="tel"
                value={customer.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="font-headline text-xl text-primary mb-4">
            Shipping address
          </legend>
          <div>
            <label htmlFor="addressLine1" className={labelClass}>Address line 1</label>
            <input
              id="addressLine1" type="text" required autoComplete="address-line1"
              value={customer.addressLine1}
              onChange={(e) => update("addressLine1", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="addressLine2" className={labelClass}>
              Address line 2 <span className="text-on-surface-variant font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="addressLine2" type="text" autoComplete="address-line2"
              value={customer.addressLine2}
              onChange={(e) => update("addressLine2", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className={labelClass}>City</label>
              <input
                id="city" type="text" required autoComplete="address-level2"
                value={customer.city}
                onChange={(e) => update("city", e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="state" className={labelClass}>State / Province</label>
              <input
                id="state" type="text" required autoComplete="address-level1"
                value={customer.state}
                onChange={(e) => update("state", e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="postalCode" className={labelClass}>Postal / PIN code</label>
              <input
                id="postalCode" type="text" required autoComplete="postal-code"
                value={customer.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="country" className={labelClass}>Country</label>
              <input
                id="country" type="text" required autoComplete="country-name"
                value={customer.country}
                onChange={(e) => update("country", e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-headline text-xl text-primary mb-4">
            Order notes <span className="text-on-surface-variant font-normal text-base">(optional)</span>
          </legend>
          <textarea
            id="notes" rows={3}
            placeholder="Preferred payment method (UPI, bank transfer), delivery instructions, or anything else."
            value={customer.notes}
            onChange={(e) => update("notes", e.target.value)}
            className={fieldClass}
          />
        </fieldset>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      <aside className="lg:col-span-1">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 space-y-5 sticky top-28">
          <h2 className="font-headline text-xl text-primary">Order summary</h2>
          <ul className="space-y-3 divide-y divide-outline-variant/50">
            {state.items.map((item) => (
              <li key={item.productId} className="pt-3 first:pt-0 flex justify-between gap-3 text-sm">
                <span className="text-on-surface">
                  {item.name}
                  <span className="text-on-surface-variant"> × {item.quantity}</span>
                </span>
                <span className="text-on-surface font-semibold whitespace-nowrap">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center border-t border-outline-variant pt-4">
            <span className="text-on-surface-variant uppercase tracking-widest text-xs">Subtotal</span>
            <span className="text-primary font-bold text-xl">${total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Shipping and taxes will be confirmed by our team in the payment
            instructions email.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary py-4 rounded-md font-bold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
          <p className="text-xs text-on-surface-variant text-center">
            By placing this order you agree to our{" "}
            <Link href="/policies/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </aside>
    </form>
  );
}
