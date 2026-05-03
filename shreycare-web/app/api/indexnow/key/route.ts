import { NextResponse } from "next/server";

// IndexNow ownership verification file. The key value here MUST match the
// `key` field in the JSON payload sent to https://api.indexnow.org/indexnow.
// IndexNow fetches `keyLocation` (which we set to /api/indexnow/key) and
// expects the response body to contain only the key string.
export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return new NextResponse("INDEXNOW_KEY not configured", { status: 503 });
  }
  return new NextResponse(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
