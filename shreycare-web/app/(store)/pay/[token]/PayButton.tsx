"use client";

import { useState } from "react";

export function PayButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pay/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Unable to start payment.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={startPayment}
        disabled={loading}
        className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Redirecting to secure payment…" : "Pay now by card"}
      </button>
      {error && (
        <p className="text-sm text-error bg-error-container/50 rounded-lg px-4 py-2">{error}</p>
      )}
    </div>
  );
}
