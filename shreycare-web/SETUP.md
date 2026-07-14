# Shrey Care — Setup Guide

## 1. Install dependencies

```bash
cd shreycare-web
npm install
```

## 2. Set up Sanity

1. Go to https://www.sanity.io/ and create a free account
2. Create a new project called "Shrey Care"
3. Note your **Project ID** and create an API token with write access
4. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET=production`
   - `SANITY_API_TOKEN`
5. Run the dev server and go to `http://localhost:3000/studio` to access Sanity Studio
6. Add your first product, FAQ items, and page content

## 3. Set up Stripe

1. Go to https://dashboard.stripe.com/ and create an account
2. Get your test keys from the Developers section
3. Fill in `.env.local`:
   - `STRIPE_SECRET_KEY` (starts with `sk_test_`; use `sk_live_` for real charges)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
4. Set up the webhook endpoint. The **easiest** way is from the app itself:
   deploy first, then open `/admin/settings` → "Add endpoint". It creates the
   endpoint in Stripe subscribed to exactly the events the site handles and
   shows the signing secret once — copy it into `STRIPE_WEBHOOK_SECRET` and
   redeploy.

   To do it manually in the Stripe Dashboard instead, point a webhook at
   `your-url/api/webhooks/stripe` subscribed to these events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`

   Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`.

### How payments work

- **Card (Stripe):** the order is written to the ledger as `pending`, the
  customer pays on Stripe Checkout, and the signed webhook flips the order to
  `paid`. The browser redirect is never trusted as proof of payment — the
  webhook is the source of truth, verified against Stripe on the success page.
- **e-Transfer / cash:** the order is placed `pending` and the team emails
  payment instructions (unchanged from before).
- **QR / pay link:** from the ledger, any unpaid order has a QR code and a
  shareable `/pay/<token>` link that starts a card payment for that exact
  order — for in-person or follow-up card collection.
- **Refunds:** issue full or partial refunds from the ledger; they go through
  Stripe and the ledger converges via the `charge.refunded` webhook.
- **Edit locking:** once Stripe has captured a charge, that order's amounts and
  payment status mirror the processor and can't be hand-edited — adjust via
  Refund. Cash/e-transfer orders stay fully editable.
- **Analytics & audit:** `/admin/payments` shows revenue by method, refunds,
  disputes, recent Stripe events, and a full order audit trail.

### Required database migration

Run `supabase/migrations/2026-07-13_stripe_payments.sql` in the Supabase SQL
editor. It adds the Stripe columns and per-order pay token to `sales`, plus the
`stripe_webhook_events` (idempotency + audit) and `order_audit_log` tables.

## 4. Set up NextAuth

1. Generate a secret: `openssl rand -base64 32`
2. Fill in `.env.local`:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL=http://localhost:3000`

## 5. Set up Resend (for contact form)

1. Go to https://resend.com/ and create an account
2. Get your API key -> `RESEND_API_KEY`

## 6. Run locally

```bash
npm run dev
```

## 7. Deploy to Vercel

1. Push repo to GitHub
2. Import in Vercel
3. Add all environment variables
4. Deploy
