import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
};

export default function OrdersPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-primary mb-8">My Orders</h1>
      <div className="bg-surface-container-low rounded-lg p-12 text-center">
        <p className="text-on-surface-variant text-lg">No orders yet. Start your botanical journey!</p>
        <a
          href="/products"
          className="inline-block mt-6 bg-primary text-on-primary px-8 py-3 rounded-md font-bold hover:opacity-90 transition-all"
        >
          Browse Products
        </a>
      </div>
    </div>
  );
}
