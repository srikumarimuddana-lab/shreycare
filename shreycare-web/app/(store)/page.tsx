import { sanityClient } from "@/lib/sanity/client";
import { featuredProductsQuery, pageContentQuery } from "@/lib/sanity/queries";
import { Hero } from "@/components/sections/Hero";
import { BrandStory } from "@/components/sections/BrandStory";
import { BenefitsTrinity } from "@/components/sections/BenefitsTrinity";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { Testimonial } from "@/components/sections/Testimonial";
import { NewsletterSignup } from "@/components/sections/NewsletterSignup";

import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Best Ayurvedic Hair Oil in Canada — Organic & Cold-Pressed",
  description:
    "Buy the best ayurvedic hair oil in Canada. ShreyCare Organics offers organic, cold-pressed bhringraj & amla hair oils for hair growth, dry scalp, and hair fall. Cruelty-free, shipped across Canada.",
  keywords: [
    "best hair oil Canada",
    "ayurvedic hair oil Canada",
    "organic hair oil for hair growth",
    "cold-pressed hair oil",
    "bhringraj hair oil Canada",
    "amla hair oil",
    "hair oil for hair fall",
    "natural hair oil Canada",
    "herbal hair oil",
    "cruelty-free hair oil",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Best Ayurvedic Hair Oil in Canada | ShreyCare Organics",
    description:
      "Organic, cold-pressed ayurvedic hair oils for hair growth, dry scalp, and hair fall. Shipped across Canada.",
    type: "website",
  },
};

export default async function HomePage() {
  const [products, pageContent] = await Promise.all([
    sanityClient.fetch(featuredProductsQuery),
    sanityClient.fetch(pageContentQuery),
  ]);

  return (
    <main id="main-content">
      <Hero
        headline={pageContent?.heroHeadline}
        subtext={pageContent?.heroSubtext}
        ctaText={pageContent?.heroCTA}
      />
      <BrandStory />
      <BenefitsTrinity />
      <FeaturedProducts products={products} />
      <Testimonial testimonial={pageContent?.testimonials?.[0]} />
      <NewsletterSignup />
    </main>
  );
}
