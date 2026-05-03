import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";
import {
  allProductsQuery,
  allBlogPostsQuery,
} from "@/lib/sanity/queries";

// IndexNow notifies Bing, Yandex, Naver, Seznam, and Yep about new/updated
// URLs the moment we change content. ChatGPT Search, Copilot, and many AI
// answer engines rely on the Bing index, so this gives AI bots near-instant
// visibility into new posts and products.
//
// Setup (one-time):
//   1. Generate a 32-character hex key (e.g. crypto.randomUUID().replace(/-/g, ''))
//   2. Set INDEXNOW_KEY in your environment (.env.production / Vercel project)
//   3. Trigger this endpoint manually or via Sanity webhook on content publish:
//        POST https://shreycare.com/api/indexnow
//      Or pass specific URLs in the body:
//        POST /api/indexnow  { "urls": ["/products/holistic-hair-oil"] }
//
// The IndexNow key file is served from /api/indexnow/key for verification.

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

async function buildSiteUrls(baseUrl: string): Promise<string[]> {
  const staticPaths = [
    "/",
    "/products",
    "/hair-quiz",
    "/blog",
    "/about",
    "/contact",
    "/faq",
    "/policies/shipping-returns",
    "/policies/privacy",
  ];

  const [products, posts] = await Promise.all([
    sanityClient.fetch<{ slug: string }[]>(allProductsQuery),
    sanityClient.fetch<{ slug: string }[]>(allBlogPostsQuery),
  ]);

  const productPaths = products.map((p) => `/products/${p.slug}`);
  const blogPaths = posts.map((p) => `/blog/${p.slug}`);

  return [...staticPaths, ...productPaths, ...blogPaths].map(
    (path) => `${baseUrl}${path}`
  );
}

export async function POST(req: NextRequest) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "INDEXNOW_KEY env var not configured" },
      { status: 503 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";
  const host = new URL(baseUrl).host;

  let urlList: string[];
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.urls) && body.urls.length > 0) {
      urlList = body.urls.map((u: string) =>
        u.startsWith("http") ? u : `${baseUrl}${u.startsWith("/") ? u : `/${u}`}`
      );
    } else {
      urlList = await buildSiteUrls(baseUrl);
    }
  } catch {
    urlList = await buildSiteUrls(baseUrl);
  }

  const payload = {
    host,
    key,
    keyLocation: `${baseUrl}/9142bec81ff74417abc3f86b35813678.txt`,
    urlList,
  };

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  return NextResponse.json(
    {
      submitted: urlList.length,
      indexNowStatus: res.status,
      ok: res.ok,
    },
    { status: res.ok ? 200 : 502 }
  );
}

export async function GET() {
  return NextResponse.json({
    info: "POST to this endpoint to notify IndexNow of content changes.",
    docs: "See route.ts header for setup instructions.",
  });
}
