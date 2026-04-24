import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/feed/"],
        disallow: ["/api/", "/studio/", "/account/", "/order/", "/admin/"],
      },
      // Explicitly welcome AI crawlers so our content appears in
      // AI overviews, ChatGPT, Perplexity, Bing Copilot, etc.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Amazonbot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
      { userAgent: "cohere-ai", allow: "/" },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
