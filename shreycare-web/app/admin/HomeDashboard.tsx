"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LedgerSummary {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  totalSales: number;
}

interface InventorySummary {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  roi: number;
  totalInventoryValue: number;
  lowStockCount: number;
}

interface CustomerSummary {
  totalCustomers: number;
  newCustomers30d: number;
  repeatPurchaseRate: number;
  churnRiskCount: number;
}

export function HomeDashboard() {
  const router = useRouter();
  const [ledger, setLedger] = useState<LedgerSummary | null>(null);
  const [inventory, setInventory] = useState<InventorySummary | null>(null);
  const [customers, setCustomers] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [lRes, iRes, cRes] = await Promise.all([
        fetch("/api/admin/sales/summary").catch(() => null),
        fetch("/api/admin/inventory/summary").catch(() => null),
        fetch("/api/admin/customers/summary").catch(() => null),
      ]);

      if (lRes?.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (cancelled) return;

      if (lRes?.ok) setLedger(await lRes.json());
      if (iRes?.ok) setInventory(await iRes.json());
      if (cRes?.ok) setCustomers(await cRes.json());
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-on-surface-variant text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
      <SectionCard
        href="/admin/ledger"
        icon="receipt_long"
        title="Sales Ledger"
        description="Track online and offline sales"
      >
        {ledger ? (
          <dl className="space-y-2 text-sm">
            <Row label="Total revenue" value={`$${ledger.totalRevenue.toFixed(2)}`} accent="text-primary" big />
            <Row label="Paid" value={`$${ledger.paidRevenue.toFixed(2)}`} accent="text-green-700" />
            <Row label="Pending" value={`$${ledger.pendingRevenue.toFixed(2)}`} accent="text-yellow-700" />
            <Row label="Sales" value={`${ledger.totalSales}`} />
          </dl>
        ) : (
          <EmptyState text="No sales data yet." />
        )}
      </SectionCard>

      <SectionCard
        href="/admin/inventory"
        icon="inventory_2"
        title="Inventory & ROI"
        description="Stock, cost, and profitability"
      >
        {inventory ? (
          <dl className="space-y-2 text-sm">
            <Row label="Inventory value" value={`$${inventory.totalInventoryValue.toFixed(2)}`} accent="text-primary" big />
            <Row label="Gross profit" value={`$${inventory.grossProfit.toFixed(2)}`} accent="text-green-700" />
            <Row label="ROI" value={`${inventory.roi.toFixed(1)}%`} accent="text-secondary" />
            <Row
              label="Low stock alerts"
              value={`${inventory.lowStockCount}`}
              accent={inventory.lowStockCount > 0 ? "text-yellow-700" : "text-on-surface-variant"}
            />
          </dl>
        ) : (
          <EmptyState text="Set up inventory to see ROI." actionHref="/admin/inventory" actionLabel="Go to inventory →" />
        )}
      </SectionCard>

      <SectionCard
        href="/admin/customers"
        icon="groups"
        title="Customers"
        description="Lifetime value and retention"
      >
        {customers ? (
          <dl className="space-y-2 text-sm">
            <Row label="Customers" value={`${customers.totalCustomers}`} accent="text-primary" big />
            <Row label="New (30d)" value={`${customers.newCustomers30d}`} accent="text-green-700" />
            <Row label="Repeat rate" value={`${customers.repeatPurchaseRate.toFixed(1)}%`} accent="text-secondary" />
            <Row
              label="Churn risk"
              value={`${customers.churnRiskCount}`}
              accent={customers.churnRiskCount > 0 ? "text-red-700" : "text-on-surface-variant"}
            />
          </dl>
        ) : (
          <EmptyState text="No customer data yet." />
        )}
      </SectionCard>
    </div>
  );
}

function SectionCard({
  href,
  icon,
  title,
  description,
  children,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-botanical hover:border-primary/30 transition-all group block"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
          <div>
            <h2 className="font-headline text-lg font-bold text-primary">{title}</h2>
            <p className="text-xs text-on-surface-variant">{description}</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all">
          arrow_forward
        </span>
      </div>
      {children}
    </Link>
  );
}

function Row({
  label,
  value,
  accent = "text-on-surface",
  big = false,
}: {
  label: string;
  value: string;
  accent?: string;
  big?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-on-surface-variant text-xs uppercase tracking-wider">{label}</dt>
      <dd className={`font-bold ${big ? "text-xl sm:text-2xl" : "text-sm"} ${accent}`}>{value}</dd>
    </div>
  );
}

function EmptyState({
  text,
  actionHref,
  actionLabel,
}: {
  text: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="text-center py-4">
      <p className="text-sm text-on-surface-variant">{text}</p>
      {actionHref && actionLabel && (
        <span className="text-xs text-primary font-semibold mt-2 inline-block">{actionLabel}</span>
      )}
    </div>
  );
}
