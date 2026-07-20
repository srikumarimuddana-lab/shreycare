import Image from "next/image";
import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import { allBlogPostsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import type { BlogPost } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Ayurvedic Hair Care Tips & Ingredient Guides",
  description:
    "Learn how to use ayurvedic hair oil, discover bhringraj & amla benefits, and get tips for fuller-looking hair, dry-feeling scalp, and natural hair care. By ShreyCare Organics Canada.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 60;

export default async function BlogPage() {
  const posts: BlogPost[] = await sanityClient.fetch(allBlogPostsQuery);

  return (
    <section className="py-10 md:py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10">
        <div className="mb-10 md:mb-16">
          <p className="text-secondary font-semibold uppercase tracking-[0.14em] text-sm mb-3 md:mb-4">
            Our Blog
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-medium text-primary leading-[1.05]">
            Ayurvedic Hair Care Tips &amp; Guides
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className="group block bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden hover:-translate-y-1.5 hover:shadow-botanical transition-all duration-500"
            >
              <div className="aspect-[3/2] bg-surface-container relative">
                {post.featuredImage && (
                  <Image
                    src={urlFor(post.featuredImage).width(600).height(400).url()}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
              </div>
              <div className="p-5 md:p-6 space-y-2">
                {post.category && (
                  <p className="text-xs uppercase tracking-[0.14em] text-secondary font-semibold">
                    {post.category.replace("-", " ")}
                  </p>
                )}
                <h2 className="text-xl md:text-2xl font-headline font-semibold text-primary group-hover:text-primary-container transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">{post.excerpt}</p>
                <p className="text-xs text-on-surface-variant pt-1">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("en-CA", {
                        year: "numeric", month: "long", day: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">Blog posts coming soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}
