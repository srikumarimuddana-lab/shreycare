export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" };
