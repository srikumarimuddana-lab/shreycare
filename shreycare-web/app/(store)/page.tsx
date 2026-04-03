import { sanityClient } from "@/lib/sanity/client";
import { featuredProductsQuery, pageContentQuery } from "@/lib/sanity/queries";
import { Hero } from "@/components/sections/Hero";
import { BrandStory } from "@/components/sections/BrandStory";
import { BenefitsTrinity } from "@/components/sections/BenefitsTrinity";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { Testimonial } from "@/components/sections/Testimonial";
import { NewsletterSignup } from "@/components/sections/NewsletterSignup";

export const revalidate = 60;

export default async function HomePage() {
  const [products, pageContent] = await Promise.all([
    sanityClient.fetch(featuredProductsQuery),
    sanityClient.fetch(pageContentQuery),
  ]);

  return (
    <>
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
    </>
  );
}
