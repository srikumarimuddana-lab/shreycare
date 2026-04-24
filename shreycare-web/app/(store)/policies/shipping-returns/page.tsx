import { sanityClient } from "@/lib/sanity/client";
import { policyPageBySlugQuery } from "@/lib/sanity/queries";
import { PortableText } from "next-sanity";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canadian Shipping & Returns Policy",
  description:
    "ShreyCare Organics ships ayurvedic hair oils across Canada. Free shipping on qualifying orders. 30-day returns on unopened products.",
  alternates: { canonical: "/policies/shipping-returns" },
};

export const revalidate = 60;

export default async function ShippingReturnsPage() {
  const page = await sanityClient.fetch(policyPageBySlugQuery, {
    slug: "shipping-returns",
  });

  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-12">
          {page?.title || "Shipping & Returns"}
        </h1>

        {page?.body ? (
          <div className="prose prose-lg max-w-none text-on-surface-variant leading-relaxed [&_h2]:font-headline [&_h2]:text-primary [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-4 [&_p]:mb-6">
            <PortableText value={page.body} />
          </div>
        ) : (
          <div className="space-y-8 text-on-surface-variant leading-relaxed text-lg">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Shipping</h2>
              <p>
                We ship across Canada. Standard shipping takes 5-7 business days.
                Free shipping on orders over $75 CAD.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Returns</h2>
              <p>
                We accept returns within 30 days of delivery for unopened
                products. Please contact us at{" "}
                <a
                  href="mailto:contact@shreycare.com"
                  className="text-primary underline hover:text-secondary"
                >
                  contact@shreycare.com
                </a>{" "}
                to initiate a return.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
