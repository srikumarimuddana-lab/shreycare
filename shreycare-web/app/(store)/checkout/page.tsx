import type { Metadata } from "next";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Place your ShreyCare Organics order. Our team will email you payment instructions once we receive your order.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-3xl">
        <div className="mb-12">
          <p className="text-secondary font-bold uppercase tracking-widest text-sm mb-4">
            Checkout
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Place your order
          </h1>
          <p className="text-on-surface-variant leading-relaxed mt-6 max-w-xl">
            Submit your order below and our team will reply to your email with
            payment instructions. Once we confirm payment, we&apos;ll ship your
            order and send a tracking update.
          </p>
        </div>
        <CheckoutForm />
      </div>
    </section>
  );
}
