import Link from "next/link";
import type { Metadata } from "next";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { ClearCartOnMount } from "./ClearCartOnMount";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;

  if (!params.session_id || !isStripeConfigured()) {
    return <NotFound />;
  }

  // Verify with Stripe directly — the redirect URL alone is never proof of
  // payment (anyone can craft it). The ledger row is looked up for display.
  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(params.session_id);
  } catch {
    return <NotFound />;
  }

  const { data: sale } = await supabaseAdmin
    .from("sales")
    .select("order_number, customer_name, items, subtotal, shipping_amount, tax_amount, total, payment_status")
    .eq("id", session.metadata?.sale_id ?? session.client_reference_id ?? "")
    .maybeSingle();

  const paid = session.payment_status === "paid";
  const email = session.customer_details?.email;
  const items = ((sale?.items ?? []) as SaleItem[]);

  return (
    <section className="min-h-screen py-32 bg-surface">
      <ClearCartOnMount />
      <div className="container mx-auto px-6 md:px-10 max-w-2xl text-center space-y-8">
        <div className="text-6xl">🌿</div>
        <h1 className="text-4xl font-bold text-primary">
          {paid ? "Thank You for Your Order" : "Payment Processing"}
        </h1>
        <p className="text-on-surface-variant text-lg">
          {paid ? (
            <>
              Your botanical ritual is on its way.
              {email && (
                <> A receipt has been sent to <strong>{email}</strong>.</>
              )}
            </>
          ) : (
            <>
              Your payment is still being confirmed. We&apos;ll email you
              {email && <> at <strong>{email}</strong></>} as soon as it completes —
              no need to pay again.
            </>
          )}
        </p>

        {sale && (
          <div className="bg-surface-container rounded-2xl p-8 text-left space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm uppercase tracking-widest text-on-surface-variant">Order</span>
              <span className="font-mono font-bold text-primary">{sale.order_number}</span>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-on-surface">{item.productName} &times; {item.quantity}</span>
                <span className="text-on-surface-variant">${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm text-on-surface-variant border-t border-outline-variant/40 pt-3">
              <span>Shipping</span>
              <span>{Number(sale.shipping_amount ?? 0) > 0 ? `$${Number(sale.shipping_amount).toFixed(2)}` : "FREE"}</span>
            </div>
            {Number(sale.tax_amount) > 0 && (
              <div className="flex justify-between text-sm text-on-surface-variant">
                <span>Tax</span>
                <span>${Number(sale.tax_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-primary/15 pt-3">
              <span className="text-sm uppercase tracking-widest text-on-surface-variant">Total</span>
              <span className="text-primary font-bold text-xl">
                ${Number(sale.total).toFixed(2)} CAD
              </span>
            </div>
          </div>
        )}

        <Link
          href="/products"
          className="inline-block bg-primary text-on-primary px-10 py-4 rounded-md font-bold hover:opacity-90 transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="text-on-surface-variant">No order found.</p>
    </div>
  );
}
