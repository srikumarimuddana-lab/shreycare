import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sanityClient } from "@/lib/sanity/client";
import { productBySlugQuery } from "@/lib/sanity/queries";
import type { CartItem } from "@/lib/cart/types";

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: CartItem[] } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const lineItems = await Promise.all(
      items.map(async (item) => {
        const product = await sanityClient.fetch(productBySlugQuery, { slug: item.slug });

        if (!product || !product.inStock) {
          throw new Error(`Product ${item.name} is unavailable`);
        }

        return {
          price_data: {
            currency: "cad",
            product_data: {
              name: product.name,
              description: product.description || undefined,
            },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: item.quantity,
        };
      })
    );

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["CA"] },
      success_url: `${request.nextUrl.origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/products`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
