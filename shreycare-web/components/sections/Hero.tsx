import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface HeroProps {
  headline?: string;
  subtext?: string;
  ctaText?: string;
}

// Render the headline upright with the accent word "nature's" italicised in gold,
// mirroring the mockup (whole line is NOT italic).
function renderHeadline(text: string) {
  const parts = text.split(/(nature's)/i);
  return parts.map((part, i) =>
    /^nature's$/i.test(part) ? (
      <em key={i} className="italic font-normal text-secondary">
        {part}
      </em>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function Hero({
  headline = "Nourish your hair with nature's quiet power.",
  subtext = "Cold-pressed oils and rare Ayurvedic herbs, traditionally processed in small batches to preserve every drop of potency.",
  ctaText = "Shop the Collection",
}: HeroProps) {
  return (
    <header className="relative flex items-center overflow-hidden py-14 md:py-20 lg:min-h-[92vh] lg:py-0">
      <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-6 z-10 space-y-6 md:space-y-8">
          <p className="text-xs md:text-sm uppercase tracking-[0.14em] text-secondary font-semibold">
            Ayurvedic Hair Oil &middot; Made in Regina, SK
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-medium text-primary leading-[1.05] tracking-tight">
            {renderHeadline(headline)}
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant max-w-lg leading-relaxed">
            {subtext}
          </p>
          <div className="pt-2 md:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8">
            <Button href="/products">{ctaText}</Button>
            <Button variant="tertiary" href="/about">
              Learn our Process
            </Button>
          </div>
          <div className="flex gap-8 md:gap-10 items-center pt-2">
            <div className="flex flex-col">
              <span className="font-headline text-2xl md:text-3xl text-primary font-semibold">100%</span>
              <span className="text-[11px] uppercase tracking-[0.12em] text-on-surface-variant mt-0.5">Nature sourced</span>
            </div>
            <div className="w-px h-10 bg-outline-variant" />
            <div className="flex flex-col">
              <span className="font-headline text-2xl md:text-3xl text-primary font-semibold">0%</span>
              <span className="text-[11px] uppercase tracking-[0.12em] text-on-surface-variant mt-0.5">Artificial additives</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6 relative mt-4 lg:mt-0">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <Image
              src="/images/hero-product.jpg"
              alt="ShreyCare Organics Botanical Oil"
              fill
              className="relative z-0 aspect-[4/5] rounded-lg shadow-botanical-lg"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
         
          <div className="absolute bottom-5 left-5 md:-bottom-8 md:-left-8 z-20 bg-surface-container-lowest border border-outline-variant p-5 md:p-6 rounded-lg shadow-botanical max-w-[15rem]">
            <p className="text-primary italic font-headline text-lg leading-snug">
              &ldquo;A ritual for the scalp.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
