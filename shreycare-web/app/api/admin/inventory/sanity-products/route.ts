import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";
import { allProductsAdminQuery } from "@/lib/sanity/queries";
import { isAuthorized } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await sanityClient.fetch(allProductsAdminQuery);
    return NextResponse.json(products ?? []);
  } catch (err) {
    console.error("[admin/inventory/sanity-products] fetch error:", err);
    return NextResponse.json({ error: "Sanity fetch failed" }, { status: 500 });
  }
}
