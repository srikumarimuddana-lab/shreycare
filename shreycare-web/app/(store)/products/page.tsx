import { sanityClient } from "@/lib/sanity/client";
import { allProductsQuery } from "@/lib/sanity/queries";
import { ProductCard } from "@/components/ui/ProductCard";
import { urlFor } from "@/lib/sanity/image";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Ayurvedic Hair Oils & Hair Care Products",
  description:
    "Browse our collection of organic, cold-pressed ayurvedic hair oils, hair masks, and botanical treatments. Bhringraj, amla, brahmi & more. Ships across Canada.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "Shop Ayurvedic Hair Oils | ShreyCare Organics Canada",
    description:
      "Organic hair oils and treatments crafted with rare Ayurvedic herbs. Shipped across Canada.",
    type: "website",
  },
};

export const revalidate = 60;

export default async function ProductCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  let products: Product[] = await sanityClient.fetch(allProductsQuery);

  if (params.category) {
    products = products.filter((p) => p.category === params.category);
  }

  if (params.sort === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (params.sort === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  }

  const categories = [
    { value: "", label: "All Products" },
    { value: "hair-oil", label: "Hair Oils" },
    { value: "hair-mask", label: "Hair Masks" },
    { value: "face-mask", label: "Face Masks" },
  ];

  return (
    <section className="py-10 md:py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10">
        <div className="mb-10 md:mb-20">
          <p className="text-xs uppercase tracking-[0.14em] text-secondary font-semibold mb-3 md:mb-4">
            The Collection
          </p>
          <h1 className="font-headline font-medium text-4xl md:text-6xl leading-none tracking-tight text-primary max-w-2xl">
            Curated for <span className="italic">your ritual</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-3 mb-10 md:mb-12">
          {categories.map((cat) => (
            <a
              key={cat.value}
              href={cat.value ? `/products?category=${cat.value}` : "/products"}
              className={`text-sm px-4 py-2 rounded-md transition-colors ${
                params.category === cat.value || (!params.category && !cat.value)
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {cat.label}
            </a>
          ))}
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

        {products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">
              No products found in this category yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
