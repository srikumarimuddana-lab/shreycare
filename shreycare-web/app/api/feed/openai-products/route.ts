import { NextResponse } from "next/server";
import { getDiscoveryProducts } from "@/lib/discovery/products";

export const revalidate = 3600;

function jsonResponse(body: unknown, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function GET() {
  try {
    const products = await getDiscoveryProducts();

    return jsonResponse({
      feed_id: "shreycare-openai-products",
      merchant: "ShreyCare Organics",
      target_country: "CA",
      generated_at: new Date().toISOString(),
      products,
    });
  } catch (error) {
    console.error("[openai-products-feed] Unable to generate feed:", error);

    return jsonResponse(
      {
        error: "Unable to generate ShreyCare product feed.",
      },
      500,
    );
  }
}
