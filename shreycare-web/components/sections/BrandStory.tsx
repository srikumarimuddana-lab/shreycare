import Image from "next/image";

export function BrandStory() {
  return (
    <section className="py-20 md:py-32 bg-inverse-surface text-inverse-on-surface">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <Image
                src="/images/ingredients.jpg"
                alt="Botanical Ingredients"
                width={400}
                height={500}
                className="rounded-lg translate-y-8 lg:translate-y-12 object-cover"
              />
              <Image
                src="/images/extraction.jpg"
                alt="Oil Extraction"
                width={400}
                height={500}
                className="rounded-lg -translate-y-4 lg:-translate-y-8 object-cover"
              />
            </div>
          </div>
          <div className="space-y-6 md:space-y-8 order-1 lg:order-2">
            <p className="text-secondary-container font-semibold uppercase tracking-[0.14em] text-sm">
              Our Philosophy
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-medium leading-tight">
              Rooted in nature, blended with Ayurveda.
            </h2>
            <p className="text-inverse-on-surface/75 leading-relaxed text-base md:text-lg">
              ShreyCare Organics began with a simple mission: honest hair
              nourishment. Rooted in Ayurveda and crafted with time-honoured
              herbal wisdom, every drop is made to deliver real care.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-2">
              <div>
                <p className="text-4xl font-headline text-secondary-container">100%</p>
                <p className="text-xs text-inverse-on-surface/60 uppercase tracking-[0.1em] mt-1">
                  Nature Sourced
                </p>
              </div>
              <div>
                <p className="text-4xl font-headline text-secondary-container">0%</p>
                <p className="text-xs text-inverse-on-surface/60 uppercase tracking-[0.1em] mt-1">
                  Artificial Additives
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
