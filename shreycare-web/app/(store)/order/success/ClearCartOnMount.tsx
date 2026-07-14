"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/CartContext";

// The cart is kept through the Stripe redirect so a cancelled payment brings
// the customer back to an intact cart; it's only cleared once they land on
// the success page.
export function ClearCartOnMount() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
