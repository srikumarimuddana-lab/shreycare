// Events the webhook endpoint understands. Anything else it receives is
// recorded and skipped, so an over-broad webhook configuration never causes
// retry storms. The admin settings page uses this list when it creates a
// webhook endpoint in Stripe, keeping the subscription exactly in sync with
// what the handler implements.
export const HANDLED_STRIPE_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "payment_intent.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
] as const;
