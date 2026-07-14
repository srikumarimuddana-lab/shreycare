import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { PayButton } from "./PayButton";

export const metadata: Metadata = {
  title: "Pay for your order",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const sale = UUID_RE.test(token)
    ? (
        await supabaseAdmin
          .from("sales")
          .select(
            "id, order_number, customer_name, items, subtotal, shipping_amount, tax_amount, total, payment_status, fulfillment",
          )
          .eq("pay_token", token)
          .maybeSingle()
      ).data
    : null;

  if (!sale) {
    return (
      <Shell>
        <h1 className="font-headline text-3xl text-primary">Payment link not found</h1>
        <p className="text-on-surface-variant">
          This payment link is invalid or no longer available. If you believe
          this is a mistake, please contact us.
        </p>
      </Shell>
    );
  }

  const payable =
    ["pending", "failed", "expired"].includes(sale.payment_status) &&
    sale.fulfillment !== "cancelled";
  const items = (sale.items ?? []) as SaleItem[];

  return (
    <Shell>
      <h1 className="font-headline text-3xl text-primary">
        Order {sale.order_number}
      </h1>
      <p className="text-on-surface-variant">
        {payable
          ? `Hi ${sale.customer_name}, review your order below and pay securely by card.`
          : sale.fulfillment === "cancelled"
            ? "This order was cancelled and can no longer be paid."
            : "This order has already been paid — thank you!"}
      </p>

      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm overflow-hidden text-left">
        <ul className="divide-y divide-outline-variant/40 px-6">
          {items.map((item, i) => (
            <li key={i} className="py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-on-surface">{item.productName}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-bold text-on-surface whitespace-nowrap">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="px-6 py-3 border-t border-outline-variant/40 space-y-2 text-sm bg-surface-container-low/40">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Subtotal</span>
            <span className="font-semibold">${Number(sale.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Shipping</span>
            <span className="font-semibold">
              {Number(sale.shipping_amount ?? 0) > 0
                ? `$${Number(sale.shipping_amount).toFixed(2)}`
                : "FREE"}
            </span>
          </div>
          {Number(sale.tax_amount) > 0 && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Tax</span>
              <span className="font-semibold">${Number(sale.tax_amount).toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t-2 border-primary/15 bg-surface-container-low flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total</span>
          <span className="text-xl font-bold text-primary">
            ${Number(sale.total).toFixed(2)} CAD
          </span>
        </div>
      </div>

      {payable ? (
        <PayButton token={token} />
      ) : (
        <Link
          href="/products"
          className="inline-block bg-primary text-on-primary px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Continue shopping
        </Link>
      )}

      <p className="text-xs text-on-surface-variant">
        Payments are processed securely by Stripe. We never see or store your
        card details.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10 max-w-xl text-center space-y-6">
        {children}
      </div>
    </section>
  );
}
