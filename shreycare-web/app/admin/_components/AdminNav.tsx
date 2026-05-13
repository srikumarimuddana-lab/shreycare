"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Home", icon: "dashboard", match: (p: string) => p === "/admin" },
  { href: "/admin/ledger", label: "Ledger", icon: "receipt_long", match: (p: string) => p.startsWith("/admin/ledger") },
  { href: "/admin/inventory", label: "Inventory", icon: "inventory_2", match: (p: string) => p.startsWith("/admin/inventory") },
  { href: "/admin/customers", label: "Customers", icon: "groups", match: (p: string) => p.startsWith("/admin/customers") },
];

export function AdminNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
              active
                ? "bg-on-primary/15 text-on-primary"
                : "text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
