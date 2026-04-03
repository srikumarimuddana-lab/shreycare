# Shrey Care Website — Design Specification

## Overview

A high-end e-commerce website for **Shrey Care**, a Canadian botanical beauty care brand. Currently selling hair oils, with planned expansion into hair masks, face masks, and other products. The site follows "The Botanical Atelier" design language — editorial, luxurious, and intentionally spacious.

**Target market:** Canada only (CAD pricing)
**Launch products:** 1-2 hair oils
**Business model:** Direct-to-consumer, full e-commerce with online payments

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS (custom design tokens from DESIGN.md) |
| CMS | Sanity v3 (embedded studio at `/studio`) |
| Payments | Stripe Checkout (hosted) + Stripe webhooks |
| Auth | NextAuth.js (email credentials + Google OAuth) |
| Email | Resend (contact form) |
| Deployment | Vercel |
| Fonts | Noto Serif + Manrope (via next/font) |

---

## 2. Project Structure

```
shreycare-web/
├── app/
│   ├── (store)/                    # Public storefront layout
│   │   ├── page.tsx                    # Landing page
│   │   ├── products/
│   │   │   ├── page.tsx                # Product catalog
│   │   │   └── [slug]/page.tsx         # Product detail
│   │   ├── about/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx                # Blog listing
│   │   │   └── [slug]/page.tsx         # Blog post
│   │   ├── contact/page.tsx
│   │   ├── faq/page.tsx
│   │   └── policies/
│   │       └── shipping-returns/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── account/
│   │   └── orders/page.tsx             # Order history
│   ├── api/
│   │   ├── checkout/route.ts           # Creates Stripe Checkout session
│   │   ├── webhooks/stripe/route.ts    # Stripe webhook handler
│   │   └── contact/route.ts            # Contact form handler
│   └── studio/[[...index]]/page.tsx    # Sanity Studio
├── components/
│   ├── ui/                             # Design system components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── ProductCard.tsx
│   │   ├── SectionContainer.tsx
│   │   └── BotanicalToast.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── CartDrawer.tsx
│   └── sections/                       # Page-specific sections
├── lib/
│   ├── sanity/
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   └── image.ts
│   ├── stripe/
│   │   └── checkout.ts
│   └── cart/
│       └── CartContext.tsx
├── sanity/
│   ├── schema.ts
│   └── schemas/
│       ├── product.ts
│       ├── blogPost.ts
│       ├── faq.ts
│       ├── pageContent.ts
│       ├── policyPage.ts
│       └── siteSettings.ts
├── tailwind.config.ts
└── .env.local
```

---

## 3. Design System

Implemented from the existing `botanical_heritage/DESIGN.md`. All rules are strictly followed.

### Colors (Tailwind tokens)

```
primary: #384527          on-primary: #ffffff
secondary: #745b1c        on-secondary: #ffffff
surface: #fcf9f4          on-surface: #1c1c19
on-background: #1c1c19    on-surface-variant: #45483f
surface-container-lowest: #ffffff
surface-container-low: #f6f3ee
surface-container: #f0ede8
surface-container-high: #ebe8e3
surface-container-highest: #e5e2dd
secondary-container: #ffdc90
on-secondary-container: #785f20
outline-variant: #c6c8bc
```

### Typography

- **Display (Noto Serif):** 3.5rem, -0.02em letter-spacing — hero headlines
- **Headlines (Noto Serif):** 1.75rem — section titles
- **Body (Manrope):** 1rem — product descriptions, paragraphs
- **Labels (Manrope):** 0.75rem, uppercase, +0.05em tracking — eyebrow headers, tags

### Enforced Rules

- **No borders for sectioning** — only background color shifts between surface layers
- **No `#000000`** — darkest color is `on-background` (#1c1c19)
- **No pill buttons** — max border-radius is `rounded-md` (0.375rem) for primary actions
- **Tinted shadows** — `box-shadow: 0 12px 40px rgba(56, 69, 39, 0.06)` using primary green
- **Ghost borders for inputs** — `outline-variant` at 30% opacity only when needed for accessibility
- **Glassmorphism nav** — `backdrop-filter: blur(20px)` with semi-transparent surface background
- **Generous margins** — 10% lateral padding on desktop, content floats in whitespace
- **Gold accents sparingly** — `secondary` (#745b1c) for icons, active states, premium labels only

### Reusable Components

| Component | Variants | Notes |
|-----------|----------|-------|
| `Button` | primary, secondary, tertiary (editorial link) | Primary: bg-primary. Secondary: bg-secondary-container. Tertiary: no bg, underline gradient |
| `ProductCard` | default, featured | Asymmetric image placement, hover scale (1.05), 700ms transition |
| `SectionContainer` | layer-0 through layer-3 | Handles tonal background layering |
| `Input` | text, email, textarea | surface-container-low bg, focus → surface-container-highest |
| `BotanicalToast` | info, success, error | Backdrop-blur glass, primary left-accent bar |

### Responsive Breakpoints

- Mobile-first approach
- Nav: hamburger menu on mobile, horizontal links on desktop
- Product grids: 1 col (mobile) → 2 col (tablet) → 4 col (desktop)
- Hero: stacked on mobile, 12-col grid on desktop

---

## 4. Sanity CMS Schemas

### Product
```
- name: string (required)
- slug: slug (auto from name)
- description: text
- price: number (CAD)
- category: string ['hair-oil', 'hair-mask', 'face-mask', 'other']
- images: array of image (required, min 1)
- ingredients: array of string
- benefits: block content (rich text)
- howToUse: block content (rich text)
- tags: array of string ['best-seller', 'limited-edition', 'new']
- inStock: boolean (default true)
- sortOrder: number
```

### Blog Post
```
- title: string (required)
- slug: slug (auto from title)
- excerpt: text (max 200 chars)
- featuredImage: image
- body: block content (rich text with embedded images)
- category: string ['ingredients', 'hair-care', 'rituals', 'news']
- publishedAt: datetime
- author: string
```

### FAQ
```
- question: string (required)
- answer: block content (rich text)
- category: string ['ordering', 'shipping', 'products', 'returns']
- sortOrder: number
```

### Page Content
```
- heroHeadline: string
- heroSubtext: text
- heroCTA: string
- testimonials: array of { quote: text, name: string, title: string }
- newsletterHeadline: string
- newsletterSubtext: text
- aboutContent: block content
```

### Policy Page
```
- title: string
- slug: slug
- body: block content (rich text)
```

### Site Settings (singleton)
```
- brandName: string
- logo: image
- contactEmail: string
- contactPhone: string
- socialLinks: { instagram: url, pinterest: url }
- announcementBar: string (optional, shown at top of site)
```

---

## 5. Pages & Features

### Landing Page (`/`)
1. Glassmorphism fixed navbar (logo, links: Home/Catalog/About/Ingredients/Blog, search icon, cart icon with badge)
2. Hero section — headline, subtext, "Shop Collection" CTA, hero image with tilted card, editorial quote overlay
3. Brand story — asymmetric image grid, philosophy text, stats (100% Organic, 0% Synthetic)
4. Trinity of Care — 3-column bento cards (Growth, Shine, Strength) with hover transitions
5. Featured products — 4-column grid pulled from Sanity (tagged products), hover zoom
6. Testimonial — dark green (primary) bg, large italic quote, author
7. Newsletter signup — email input, subscribe button (emails stored in Sanity `subscriber` document for future Mailchimp/Resend integration)
8. Footer — brand description, nav links, social links, copyright

### Product Catalog (`/products`)
- Filter sidebar: category (hair oil, hair mask, face mask)
- Sort: price low-high, price high-low, newest
- Product card grid (responsive 1/2/4 columns)
- Cards show: image, name, subtitle (key ingredients), price, tags

### Product Detail (`/products/[slug]`)
- Image gallery (main image + thumbnails)
- Product info: name, price, description
- Ingredients list
- "Add to Cart" button (primary style)
- Benefits section (rich text from Sanity)
- How to Use section
- "Complete the Ritual" cross-sell (other products)

### Cart (Slide-out Drawer)
- Triggered by cart icon in nav
- Shows: product thumbnail, name, quantity (+/- buttons), price, remove button
- Subtotal at bottom
- "Proceed to Checkout" button
- Empty state with CTA to browse products

### About (`/about`)
- Hero: "Beauty Rooted in Nature"
- Brand story content
- Team/founder section
- "Where Science Meets Spirit" section
- Botanical quiz/personalization CTA

### Blog (`/blog` and `/blog/[slug]`)
- Listing: card grid with featured image, title, excerpt, date
- Detail: rich text rendering, back to blog link

### Contact (`/contact`)
- Form: name, email, subject, message
- Sends email via Resend API
- Success/error toast notifications (BotanicalToast)
- Contact info sidebar (email, social links)

### FAQ (`/faq`)
- Grouped by category (accordion style)
- Smooth expand/collapse animation
- Search/filter optional

### Shipping & Returns (`/policies/shipping-returns`)
- Rich text page from Sanity
- Clean, readable layout

### Auth (`/login`, `/register`)
- Clean forms matching design system
- Google OAuth + email/password
- Redirect to previous page after login

### Account (`/account/orders`)
- Order history table: date, items, total, status
- Protected route (redirect to login if not authenticated)

---

## 6. Cart & Payment Flow

### Cart State Management
- React Context (`CartContext`) wraps the entire app
- State shape: `{ items: CartItem[], total: number }`
- `CartItem`: `{ productId, name, slug, price, quantity, image }`
- Actions: addToCart, removeFromCart, updateQuantity, clearCart
- Persisted to `localStorage` — survives refresh and browser close

### Stripe Checkout Flow

```
1. User clicks "Proceed to Checkout" in cart drawer
2. POST /api/checkout
   - Request body: cart items array
   - Server validates items against Sanity (correct prices, in stock)
   - Creates Stripe Checkout Session:
     - line_items: mapped from cart
     - mode: 'payment'
     - shipping_address_collection: { allowed_countries: ['CA'] }
     - automatic_tax: { enabled: true }
     - customer_email: (if logged in)
     - success_url: /order/success?session_id={CHECKOUT_SESSION_ID}
     - cancel_url: /products
     - metadata: { userId (if logged in) }
   - Returns: { url: session.url }
3. Client redirects to Stripe Checkout page
4. User completes payment (cards, Apple Pay, Google Pay)
5. Stripe redirects to success URL
```

### Webhook Handler (`/api/webhooks/stripe`)

```
Event: checkout.session.completed
1. Verify webhook signature
2. Extract session data (customer email, shipping address, line items, total)
3. Create order document in Sanity:
   - orderNumber: generated
   - customerEmail
   - items: array of { product ref, quantity, price }
   - total
   - shippingAddress
   - status: 'paid'
   - userId: (if logged in, from metadata)
   - createdAt: timestamp
4. Stripe sends receipt email to customer automatically
```

### Order Success Page (`/order/success`)
- Fetches Stripe session by `session_id` query param
- Displays: order confirmation, items purchased, shipping address
- CTA: "Continue Shopping" or "Create Account" (if guest)

---

## 7. SEO & Performance

### SEO
- Dynamic `metadata` export per page (title, description, Open Graph image)
- Product pages: JSON-LD `Product` schema (name, price, availability, currency: CAD)
- Blog posts: JSON-LD `Article` schema
- Auto-generated sitemap via `next-sitemap`
- `robots.txt` allowing all crawlers, disallowing `/studio`

### Performance
- `next/image` for all images — auto WebP, lazy loading, responsive `sizes`
- Sanity images via Sanity CDN with on-the-fly image transforms (crop, resize)
- ISR (Incremental Static Regeneration) for product and blog pages — static at build, revalidates on content change
- Sanity webhook → Vercel on-demand revalidation when content is published
- Fonts loaded via `next/font/google` — no layout shift, no external requests
- Cart drawer is client-side only, all other pages are server-rendered

### Deployment (Vercel)
- GitHub repo connected to Vercel for auto deploys on push
- Environment variables configured in Vercel dashboard
- Sanity webhook triggers revalidation on content publish
- Preview mode for viewing draft content before publishing

### Environment Variables
```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RESEND_API_KEY=
```

---

## 8. Future Expansion Path

The architecture supports growth without restructuring:

- **New product categories** — Add options to `category` field in Sanity product schema. Catalog filters update automatically.
- **More products** — Just add in Sanity. Catalog page handles pagination.
- **Inventory management** — Add `stock` number field to product schema, check in checkout API.
- **Discount codes** — Stripe Checkout supports promotion codes with one config flag.
- **Email marketing** — Newsletter emails stored, integrate with Mailchimp/Resend later.
- **Custom checkout** — Upgrade from Stripe Checkout (hosted) to Stripe Elements for fully on-brand checkout when needed.
- **Multi-currency** — Stripe supports CAD + USD, add currency toggle when expanding beyond Canada.
