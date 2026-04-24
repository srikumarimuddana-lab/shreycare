import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";

  // AI crawler bot names — explicitly allowed so our content surfaces in
  // AI search results, overviews, and answer engines.
  const aiBots = [
    "GPTBot",              // OpenAI / ChatGPT search
    "ChatGPT-User",        // ChatGPT browsing mode
    "Google-Extended",     // Google Gemini / AI Overviews
    "GoogleOther",         // Google AI training
    "PerplexityBot",       // Perplexity AI search
    "ClaudeBot",           // Anthropic / Claude
    "anthropic-ai",        // Anthropic training
    "Amazonbot",           // Alexa / Amazon AI
    "Bytespider",          // TikTok / ByteDance AI
    "cohere-ai",           // Cohere AI
    "Meta-ExternalAgent",  // Meta / Facebook AI
    "Meta-ExternalFetcher",// Meta link previews + AI
    "Applebot-Extended",   // Apple Intelligence / Siri
    "YouBot",              // You.com AI search
    "Timpibot",            // Timpi decentralized search
    "OAI-SearchBot",       // OpenAI SearchGPT
    "AI2Bot",              // Allen AI
    "Scrapy",              // Common AI scrapers
    "CCBot",               // Common Crawl (feeds many AI models)
    "Diffbot",             // Diffbot knowledge graph
    "Kangaroo Bot",        // AI search
    "PetalBot",            // Huawei Petal search AI
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/feed/"],
        disallow: ["/api/", "/studio/", "/account/", "/order/", "/admin/"],
      },
      // Welcome every known AI crawler so content appears in AI
      // overviews, ChatGPT, Perplexity, Gemini, Siri, etc.
      ...aiBots.map((bot) => ({
        userAgent: bot,
        allow: ["/"] as string[],
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
