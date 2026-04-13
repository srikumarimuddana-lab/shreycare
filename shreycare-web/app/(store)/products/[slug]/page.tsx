import { notFound } from "next/navigation";
import Image from "next/image";
import { PortableText } from "next-sanity";
import { sanityClient } from "@/lib/sanity/client";
import { productBySlugQuery, allProductsQuery, featuredProductsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { ProductCard } from "@/components/ui/ProductCard";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "@/types";
import type { Metadata } from "next";

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
  return { title: product.name, description: product.description };
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

  return (
    <div className="bg-surface min-h-screen">
      <section className="py-16">
        <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-surface-container rounded-lg overflow-hidden relative">
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
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1).map((img, i) => (
                  <div key={i} className="aspect-square bg-surface-container rounded-lg overflow-hidden relative">
                    <Image
                      src={urlFor(img).width(200).height(200).url()}
                      alt={`${product.name} ${i + 2}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8 lg:py-8">
            {product.tags?.[0] && (
              <span className="text-xs uppercase tracking-widest text-secondary font-bold">
                {product.tags[0].replace("-", " ")}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-primary">{product.name}</h1>
            <p className="text-2xl text-secondary font-bold">${product.price.toFixed(2)} CAD</p>
            <p className="text-on-surface-variant text-lg leading-relaxed">{product.description}</p>

            {product.ingredients?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-widest text-primary font-bold">Key Ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ing) => (
                    <span key={ing} className="bg-surface-container-low px-4 py-2 rounded-md text-sm text-on-surface-variant">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <AddToCartButton
              productId={product._id}
              name={product.name}
              slug={product.slug}
              price={product.price}
              image={mainImage}
              inStock={product.inStock}
            />
          </div>
        </div>
      </section>

      {/* How to Use & Benefits */}
      {(product.howToUse?.length > 0 || product.benefits?.length > 0) && (
        <section className="py-24 bg-surface-container-lowest">
          <div className="container mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-5xl mx-auto">
              {product.howToUse?.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-3xl text-secondary">spa</span>
                    <h2 className="text-2xl font-bold text-primary">How to Use</h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-on-surface-variant leading-relaxed [&_ul]:space-y-2 [&_li]:pl-1 [&_ol]:space-y-2 [&_p]:mb-4">
                    <PortableText value={product.howToUse} />
                  </div>
                </div>
              )}

              {product.benefits?.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-3xl text-secondary">eco</span>
                    <h2 className="text-2xl font-bold text-primary">Benefits</h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-on-surface-variant leading-relaxed [&_ul]:space-y-2 [&_li]:pl-1 [&_ol]:space-y-2 [&_p]:mb-4">
                    <PortableText value={product.benefits} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {crossSell.length > 0 && (
        <section className="py-32 bg-surface-container">
          <div className="container mx-auto px-6 md:px-10">
            <h2 className="text-3xl font-bold text-primary mb-12">Complete the Ritual</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
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

