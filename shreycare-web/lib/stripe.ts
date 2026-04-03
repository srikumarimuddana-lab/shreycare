import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set. Add it to your .env.local or enable payments in Vercel.");
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}
