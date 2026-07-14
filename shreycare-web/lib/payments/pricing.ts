import { sanityClient } from "@/lib/sanity/client";
import { productBySlugQuery } from "@/lib/sanity/queries";
import { calculateShipping } from "@/lib/cart/shipping";
import { calculateTax } from "@/lib/cart/tax";
import type { CartItem } from "@/lib/cart/types";

export interface PricedItem {
  name: string;
  slug: string;
  price: number;
  quantity: number;
  inStock: boolean;
  bottleCount: number;
  qualifiesForFreeShipping: boolean;
}

export interface PricedOrder {
  items: PricedItem[];
  subtotal: number;
  shipping: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  isLocalDelivery: boolean;
  province: string;
}

// Re-fetch each product from Sanity so a client-side price tamper can never
// change what we charge, then compute shipping/tax/total with the same rules
// regardless of payment method (Stripe, e-transfer, cash).
export async function priceOrder(
  items: CartItem[],
  destination: { city: string; state: string },
): Promise<PricedOrder> {
  const priced = await Promise.all(
    items.map(async (item) => {
      const product = await sanityClient.fetch(productBySlugQuery, {
        slug: item.slug,
      });
      if (!product) {
        throw new Error(`Product not found: ${item.name}`);
      }
      return {
        name: product.name as string,
        slug: product.slug as string,
        price: product.price as number,
        quantity: Math.max(1, Math.floor(item.quantity)),
        inStock: (product.inStock as boolean) ?? false,
        bottleCount: (product.bottleCount as number) ?? 1,
        qualifiesForFreeShipping:
          (product.qualifiesForFreeShipping as boolean) ?? false,
      } satisfies PricedItem;
    }),
  );

  const subtotal = priced.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const isLocalDelivery = destination.city.trim().toLowerCase() === "regina";
  const totalBottles = priced.reduce(
    (sum, i) => sum + i.quantity * i.bottleCount,
    0,
  );
  const hasBundle = priced.some((i) => i.qualifiesForFreeShipping);
  const shipping =
    isLocalDelivery || hasBundle || totalBottles >= 4
      ? 0
      : calculateShipping(totalBottles);
  const province = isLocalDelivery ? "SK" : destination.state;
  const tax = calculateTax(subtotal + shipping, province);
  const total = +(subtotal + shipping + tax.amount).toFixed(2);

  return {
    items: priced,
    subtotal,
    shipping,
    taxRate: tax.rate,
    taxAmount: tax.amount,
    total,
    isLocalDelivery,
    province,
  };
}
