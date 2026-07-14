import type { CartItem } from "@/lib/cart/types";

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes?: string;
}

export interface OrderPayload {
  customer: OrderCustomer;
  items: CartItem[];
}

export interface ShippingAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Validate the checkout payload shape shared by the e-transfer order flow and
// the Stripe checkout flow. Returns an error message suitable for the client,
// or null when the payload is usable.
export function validateOrderPayload(body: OrderPayload): string | null {
  const { customer, items } = body ?? {};
  if (!customer?.name || !customer?.email || !customer?.phone) {
    return "Name, email, and phone are required.";
  }
  if (
    !customer.addressLine1 ||
    !customer.city ||
    !customer.state ||
    !customer.postalCode ||
    !customer.country
  ) {
    return "Complete shipping address is required.";
  }
  if (!Array.isArray(items) || items.length === 0) {
    return "Your cart is empty.";
  }
  return null;
}

export function toShippingAddress(customer: OrderCustomer): ShippingAddress {
  return {
    line1: customer.addressLine1,
    line2: customer.addressLine2 || null,
    city: customer.city,
    state: customer.state,
    postalCode: customer.postalCode,
    country: customer.country,
  };
}
