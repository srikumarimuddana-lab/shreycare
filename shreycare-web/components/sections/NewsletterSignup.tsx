"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10">
        <div className="bg-surface-container rounded-2xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:max-w-md space-y-4">
            <h2 className="text-3xl font-bold text-primary">
              Join ShreyCare Organics
            </h2>
            <p className="text-on-surface-variant">
              Get early access to small batches, exclusive offers and 10% off your first
              order.
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="w-full md:w-auto flex flex-col sm:flex-row gap-4"
          >
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="min-w-[300px]"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-primary text-on-primary px-8 py-4 rounded-md font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
          {status === "success" && (
            <p className="text-primary text-sm font-bold">Welcome to the Atelier!</p>
          )}
        </div>
      </div>
    </section>
  );
}
