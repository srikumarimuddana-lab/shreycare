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
  title: "Premium Botanical Hair Care",
  description: "Discover our premium botanical hair care collection. Nourish your hair with cold-pressed oils and rare herbs. Rooted in Nature, Blended with Ayurveda.",
  keywords: ["botanical hair care", "organic hair oil", "natural hair growth", "ayurvedic hair care"],
  openGraph: {
    title: "Premium Botanical Hair Care | ShreyCare Organics",
    description: "Discover our premium botanical hair care collection. Rooted in Nature, Blended with Ayurveda.",
    type: "website",
  }
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
