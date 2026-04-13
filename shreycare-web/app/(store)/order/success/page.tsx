import { getStripe } from "@/lib/stripe";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;

  if (!params.session_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-on-surface-variant">No order found.</p>
      </div>
    );
  }

  const session = await getStripe().checkout.sessions.retrieve(params.session_id, {
    expand: ["line_items"],
  });

  return (
    <section className="min-h-screen py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10 max-w-2xl text-center space-y-8">
        <div className="text-6xl">🌿</div>
        <h1 className="text-4xl font-bold text-primary">Thank You for Your Order</h1>
        <p className="text-on-surface-variant text-lg">
          Your botanical ritual is on its way. A confirmation email has been sent
          to <strong>{session.customer_details?.email}</strong>.
        </p>

        <div className="bg-surface-container rounded-2xl p-8 text-left space-y-6">
          <div className="flex justify-between">
            <span className="text-sm uppercase tracking-widest text-on-surface-variant">Order Total</span>
            <span className="text-primary font-bold text-xl">
              ${((session.amount_total || 0) / 100).toFixed(2)} CAD
            </span>
          </div>
          {session.line_items?.data.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="text-on-surface">{item.description} &times; {item.quantity}</span>
              <span className="text-on-surface-variant">${((item.amount_total || 0) / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>

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
