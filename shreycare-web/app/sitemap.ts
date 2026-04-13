import type { MetadataRoute } from "next";
import { sanityClient } from "@/lib/sanity/client";

interface SitemapProduct {
  slug: string;
  _updatedAt?: string;
}

interface SitemapPost {
  slug: string;
  _updatedAt?: string;
  publishedAt?: string;
}

const sitemapProductsQuery = `*[_type == "product" && inStock == true] {
  "slug": slug.current, _updatedAt
}`;

const sitemapBlogPostsQuery = `*[_type == "blogPost"] {
  "slug": slug.current, _updatedAt, publishedAt
}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";

  const [products, posts] = await Promise.all([
    sanityClient.fetch<SitemapProduct[]>(sitemapProductsQuery).catch(() => []),
    sanityClient.fetch<SitemapPost[]>(sitemapBlogPostsQuery).catch(() => []),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/policies/shipping-returns`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/policies/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: p._updatedAt ? new Date(p._updatedAt) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: p._updatedAt
      ? new Date(p._updatedAt)
      : p.publishedAt
        ? new Date(p.publishedAt)
        : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
