import { sanityClient } from "@/lib/sanity/client";
import { allFaqsQuery } from "@/lib/sanity/queries";
import { AccordionItem } from "@/components/ui/Accordion";
import { PortableText } from "next-sanity";
import { FAQSchema } from "@/components/seo/StructuredData";
import type { FAQ, PortableTextBlock } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Ayurvedic Hair Oil Questions & Canadian Shipping",
  description:
    "Answers to common questions about ayurvedic hair oil, how to use it, shipping across Canada, returns, and ShreyCare Organics products.",
  alternates: { canonical: "/faq" },
};

// Flatten Portable Text blocks to plain text for FAQPage structured data.
// Google's FAQ rich result requires a plain-text answer string.
function portableTextToPlain(blocks: PortableTextBlock[] | undefined): string {
  if (!blocks) return "";
  return blocks
    .filter((b) => b._type === "block")
    .map((b) => {
      const children = (b.children as Array<{ text?: string }> | undefined) ?? [];
      return children.map((c) => c.text ?? "").join("");
    })
    .join("\n")
    .trim();
}

export const revalidate = 60;

const categoryLabels: Record<string, string> = {
  ordering: "Ordering",
  shipping: "Shipping",
  products: "Products",
  returns: "Returns",
};

function makeFaq(
  id: string,
  category: string,
  question: string,
  answer: string,
  sortOrder: number
): FAQ {
  return {
    _id: id,
    category,
    question,
    sortOrder,
    answer: [
      {
        _type: "block",
        _key: `${id}-block`,
        style: "normal",
        children: [{ _type: "span", _key: `${id}-span`, text: answer, marks: [] }],
        markDefs: [],
      } as unknown as PortableTextBlock,
    ],
  };
}

const defaultFaqs: FAQ[] = [
  makeFaq(
    "default-products-1",
    "products",
    "Which ShreyCare hair oil is right for me?",
    "We make three signature oils, each formulated for a specific concern. Holistic Hair Oil is for overall nourishment, dryness and shine. Anti-Dandruff Hair Oil targets flakes, itchy scalp and irritation. Hair Growth Hair Oil is for hair fall, thinning and slow growth. Take our 2-minute Hair Quiz at /hair-quiz for a personalised recommendation.",
    1
  ),
  makeFaq(
    "default-products-2",
    "products",
    "Are the oils 100% natural and organic?",
    "Yes. Every ShreyCare hair oil is cold-pressed, 100% organic, cruelty-free and free from parabens, sulfates, mineral oil and synthetic fragrance. We use traditional Ayurvedic herbs including bhringraj, amla, brahmi, neem and hibiscus in a coconut oil base.",
    2
  ),
  makeFaq(
    "default-products-3",
    "products",
    "How do I use the hair oil?",
    "Warm a small amount of oil between your palms, then massage gently into your scalp using your fingertips for 5-10 minutes. Work the remaining oil through the lengths of your hair. Leave on for at least 1 hour, or overnight for a deep treatment, then wash out with a mild shampoo. We recommend using 2-3 times per week for best results.",
    3
  ),
  makeFaq(
    "default-products-4",
    "products",
    "How long until I see results?",
    "Most customers notice softer, shinier hair and a calmer scalp within 2-3 weeks. Visible improvements in hair fall, dandruff or growth typically appear after 8-12 weeks of consistent use. Ayurvedic remedies work gently and gradually with the body.",
    4
  ),
  makeFaq(
    "default-shipping-1",
    "shipping",
    "Where do you ship?",
    "We ship across Canada. All prices are in CAD.",
    1
  ),
  makeFaq(
    "default-shipping-2",
    "shipping",
    "How long does shipping take?",
    "Orders are typically processed within 1-2 business days. Standard Canada-wide shipping takes 3-7 business days depending on your province. You'll receive a tracking link by email once your order ships.",
    2
  ),
  makeFaq(
    "default-ordering-1",
    "ordering",
    "What payment methods do you accept?",
    "We accept all major credit cards (Visa, Mastercard, Amex) through Stripe's secure checkout. We also accept Interac e-Transfer — please add a note at checkout if you'd like to pay this way.",
    1
  ),
  makeFaq(
    "default-ordering-2",
    "ordering",
    "Can I change or cancel my order?",
    "If your order hasn't shipped yet, email us at contact@shreycare.com as soon as possible and we'll do our best to update or cancel it. Once an order is in transit we can't change it, but you're welcome to use our return policy.",
    2
  ),
  makeFaq(
    "default-returns-1",
    "returns",
    "What is your return policy?",
    "We accept returns of unopened products within 14 days of delivery for a full refund. For opened products, please contact us at contact@shreycare.com — if you're not happy with your purchase we'll make it right.",
    1
  ),
  makeFaq(
    "default-returns-2",
    "returns",
    "What if my order arrives damaged?",
    "Please email contact@shreycare.com within 48 hours of delivery with a photo of the damaged item and packaging. We'll send a replacement at no cost.",
    2
  ),
];

export default async function FAQPage() {
  const sanityFaqs: FAQ[] = await sanityClient.fetch(allFaqsQuery);
  const faqs: FAQ[] = sanityFaqs.length > 0 ? sanityFaqs : defaultFaqs;

  const grouped = faqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
    const cat = faq.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  const schemaFaqs = faqs
    .map((f) => ({
      question: f.question,
      answer: portableTextToPlain(f.answer),
    }))
    .filter((f) => f.question && f.answer);

  return (
    <section className="py-16 bg-surface min-h-screen">
      {schemaFaqs.length > 0 && <FAQSchema faqs={schemaFaqs} />}
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

      </div>
    </section>
  );
}
