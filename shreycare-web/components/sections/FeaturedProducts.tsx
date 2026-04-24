import { ProductCard } from "@/components/ui/ProductCard";
import Link from "next/link";
import { urlFor } from "@/lib/sanity/image";
import type { Product } from "@/types";

interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="py-32 bg-surface-container-lowest">
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <p className="text-secondary font-bold uppercase tracking-widest text-sm mb-4">
              The Collection
            </p>
            <h2 className="text-4xl font-bold text-primary">
              Curated for Your Ritual
            </h2>
          </div>
          <Link
            href="/products"
            className="text-primary font-bold border-b border-primary/20 pb-1"
          >
            View All Products
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
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
