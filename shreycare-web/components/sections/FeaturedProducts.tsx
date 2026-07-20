import { ProductCard } from "@/components/ui/ProductCard";
import Link from "next/link";
import { urlFor } from "@/lib/sanity/image";
import type { Product } from "@/types";

interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="py-20 md:py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
          <div>
            <p className="text-secondary font-semibold uppercase tracking-[0.14em] text-sm mb-3">
              The Collection
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-medium text-primary">
              Curated for your ritual
            </h2>
          </div>
          <Link
            href="/products"
            className="text-primary font-semibold text-sm border-b border-secondary pb-1"
          >
            View all products &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              name={product.name}
              slug={product.slug}
              subtitle={product.description}
              price={product.price}
              imageUrl={
                product.images?.[0]
                  ? urlFor(product.images[0]).width(600).height(800).url()
                  : "/images/placeholder-product.jpg"
              }
              tag={product.tags?.[0]?.replace("-", " ")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
