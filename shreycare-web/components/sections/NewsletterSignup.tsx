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
    <section className="py-20 md:py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10">
        <div className="bg-inverse-surface text-inverse-on-surface rounded-2xl p-8 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-12">
          <div className="md:max-w-md space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-3xl font-headline font-medium">
              Join the ShreyCare ritual
            </h2>
            <p className="text-inverse-on-surface/70 text-sm md:text-base leading-relaxed">
              Early access to small batches, exclusive offers, and{" "}
              <span className="text-secondary-container">10% off</span> your first order.
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="w-full md:w-auto flex flex-col sm:flex-row gap-3"
          >
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="min-w-0 sm:min-w-[280px] !bg-inverse-surface border border-inverse-on-surface/20 !text-inverse-on-surface placeholder:text-inverse-on-surface/40 focus:!bg-inverse-surface"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-md font-semibold hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
          {status === "success" && (
            <p className="text-secondary-container text-sm font-semibold">Welcome to the ritual!</p>
          )}
        </div>
      </div>
    </section>
  );
}
