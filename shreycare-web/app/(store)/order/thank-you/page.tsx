import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <section className="min-h-[70vh] py-24 bg-surface">
      <div className="container mx-auto px-6 md:px-10 max-w-2xl text-center space-y-8">
        <span className="material-symbols-outlined text-secondary text-6xl">
          spa
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-primary">
          Order received
        </h1>
        <p className="text-on-surface-variant leading-relaxed text-lg">
          Thank you. We&apos;ve received your order and our team will reply to
          your email shortly with payment instructions. Once payment is
          confirmed we&apos;ll ship your order and send a tracking update.
        </p>
        {ref && (
          <p className="text-on-surface-variant">
            Order reference:{" "}
            <span className="font-semibold text-primary">{ref}</span>
          </p>
        )}
        <div className="pt-4">
          <Link
            href="/products"
            className="inline-block bg-primary text-on-primary px-8 py-3 rounded-md font-bold hover:opacity-90 transition-opacity"
          >
            Continue browsing
          </Link>
        </div>
      </div>
    </section>
  );
}
