import Image from "next/image";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Our Ayurvedic Hair Care Story",
  description:
    "ShreyCare Organics is a Canadian ayurvedic hair care brand crafting cold-pressed hair oils with bhringraj, amla, and rare botanicals. 100% organic, cruelty-free, made with ancient herbal wisdom.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="bg-surface min-h-screen">
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-6 md:space-y-8">
            <p className="text-xs md:text-sm uppercase tracking-[0.14em] text-secondary font-semibold">
              Our Story
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-medium text-primary leading-[1.05] tracking-tight">
              Beauty rooted <span className="italic text-secondary">in nature</span>
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed max-w-lg">
              ShreyCare Organics was born from a belief that nature provides everything
              our hair needs to thrive. We source the finest botanicals and
              craft them into luxurious formulations using time-honoured
              Ayurvedic methods rooted in ancient herbal wisdom.
            </p>
          </div>
          <div className="aspect-[4/5] bg-surface-container border border-outline-variant rounded-lg overflow-hidden relative shadow-botanical">
            <Image
              src="/images/about-hero.jpg"
              alt="Botanical garden"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-surface-container">
        <div className="container mx-auto px-6 md:px-10 max-w-3xl space-y-6 md:space-y-8">
          <p className="text-xs md:text-sm uppercase tracking-[0.14em] text-secondary font-semibold">
            Our Process
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-medium text-primary">
            From the garden to the atelier
          </h2>
          <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
            Every ShreyCare Organics product begins its journey in carefully tended
            botanical gardens. Our cold-pressed extraction process preserves
            the full spectrum of nutrients, ensuring that each bottle delivers
            the potency nature intended.
          </p>
          <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
            We never use synthetic fragrances, parabens, or sulfates. Our
            commitment to purity means you can trust every ingredient on our
            label — because what you put on your body matters as much as what
            you put in it.
          </p>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-inverse-surface text-inverse-on-surface">
        <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-6 md:space-y-8">
            <p className="text-secondary-container text-xs md:text-sm uppercase tracking-[0.14em] font-semibold">
              Our Guides
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-medium leading-tight">
              Where herbs meet spirit
            </h2>
            <p className="text-inverse-on-surface/75 text-base md:text-lg leading-relaxed">
              Our formulations are developed in collaboration with Ayurvedic
              practitioners and master herbalists. Every batch is crafted with
              botanicals chosen for their traditional potency and purity —
              guided by the same herbal wisdom that has nourished generations.
            </p>
          </div>
          <PlaceholderImage
            label="hand-harvested herbs and botanicals"
            className="aspect-video rounded-lg"
          />
        </div>
      </section>
    </div>
  );
}
