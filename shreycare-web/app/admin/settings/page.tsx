import type { Metadata } from "next";
import { SettingsDashboard } from "./SettingsDashboard";

export const metadata: Metadata = {
  title: "Settings — Admin",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary">
          Settings
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Payment configuration and Stripe webhook management.
        </p>
      </div>
      <SettingsDashboard />
    </div>
  );
}
