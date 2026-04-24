"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    if (res.ok) {
      toast("Welcome back, admin.", "success");
      router.push("/admin/ledger");
    } else {
      setError("Invalid passphrase. Try again.");
      toast("Invalid passphrase.", "error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/images/logo.png"
            alt="ShreyCare Organics"
            width={80}
            height={80}
            className="h-20 w-20 object-contain mb-4"
          />
          <h1 className="font-headline text-2xl font-bold text-primary">
            ShreyCare Admin
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Sign in to manage your sales
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 space-y-6 shadow-botanical"
        >
          <div>
            <label
              htmlFor="secret"
              className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2"
            >
              Admin passphrase
            </label>
            <input
              id="secret"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              placeholder="Enter your passphrase"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-4 py-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container text-sm rounded-lg px-4 py-3 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3.5 rounded-lg font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-center text-on-surface-variant text-xs mt-8">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
