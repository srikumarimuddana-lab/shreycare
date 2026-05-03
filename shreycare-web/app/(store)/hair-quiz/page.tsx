import { sanityClient } from "@/lib/sanity/client";
import { hairOilProductsQuery } from "@/lib/sanity/queries";
import { HairQuiz } from "./HairQuiz";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Your Perfect Hair Oil — Hair Care Quiz",
  description:
    "Answer 3 quick questions and we'll recommend the ideal ShreyCare hair oil for your hair type and concerns — holistic, anti-dandruff, or hair growth.",
  alternates: { canonical: "/hair-quiz" },
  openGraph: {
    title: "Find Your Perfect Hair Oil | ShreyCare Organics",
    description:
      "Take our 3-question quiz to get a personalised hair oil recommendation.",
    type: "website",
  },
};

export const revalidate = 60;

export default async function HairQuizPage() {
  const products: Product[] = await sanityClient.fetch(hairOilProductsQuery);

  return (
    <section className="py-20 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-2xl">
        <div className="text-center mb-14">
          <p className="text-secondary font-bold uppercase tracking-widest text-xs mb-4">
            Personalised For You
          </p>
          <h1 className="font-headline text-4xl md:text-5xl text-primary tracking-tight leading-none mb-4">
            Find Your Perfect <span className="italic">Hair Oil</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-md mx-auto">
            Answer 3 quick questions and we&apos;ll match you with the right oil for your hair.
          </p>
        </div>

        <HairQuiz products={products} />
      </div>
    </section>
  );
}
