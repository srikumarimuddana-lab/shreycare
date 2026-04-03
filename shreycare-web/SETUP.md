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
   - `STRIPE_SECRET_KEY` (starts with `sk_test_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
4. Set up a webhook endpoint pointing to `your-url/api/webhooks/stripe`
   - Events: `checkout.session.completed`
   - Note the webhook signing secret -> `STRIPE_WEBHOOK_SECRET`

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
