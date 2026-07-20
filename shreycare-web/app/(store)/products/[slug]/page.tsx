import { notFound } from "next/navigation";
import Image from "next/image";
import { PortableText } from "next-sanity";
import { sanityClient } from "@/lib/sanity/client";
import { productBySlugQuery, allProductsQuery, featuredProductsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { ProductCard } from "@/components/ui/ProductCard";
import { AddToCartButton } from "./AddToCartButton";
import {
  BreadcrumbSchema,
  ProductSchema,
} from "@/components/seo/StructuredData";
import type { Product } from "@/types";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";

export const revalidate = 60;

export async function generateStaticParams() {
  const products: Product[] = await sanityClient.fetch(allProductsQuery);
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product: Product | null = await sanityClient.fetch(productBySlugQuery, { slug });
  if (!product) return {};

  const ogImage = product.images?.[0]
    ? urlFor(product.images[0]).width(1200).height(1200).url()
    : "/images/logo.png";
  const url = `/products/${slug}`;

  const seoTitle = `${product.name} — Buy Ayurvedic Hair Oil Online in Canada`;
  const seoDesc = product.description
    ? `${product.description} Shop ${product.name} from ShreyCare Organics. Organic, cold-pressed, shipped across Canada.`
    : `Buy ${product.name} from ShreyCare Organics — organic, cold-pressed ayurvedic hair oil shipped across Canada.`;

  return {
    title: seoTitle,
    description: seoDesc,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: seoTitle,
      description: seoDesc,
      images: [{ url: ogImage, width: 1200, height: 1200, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDesc,
      images: [ogImage],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product: Product | null = await sanityClient.fetch(productBySlugQuery, { slug });

  if (!product) notFound();

  const relatedProducts: Product[] = await sanityClient.fetch(featuredProductsQuery);
  const crossSell = relatedProducts.filter((p) => p._id !== product._id).slice(0, 4);

  const mainImage = product.images?.[0]
    ? urlFor(product.images[0]).width(800).height(1000).url()
    : "/images/placeholder-product.jpg";

  const schemaImages = (product.images ?? [])
    .slice(0, 6)
    .map((img) => urlFor(img).width(1200).height(1200).url());

  return (
    <div className="bg-surface min-h-screen">
      <ProductSchema
        name={product.name}
        slug={product.slug}
        description={product.description}
        price={product.price}
        currency="CAD"
        images={schemaImages.length ? schemaImages : [`${SITE_URL}/images/logo.png`]}
        inStock={product.inStock}
        category={product.category}
        siteUrl={SITE_URL}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/products" },
          { name: product.name, path: `/products/${product.slug}` },
        ]}
        siteUrl={SITE_URL}
      />
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-start">
          {/* Asymmetric Image Gallery logic inspired by mockup */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] bg-surface-container rounded-lg overflow-hidden relative border border-outline-variant shadow-botanical">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-2 gap-4">
                {product.images.slice(1, 3).map((img, i) => (
                  <div key={i} className="aspect-square bg-surface-container rounded-lg overflow-hidden relative border border-outline-variant">
                    <Image
                      src={urlFor(img).width(600).height(600).url()}
                      alt={`${product.name} ${i + 2}`}
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6 md:space-y-8 lg:py-8 lg:sticky lg:top-28">
            <div>
              {product.tags?.[0] && (
                <span className="text-xs uppercase tracking-[0.14em] text-secondary font-semibold">
                  {product.tags[0].replace("-", " ")}
                </span>
              )}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-medium tracking-tight text-primary mt-3 md:mt-4 leading-[1.05]">
                {product.name}
              </h1>
            </div>

            <p className="text-2xl md:text-3xl font-headline font-semibold text-primary">${product.price.toFixed(2)} CAD</p>

            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
              {product.description}
            </p>

            {product.ingredients?.length > 0 && (
              <div className="space-y-4 border-t border-outline-variant pt-6 md:pt-8">
                <h2 className="text-xs uppercase tracking-[0.14em] text-primary font-semibold">Key Ingredients</h2>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ing, i) => (
                    <span key={`${ing}-${i}`} className="bg-surface-container-low border border-outline-variant px-4 py-2 rounded-md text-sm text-on-surface-variant">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 md:pt-4">
              <AddToCartButton
                productId={product._id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                image={mainImage}
                inStock={product.inStock}
                bottleCount={product.bottleCount ?? 1}
                qualifiesForFreeShipping={product.qualifiesForFreeShipping ?? false}
              />
            </div>

            {/* Standard Benefit Icons */}
            <div className="grid grid-cols-3 gap-4 pt-10 md:pt-12 border-t border-outline-variant">
              {[
                { icon: "eco", label: "100% Organic" },
                { icon: "cruelty_free", label: "Cruelty Free" },
                { icon: "spa", label: "Herb-Crafted" }
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <span className="material-symbols-outlined text-secondary text-2xl md:text-3xl">{item.icon}</span>
                  <p className="text-[10px] uppercase tracking-tight text-on-surface-variant mt-2">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Alchemy of Nature */}
      {product.benefits?.length > 0 && (
        <section className="mt-20 md:mt-32 container mx-auto px-6 md:px-10">
          <div className="bg-surface-container border border-outline-variant p-8 md:p-20 rounded-xl overflow-hidden relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-headline font-medium text-primary mb-6 md:mb-8">The Alchemy of Nature</h2>
                <div className="prose prose-sm max-w-none text-on-surface-variant leading-relaxed [&_p]:mb-4 [&_ul]:space-y-4">
                  <PortableText value={product.benefits} />
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/5] bg-surface-container-highest rounded-lg overflow-hidden shadow-botanical-lg">
                  <Image
                    src="/images/ingredients.jpg"
                    alt="Botanical Ingredients"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How to Use - The Ritual */}
      {product.howToUse?.length > 0 && (
        <section className="mt-20 md:mt-32 max-w-4xl mx-auto px-6 md:px-10 text-center">
          <span className="text-xs md:text-sm uppercase tracking-[0.14em] text-secondary font-semibold">The Ritual</span>
          <h2 className="text-3xl md:text-4xl font-headline font-medium text-primary mt-4 mb-10 md:mb-16">How to Use</h2>
          <div className="prose prose-sm max-w-none text-on-surface-variant leading-relaxed text-left grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
             <PortableText value={product.howToUse} />
          </div>
        </section>
      )}

      {crossSell.length > 0 && (
        <section className="py-20 md:py-32 bg-surface-container mt-20 md:mt-32">
          <div className="container mx-auto px-6 md:px-10">
            <h2 className="text-3xl md:text-4xl font-headline font-medium text-primary mb-10 md:mb-12 text-center">Complete the Ritual</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
              {crossSell.map((p) => (
                <ProductCard
                  key={p._id}
                  name={p.name}
                  slug={p.slug}
                  price={p.price}
                  imageUrl={p.images?.[0] ? urlFor(p.images[0]).width(600).height(800).url() : "/images/placeholder-product.jpg"}
                  tag={p.tags?.[0]?.replace("-", " ")}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

