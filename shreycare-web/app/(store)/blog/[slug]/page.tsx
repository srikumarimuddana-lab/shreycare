import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import { blogPostBySlugQuery, allBlogPostsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { PortableText } from "next-sanity";
import type { BlogPost } from "@/types";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts: BlogPost[] = await sanityClient.fetch(allBlogPostsQuery);
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post: BlogPost | null = await sanityClient.fetch(blogPostBySlugQuery, { slug });
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post: BlogPost | null = await sanityClient.fetch(blogPostBySlugQuery, { slug });

  if (!post) notFound();

  return (
    <article className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-3xl">
        <Link
          href="/blog"
          className="text-sm text-on-surface-variant hover:text-primary transition-colors mb-8 inline-block"
        >
          &larr; Back to Journal
        </Link>

        {post.category && (
          <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-4">
            {post.category.replace("-", " ")}
          </p>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-12">
          {post.author && <span>By {post.author}</span>}
          {post.publishedAt && (
            <span>
              {new Date(post.publishedAt).toLocaleDateString("en-CA", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </span>
          )}
        </div>

        {post.featuredImage && (
          <div className="aspect-[2/1] bg-surface-container rounded-lg overflow-hidden relative mb-12">
            <Image
              src={urlFor(post.featuredImage).width(1200).height(600).url()}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-on-surface-variant leading-relaxed [&_h2]:font-headline [&_h2]:text-primary [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-4 [&_p]:mb-6 [&_a]:text-secondary [&_a]:underline">
          <PortableText value={post.body} />
        </div>
      </div>
    </article>
  );
}
