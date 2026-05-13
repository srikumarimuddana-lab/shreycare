import type { Metadata } from "next";
import { PurchaseOrdersView } from "./PurchaseOrdersView";

export const metadata: Metadata = {
  title: "Purchase orders — Admin",
  robots: { index: false, follow: false },
};

export default function PurchaseOrdersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary">
          Purchase orders
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          History of every restocking event.
        </p>
      </div>
      <PurchaseOrdersView />
    </div>
  );
}
