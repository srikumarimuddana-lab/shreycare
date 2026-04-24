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
    "Learn how to use ayurvedic hair oil, discover bhringraj & amla benefits, and get expert tips for hair growth, dry scalp, and natural hair care. By ShreyCare Organics Canada.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 60;

export default async function BlogPage() {
  const posts: BlogPost[] = await sanityClient.fetch(allBlogPostsQuery);

  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10">
        <div className="mb-16">
          <p className="text-secondary font-bold uppercase tracking-widest text-sm mb-4">
            The Journal
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Botanical Wisdom
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map((post) => (
            <Link key={post._id} href={`/blog/${post.slug}`} className="group space-y-4">
              <div className="aspect-[3/2] bg-surface-container rounded-lg overflow-hidden relative">
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
              <div className="space-y-2">
                {post.category && (
                  <p className="text-xs uppercase tracking-widest text-secondary font-bold">
                    {post.category.replace("-", " ")}
                  </p>
                )}
                <h2 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">
                  {post.title}
                </h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">{post.excerpt}</p>
                <p className="text-xs text-on-surface-variant">
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
            <p className="text-on-surface-variant text-lg">Journal entries coming soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}
