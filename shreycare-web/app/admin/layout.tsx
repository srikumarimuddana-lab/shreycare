"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { AdminNav } from "./_components/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const pathname = usePathname() ?? "";

  // The login page renders on its own — skip the admin chrome there.
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    toast("Signed out.", "info");
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-surface-dim">
      <header className="bg-primary text-on-primary sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 flex items-center justify-between h-16 gap-4">
          <Link href="/admin" className="flex items-center gap-3 shrink-0">
            <Image
              src="/images/logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain rounded-full bg-on-primary/10 p-0.5"
            />
            <span className="font-headline font-bold text-base tracking-tight hidden sm:block">
              ShreyCare Admin
            </span>
          </Link>

          <AdminNav />

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/"
              className="text-on-primary/70 hover:text-on-primary text-sm transition-colors hidden md:block"
            >
              View store
            </Link>
            <button
              onClick={handleLogout}
              className="bg-on-primary/15 hover:bg-on-primary/25 text-on-primary px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
