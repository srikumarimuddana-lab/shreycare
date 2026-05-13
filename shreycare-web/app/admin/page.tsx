import type { Metadata } from "next";
import { HomeDashboard } from "./HomeDashboard";

export const metadata: Metadata = {
  title: "Admin — ShreyCare",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary">
          Dashboard
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Overview of sales, inventory, and customers.
        </p>
      </div>
      <HomeDashboard />
    </div>
  );
}
