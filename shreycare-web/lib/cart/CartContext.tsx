"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import { CartState, CartAction, CartItem } from "./types";

const STORAGE_KEY = "shreycare-cart";

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter(
          (item) => item.productId !== action.payload.productId
        ),
      };
    case "UPDATE_QUANTITY":
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter(
            (item) => item.productId !== action.payload.productId
          ),
        };
      }
      return {
        items: state.items.map((item) =>
          item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CartState;
      parsed.items.forEach((item) =>
        dispatch({ type: "ADD_ITEM", payload: item })
      );
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const addItem = (item: CartItem) =>
    dispatch({ type: "ADD_ITEM", payload: item });
  const removeItem = (productId: string) =>
    dispatch({ type: "REMOVE_ITEM", payload: { productId } });
  const updateQuantity = (productId: string, quantity: number) =>
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } });
  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  return (
    <CartContext.Provider
      value={{ state, addItem, removeItem, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
