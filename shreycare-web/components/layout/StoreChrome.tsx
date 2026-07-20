"use client";

import { useState } from "react";
import { AnnouncementBar } from "./AnnouncementBar";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { useCart } from "@/lib/cart/CartContext";

interface StoreChromeProps {
  announcementText?: string | null;
  children: React.ReactNode;
}

export function StoreChrome({ announcementText, children }: StoreChromeProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const { state } = useCart();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <AnnouncementBar text={announcementText} />
      <Navbar cartItemCount={itemCount} onCartClick={() => setCartOpen(true)} />
      <main>{children}</main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
