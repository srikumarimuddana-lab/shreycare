"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    if (res.ok) {
      router.push("/admin/ledger");
    } else {
      setError("Invalid passphrase.");
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
        <h1 className="font-headline text-3xl font-bold text-primary text-center">
          Admin
        </h1>
        <div>
          <label htmlFor="secret" className="block text-sm font-semibold text-primary mb-2 uppercase tracking-widest text-xs">
            Passphrase
          </label>
          <input
            id="secret"
            type="password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full px-4 py-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {error && (
          <p className="text-error text-sm text-center">{error}</p>
        )}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-3 rounded-md font-bold hover:opacity-90 transition-opacity"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
