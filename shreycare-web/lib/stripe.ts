import Stripe from "stripe";
import { getSetting } from "@/lib/settings";

// The Stripe secret key and webhook secret are resolved DB-first (admin panel)
// with an environment-variable fallback, so keys can be configured without a
// redeploy. All accessors are async because resolving the key may read the DB.

let _stripe: Stripe | null = null;
let _keyForClient: string | null = null;

export async function getStripeSecretKey(): Promise<string | undefined> {
  return getSetting("stripe_secret_key");
}

export async function getStripeWebhookSecret(): Promise<string | undefined> {
  return getSetting("stripe_webhook_secret");
}

export async function getStripe(): Promise<Stripe> {
  const key = await getStripeSecretKey();
  if (!key) {
    throw new Error(
      "Stripe secret key is not set. Add it in Admin → Settings, or set STRIPE_SECRET_KEY.",
    );
  }
  // Rebuild the client if the key changed (e.g. admin updated it in the panel).
  if (!_stripe || _keyForClient !== key) {
    _stripe = new Stripe(key, { typescript: true });
    _keyForClient = key;
  }
  return _stripe;
}

export async function isStripeConfigured(): Promise<boolean> {
  return Boolean(await getStripeSecretKey());
}

// Live vs test is derived from the secret key prefix so the admin UI can make
// it impossible to mistake which environment real charges are hitting.
export async function getStripeMode(): Promise<"live" | "test" | "unconfigured"> {
  const key = await getStripeSecretKey();
  if (!key) return "unconfigured";
  return key.startsWith("sk_live_") || key.startsWith("rk_live_")
    ? "live"
    : "test";
}
