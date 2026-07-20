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
  const [qty, setQty] = useState(1);

  if (!inStock) {
    return (
      <button disabled className="w-full bg-surface-container-high text-on-surface-variant py-4 rounded-md font-semibold cursor-not-allowed">
        Out of Stock
      </button>
    );
  }

  function handleAdd() {
    addItem({ productId, name, slug, price, quantity: qty, image, bottleCount, qualifiesForFreeShipping });
    setAdded(true);

    const newCount = cartBottleCount + bottleCount * qty;
    const until = bottlesUntilFreeShipping(newCount);

    if (qualifiesForFreeShipping || newCount >= 4) {
      toast("🌿 FREE shipping unlocked on this order!", "success");
    } else if (until > 0) {
      toast(`${name} added! Add ${until} more bottle${until > 1 ? "s" : ""} for FREE shipping.`, "info");
    } else {
      toast(`${name} added to cart.`, "success");
    }

    setQty(1);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex gap-3 items-stretch">
      <div className="flex items-center border border-outline-variant rounded-md bg-surface-container-lowest">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          className="w-11 md:w-12 h-full text-lg text-primary hover:bg-surface-container-high transition-colors rounded-l-md"
        >
          &minus;
        </button>
        <span className="w-9 text-center font-semibold text-primary" aria-live="polite">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          aria-label="Increase quantity"
          className="w-11 md:w-12 h-full text-lg text-primary hover:bg-surface-container-high transition-colors rounded-r-md"
        >
          +
        </button>
      </div>
      <button
        onClick={handleAdd}
        className="flex-1 bg-primary text-on-primary py-4 rounded-md font-semibold hover:bg-primary-container transition-all active:scale-[0.98]"
      >
        {added ? "Added to Bag ✓" : `Add to Bag — $${(price * qty).toFixed(2)}`}
      </button>
    </div>
  );
}
