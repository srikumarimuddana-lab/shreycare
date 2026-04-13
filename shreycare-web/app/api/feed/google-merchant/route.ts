import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";
import { urlFor } from "@/lib/sanity/image";
import type { Product } from "@/types";

// Re-generate the feed hourly. Merchant Center typically refetches daily, so
// this balances freshness against Sanity API calls.
export const revalidate = 3600;

// Google Product Categories: https://support.google.com/merchants/answer/6324436
// 469 = Health & Beauty > Personal Care > Cosmetics > Hair Care > Hair Oil
const GOOGLE_HAIR_OIL_CATEGORY =
  "Health & Beauty > Personal Care > Cosmetics > Hair Care > Hair Oil";
const GOOGLE_HAIR_MASK_CATEGORY =
  "Health & Beauty > Personal Care > Cosmetics > Hair Care > Hair Care Kits";
const GOOGLE_FACE_MASK_CATEGORY =
  "Health & Beauty > Personal Care > Cosmetics > Skin Care > Skin Care Masks";
const GOOGLE_DEFAULT_CATEGORY =
  "Health & Beauty > Personal Care";

function googleCategory(category: string): string {
  switch (category) {
    case "hair-oil":
      return GOOGLE_HAIR_OIL_CATEGORY;
    case "hair-mask":
      return GOOGLE_HAIR_MASK_CATEGORY;
    case "face-mask":
      return GOOGLE_FACE_MASK_CATEGORY;
    default:
      return GOOGLE_DEFAULT_CATEGORY;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(s: string): string {
  // CDATA can't contain "]]>"; split it if we ever see it.
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";
  const currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || "CAD";

  const products: Product[] = await sanityClient.fetch(
    `*[_type == "product"] | order(sortOrder asc) {
      _id, name, "slug": slug.current, description, price, category,
      images, inStock, tags
    }`,
  );

  const items = products
    .filter((p) => p.slug && p.name && typeof p.price === "number")
    .map((p) => {
      const link = `${siteUrl}/products/${p.slug}`;
      const mainImage = p.images?.[0]
        ? urlFor(p.images[0]).width(1200).height(1200).url()
        : `${siteUrl}/images/logo.png`;
      const additionalImages = (p.images ?? [])
        .slice(1, 11) // Google allows up to 10 additional images
        .map((img) => urlFor(img).width(1200).height(1200).url());
      const description =
        p.description?.trim() ||
        `${p.name} — an Ayurvedic botanical formulation from ShreyCare Organics.`;

      const additionalImageTags = additionalImages
        .map((url) => `    <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`)
        .join("\n");

      return `  <item>
    <g:id>${escapeXml(p.slug)}</g:id>
    <g:title>${cdata(p.name)}</g:title>
    <g:description>${cdata(description)}</g:description>
    <g:link>${escapeXml(link)}</g:link>
    <g:image_link>${escapeXml(mainImage)}</g:image_link>
${additionalImageTags}
    <g:availability>${p.inStock ? "in_stock" : "out_of_stock"}</g:availability>
    <g:price>${p.price.toFixed(2)} ${currency}</g:price>
    <g:brand>ShreyCare Organics</g:brand>
    <g:condition>new</g:condition>
    <g:identifier_exists>no</g:identifier_exists>
    <g:google_product_category>${escapeXml(googleCategory(p.category))}</g:google_product_category>
    <g:product_type>${escapeXml(p.category.replace(/-/g, " "))}</g:product_type>
    <g:mpn>${escapeXml(p.slug)}</g:mpn>
    <g:adult>no</g:adult>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>ShreyCare Organics</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>Luxury botanical hair care crafted with cold-pressed oils and rare herbal infusions.</description>
${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
