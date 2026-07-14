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

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Live vs test is derived from the secret key prefix so the admin UI can make
// it impossible to mistake which environment real charges are hitting.
export function getStripeMode(): "live" | "test" | "unconfigured" {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return "unconfigured";
  return key.startsWith("sk_live_") || key.startsWith("rk_live_")
    ? "live"
    : "test";
}
