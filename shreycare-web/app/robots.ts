import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";

  return {
    rules: [
      {
        userAgent: "*",
        // Keep /api/feed/ crawlable (Google Merchant Center / feed readers)
        // while blocking the rest of /api/.
        allow: ["/", "/api/feed/"],
        disallow: ["/api/", "/studio/", "/account/", "/order/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
