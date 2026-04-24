import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import { blogPostBySlugQuery, allBlogPostsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { PortableText } from "next-sanity";
import {
  ArticleSchema,
  BreadcrumbSchema,
} from "@/components/seo/StructuredData";
import type { BlogPost } from "@/types";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";

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

  const ogImage = post.featuredImage
    ? urlFor(post.featuredImage).width(1200).height(630).url()
    : "/images/logo.png";
  const url = `/blog/${slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author] : undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post: BlogPost | null = await sanityClient.fetch(blogPostBySlugQuery, { slug });

  if (!post) notFound();

  const articleImage = post.featuredImage
    ? urlFor(post.featuredImage).width(1200).height(630).url()
    : undefined;

  return (
    <article className="py-16 bg-surface min-h-screen">
      <ArticleSchema
        title={post.title}
        slug={post.slug}
        excerpt={post.excerpt}
        image={articleImage}
        author={post.author}
        publishedAt={post.publishedAt}
        siteUrl={SITE_URL}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
        siteUrl={SITE_URL}
      />
      <div className="container mx-auto px-6 md:px-10 max-w-3xl">
        <Link
          href="/blog"
          className="text-sm text-on-surface-variant hover:text-primary transition-colors mb-8 inline-block"
        >
          &larr; Back to Blog
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
