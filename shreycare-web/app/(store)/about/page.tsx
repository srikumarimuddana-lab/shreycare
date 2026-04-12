import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Beauty rooted in nature. Learn about ShreyCare Organics's mission, ingredients, and botanical heritage.",
};

export default function AboutPage() {
  return (
    <div className="bg-surface min-h-screen">
      <section className="py-32">
        <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-primary leading-tight">
              Beauty Rooted <br />
              <span className="italic font-normal">In Nature</span>
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-lg">
              ShreyCare Organics was born from a belief that nature provides everything
              our hair needs to thrive. We source the finest botanicals and
              craft them into luxurious formulations using time-honored Ayurvedic
              methods refined by modern science.
            </p>
          </div>
          <div className="aspect-[4/5] bg-surface-container rounded-lg overflow-hidden relative">
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

      <section className="py-32 bg-surface-container">
        <div className="container mx-auto px-6 md:px-10 max-w-3xl space-y-8">
          <h2 className="text-3xl font-bold text-primary">
            From the Garden to the Atelier
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Every ShreyCare Organics product begins its journey in carefully tended
            botanical gardens. Our cold-pressed extraction process preserves
            the full spectrum of nutrients, ensuring that each bottle delivers
            the potency nature intended.
          </p>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            We never use synthetic fragrances, parabens, or sulfates. Our
            commitment to purity means you can trust every ingredient on our
            label — because what you put on your body matters as much as what
            you put in it.
          </p>
        </div>
      </section>

      <section className="py-32 bg-primary text-on-primary">
        <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Where Science Meets Spirit
            </h2>
            <p className="text-on-primary/80 text-lg leading-relaxed">
              Our formulations are developed in collaboration with
              trichologists and Ayurvedic practitioners. We test every batch
              for potency and purity, combining the wisdom of ancient
              traditions with rigorous modern standards.
            </p>
          </div>
          <div className="aspect-video bg-primary-container rounded-lg overflow-hidden relative">
            <Image
              src="/images/about-science.jpg"
              alt="Science and nature"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
