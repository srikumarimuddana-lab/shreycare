import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface HeroProps {
  headline?: string;
  subtext?: string;
  ctaText?: string;
}

export function Hero({
  headline = "Nourish Your Hair with Nature's Essence",
  subtext = "A rich blend of cold-pressed oils and rare herbs, traditionally processed to enhance natural potency and care.",
  ctaText = "Shop Collection",
}: HeroProps) {
  return (
    <header className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 z-10 space-y-8">
          <p className="text-sm uppercase tracking-widest text-secondary font-bold">
            The Essence of Purity
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-primary leading-tight tracking-tighter">
            Nourish Your Hair with <br />
            <span className="italic font-normal">Nature&apos;s Essence</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
            {subtext}
          </p>
          <div className="pt-6 flex items-center space-x-8">
            <Button href="/products">{ctaText}</Button>
            <Button variant="tertiary" href="/about">
              Learn our Process
            </Button>
          </div>
        </div>
        <div className="lg:col-span-6 relative">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="relative z-0 aspect-[4/5] bg-surface-container rounded-lg overflow-hidden transform rotate-2">
            <Image
              src="/images/hero-product.jpg"
              alt="ShreyCare Organics Botanical Oil"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="absolute -bottom-10 -left-10 z-20 bg-surface-container-lowest p-8 rounded-lg shadow-botanical max-w-xs transform -rotate-3">
            <p className="text-primary italic font-headline text-xl">
              &ldquo;A transformative ritual for the senses and the scalp.&rdquo;
            </p>
            <p className="text-xs uppercase tracking-widest mt-4 text-on-surface-variant">
              &mdash; Vogue Beauty
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
