import { sanityClient } from "@/lib/sanity/client";
import { allFaqsQuery } from "@/lib/sanity/queries";
import { AccordionItem } from "@/components/ui/Accordion";
import { PortableText } from "next-sanity";
import type { FAQ } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Shrey Care products, shipping, and orders.",
};

export const revalidate = 60;

const categoryLabels: Record<string, string> = {
  ordering: "Ordering",
  shipping: "Shipping",
  products: "Products",
  returns: "Returns",
};

export default async function FAQPage() {
  const faqs: FAQ[] = await sanityClient.fetch(allFaqsQuery);

  const grouped = faqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
    const cat = faq.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-3xl">
        <div className="mb-16">
          <p className="text-secondary font-bold uppercase tracking-widest text-sm mb-4">
            Help Center
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Frequently Asked Questions
          </h1>
        </div>

        <div className="space-y-12">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-bold text-primary uppercase tracking-widest text-sm">
                {categoryLabels[category] || category}
              </h2>
              <div className="space-y-3">
                {items.map((faq) => (
                  <AccordionItem key={faq._id} question={faq.question}>
                    <PortableText value={faq.answer} />
                  </AccordionItem>
                ))}
              </div>
            </div>
          ))}
        </div>

        {faqs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">
              FAQ content coming soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
