"use client";

import Image from "next/image";
import { useCart } from "@/lib/cart/CartContext";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { state, removeItem, updateQuantity, total } = useCart();

  async function handleCheckout() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: state.items }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-on-background/40"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-surface-container-lowest shadow-botanical-lg flex flex-col">
        <div className="flex justify-between items-center px-8 py-6">
          <h2 className="font-headline text-2xl text-primary">Your Cart</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant text-2xl hover:text-primary"
            aria-label="Close cart"
          >
            &times;
          </button>
        </div>

        {state.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 space-y-4">
            <p className="text-on-surface-variant">Your cart is empty</p>
            <button
              onClick={onClose}
              className="bg-primary text-on-primary px-8 py-3 rounded-md font-bold hover:opacity-90 transition-all"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-8 space-y-6">
              {state.items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="w-20 h-20 bg-surface-container rounded-lg overflow-hidden relative flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-primary font-bold text-sm truncate">
                      {item.name}
                    </h3>
                    <p className="text-secondary text-sm font-bold mt-1">
                      ${item.price.toFixed(2)} CAD
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-md bg-surface-container-low text-primary text-sm flex items-center justify-center hover:bg-surface-container-high"
                      >
                        -
                      </button>
                      <span className="text-sm text-on-surface font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-md bg-surface-container-low text-primary text-sm flex items-center justify-center hover:bg-surface-container-high"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-on-surface-variant hover:text-error text-sm self-start"
                    aria-label={`Remove ${item.name}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="px-8 py-6 bg-surface-container-low space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant text-sm uppercase tracking-widest">
                  Subtotal
                </span>
                <span className="text-primary font-bold text-xl">
                  ${total.toFixed(2)} CAD
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-primary text-on-primary py-4 rounded-md font-bold hover:opacity-90 transition-all active:scale-[0.98]"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
