import type { Metadata } from "next";
import { LedgerDashboard } from "./LedgerDashboard";

export const metadata: Metadata = {
  title: "Sales Ledger — Admin",
  robots: { index: false, follow: false },
};

export default function LedgerPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">
              Sales Ledger
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Online + offline sales in one place.
            </p>
          </div>
        </div>
        <LedgerDashboard />
      </div>
    </div>
  );
}
