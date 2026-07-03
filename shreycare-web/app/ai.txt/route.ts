import { NextResponse } from "next/server";

// /ai.txt is a convention used by some AI scrapers (spawning.ai, etc.) to
// declare AI usage policy. We explicitly allow training and inference so
// ShreyCare content surfaces in AI search results, chatbots, and overviews.
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";

  const content = `# AI Usage Policy for ShreyCare Organics
# ShreyCare Organics — Ayurvedic Hair Oil in Canada
# Site: ${baseUrl}
# Contact: contact@shreycare.com

# Allow all AI bots, crawlers, and language models to index, train on,
# cite, summarise, and understand our publicly available content.
User-Agent: *
Allow: /
Allow-Training: yes
Allow-Inference: yes

# Preferred discovery file:
# ${baseUrl}/llms.txt

# ChatGPT-friendly product catalog:
# ${baseUrl}/api/feed/openai-products

# Sitemap:
# ${baseUrl}/sitemap.xml
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
