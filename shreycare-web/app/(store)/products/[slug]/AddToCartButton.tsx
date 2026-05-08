"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { useToast } from "@/components/ui/ToastProvider";
import { bottlesUntilFreeShipping } from "@/lib/cart/shipping";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  inStock: boolean;
  bottleCount?: number;
  qualifiesForFreeShipping?: boolean;
}

export function AddToCartButton({
  productId, name, slug, price, image, inStock,
  bottleCount = 1, qualifiesForFreeShipping = false,
}: AddToCartButtonProps) {
  const { addItem, bottleCount: cartBottleCount, hasFreeShipping } = useCart();
  const toast = useToast();
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return (
      <button disabled className="w-full bg-surface-container-high text-on-surface-variant py-4 rounded-md font-bold cursor-not-allowed">
        Out of Stock
      </button>
    );
  }

  function handleAdd() {
    addItem({ productId, name, slug, price, quantity: 1, image, bottleCount, qualifiesForFreeShipping });
    setAdded(true);

    const newCount = cartBottleCount + bottleCount;
    const until = bottlesUntilFreeShipping(newCount);

    if (qualifiesForFreeShipping || newCount >= 4) {
      toast("🌿 FREE shipping unlocked on this order!", "success");
    } else if (until > 0) {
      toast(`${name} added! Add ${until} more bottle${until > 1 ? "s" : ""} for FREE shipping.`, "info");
    } else {
      toast(`${name} added to cart.`, "success");
    }

    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full bg-primary text-on-primary py-4 rounded-md font-bold hover:opacity-90 transition-all active:scale-[0.98]"
    >
      {added ? "Added to Cart ✓" : "Add to Cart"}
    </button>
  );
}
