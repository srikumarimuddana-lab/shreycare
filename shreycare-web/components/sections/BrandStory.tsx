import Image from "next/image";

export function BrandStory() {
  return (
    <section className="py-32 bg-surface-container">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <Image
                src="/images/ingredients.jpg"
                alt="Botanical Ingredients"
                width={400}
                height={500}
                className="rounded-lg transform translate-y-12 object-cover"
              />
              <Image
                src="/images/extraction.jpg"
                alt="Oil Extraction"
                width={400}
                height={500}
                className="rounded-lg transform -translate-y-8 object-cover"
              />
            </div>
          </div>
          <div className="space-y-8 order-1 lg:order-2">
            <p className="text-secondary font-bold uppercase tracking-widest text-sm">
              Our Philosophy
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
              Rooted in Earth, <br />
              Refined by Science.
            </h2>
            <p className="text-on-surface-variant leading-relaxed text-lg">
              Shrey Care began in a small greenhouse with a single mission: to
              provide hair nourishment without compromise. We marry ancient
              Ayurvedic wisdom with modern extraction techniques to ensure every
              drop contains the maximum botanical potency.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div>
                <p className="text-3xl font-headline text-primary">100%</p>
                <p className="text-sm text-on-surface-variant uppercase tracking-tighter">
                  Organic Sourcing
                </p>
              </div>
              <div>
                <p className="text-3xl font-headline text-primary">0%</p>
                <p className="text-sm text-on-surface-variant uppercase tracking-tighter">
                  Synthetic Fragrance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
