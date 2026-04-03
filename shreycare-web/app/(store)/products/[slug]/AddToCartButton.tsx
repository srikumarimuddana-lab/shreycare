"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";

const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  inStock: boolean;
}

export function AddToCartButton({ productId, name, slug, price, image, inStock }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (!paymentsEnabled) {
    return (
      <a
        href="mailto:contact@shreycare.com?subject=Order Inquiry"
        className="w-full block text-center bg-primary text-on-primary py-4 rounded-md font-bold hover:opacity-90 transition-all active:scale-[0.98]"
      >
        Contact to Order
      </a>
    );
  }

  function handleAdd() {
    addItem({ productId, name, slug, price, quantity: 1, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (!inStock) {
    return (
      <button disabled className="w-full bg-surface-container-high text-on-surface-variant py-4 rounded-md font-bold cursor-not-allowed">
        Out of Stock
      </button>
    );
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
