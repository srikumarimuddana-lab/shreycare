# Shrey Care Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready e-commerce website for Shrey Care, a Canadian botanical hair care brand, deployable to Vercel.

**Architecture:** Next.js 14 App Router with Sanity v3 as headless CMS, Stripe Checkout (hosted) for payments, NextAuth.js for optional user accounts. All content is CMS-driven. The design follows "The Botanical Atelier" editorial aesthetic from DESIGN.md.

**Tech Stack:** Next.js 14 (TypeScript), Tailwind CSS, Sanity v3, Stripe, NextAuth.js, Resend, Vercel

---

## File Map

```
shreycare-web/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts               # Design tokens from DESIGN.md
├── sanity.config.ts                  # Sanity studio config
├── sanity.cli.ts                     # Sanity CLI config
├── .env.local.example                # Template for env vars
├── app/
│   ├── layout.tsx                    # Root layout: fonts, CartProvider, SessionProvider
│   ├── globals.css                   # Tailwind directives + base styles
│   ├── (store)/
│   │   ├── layout.tsx                # Store layout: Navbar + Footer + CartDrawer
│   │   ├── page.tsx                  # Landing page
│   │   ├── products/
│   │   │   ├── page.tsx              # Product catalog
│   │   │   └── [slug]/page.tsx       # Product detail
│   │   ├── about/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx              # Blog listing
│   │   │   └── [slug]/page.tsx       # Blog post detail
│   │   ├── contact/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── policies/
│   │   │   └── shipping-returns/page.tsx
│   │   └── order/
│   │       └── success/page.tsx      # Post-checkout success
│   ├── (auth)/
│   │   ├── layout.tsx                # Auth layout (centered card)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── account/
│   │   ├── layout.tsx                # Protected layout
│   │   └── orders/page.tsx
│   ├── api/
│   │   ├── checkout/route.ts
│   │   ├── webhooks/stripe/route.ts
│   │   ├── contact/route.ts
│   │   ├── newsletter/route.ts
│   │   └── auth/[...nextauth]/route.ts
│   └── studio/[[...index]]/page.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── ProductCard.tsx
│   │   ├── SectionContainer.tsx
│   │   ├── BotanicalToast.tsx
│   │   └── Accordion.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── Footer.tsx
│   │   └── CartDrawer.tsx
│   └── sections/
│       ├── Hero.tsx
│       ├── BrandStory.tsx
│       ├── BenefitsTrinity.tsx
│       ├── FeaturedProducts.tsx
│       ├── Testimonial.tsx
│       └── NewsletterSignup.tsx
├── lib/
│   ├── sanity/
│   │   ├── client.ts                 # Sanity client instance
│   │   ├── queries.ts                # All GROQ queries
│   │   └── image.ts                  # Sanity image URL builder
│   ├── stripe.ts                     # Stripe server instance
│   ├── auth.ts                       # NextAuth config
│   └── cart/
│       ├── CartContext.tsx            # React context + provider
│       └── types.ts                  # CartItem, CartState types
├── sanity/
│   ├── schema.ts                     # Schema index
│   └── schemas/
│       ├── product.ts
│       ├── blogPost.ts
│       ├── faq.ts
│       ├── pageContent.ts
│       ├── policyPage.ts
│       ├── subscriber.ts
│       └── siteSettings.ts
└── types/
    └── index.ts                      # Shared TypeScript types
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `shreycare-web/package.json` (via create-next-app)
- Create: `shreycare-web/tailwind.config.ts`
- Create: `shreycare-web/app/globals.css`
- Create: `shreycare-web/app/layout.tsx`
- Create: `shreycare-web/.env.local.example`

- [ ] **Step 1: Scaffold Next.js project**

Run:
```bash
cd C:/Users/swarn/Documents/shreycare
npx create-next-app@latest shreycare-web --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Expected: New `shreycare-web/` directory with Next.js boilerplate.

- [ ] **Step 2: Install dependencies**

Run:
```bash
cd C:/Users/swarn/Documents/shreycare/shreycare-web
npm install sanity @sanity/client @sanity/image-url next-sanity stripe @stripe/stripe-js next-auth @auth/core resend next-sitemap
npm install -D @types/node
```

- [ ] **Step 3: Configure Tailwind with design tokens**

Replace `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#384527",
        "on-primary": "#ffffff",
        "primary-container": "#4f5d3d",
        "on-primary-container": "#c5d5ad",
        secondary: "#745b1c",
        "on-secondary": "#ffffff",
        "secondary-container": "#ffdc90",
        "on-secondary-container": "#785f20",
        tertiary: "#4d4024",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#655739",
        surface: "#fcf9f4",
        "on-surface": "#1c1c19",
        "surface-dim": "#dcdad5",
        "surface-bright": "#fcf9f4",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3ee",
        "surface-container": "#f0ede8",
        "surface-container-high": "#ebe8e3",
        "surface-container-highest": "#e5e2dd",
        "surface-variant": "#e5e2dd",
        "on-surface-variant": "#45483f",
        "on-background": "#1c1c19",
        background: "#fcf9f4",
        outline: "#75786e",
        "outline-variant": "#c6c8bc",
        "inverse-surface": "#31302d",
        "inverse-on-surface": "#f3f0eb",
        "inverse-primary": "#bccca4",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "surface-tint": "#556343",
      },
      fontFamily: {
        headline: ["var(--font-noto-serif)", "serif"],
        body: ["var(--font-manrope)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
      },
      boxShadow: {
        botanical: "0 12px 40px rgba(56, 69, 39, 0.06)",
        "botanical-lg": "0 20px 60px rgba(56, 69, 39, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Set up global styles**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-surface text-on-background font-body antialiased;
  }
  h1, h2, h3, h4 {
    @apply font-headline;
  }
  ::selection {
    @apply bg-secondary/30;
  }
}

@layer components {
  .glass-nav {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
}
```

- [ ] **Step 5: Set up root layout with fonts**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Noto_Serif, Manrope } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shrey Care | The Botanical Atelier",
    template: "%s | Shrey Care",
  },
  description:
    "Luxury botanical hair care crafted with cold-pressed oils and rare herbal infusions. Rooted in Ayurveda, refined by science.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSerif.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Create env template**

Create `.env.local.example`:

```
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Resend
RESEND_API_KEY=
```

- [ ] **Step 7: Verify dev server starts**

Run:
```bash
cd C:/Users/swarn/Documents/shreycare/shreycare-web
npm run dev
```

Expected: Dev server at `http://localhost:3000` with no errors.

- [ ] **Step 8: Initialize git and commit**

Run:
```bash
cd C:/Users/swarn/Documents/shreycare/shreycare-web
git init
git add .
git commit -m "feat: scaffold Next.js project with design system tokens"
```

---

## Task 2: Shared Types

**Files:**
- Create: `types/index.ts`
- Create: `lib/cart/types.ts`

- [ ] **Step 1: Create shared types**

Create `types/index.ts`:

```ts
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: "hair-oil" | "hair-mask" | "face-mask" | "other";
  images: SanityImage[];
  ingredients: string[];
  benefits: PortableTextBlock[];
  howToUse: PortableTextBlock[];
  tags: string[];
  inStock: boolean;
}

export interface SanityImage {
  _key: string;
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: SanityImage;
  body: PortableTextBlock[];
  category: string;
  publishedAt: string;
  author: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: PortableTextBlock[];
  category: string;
  sortOrder: number;
}

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
}

export interface SiteSettings {
  brandName: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: {
    instagram: string;
    pinterest: string;
  };
  announcementBar?: string;
}

// Portable Text block type (simplified)
export interface PortableTextBlock {
  _type: string;
  _key: string;
  [key: string]: unknown;
}
```

- [ ] **Step 2: Create cart types**

Create `lib/cart/types.ts`:

```ts
export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string; // Sanity image URL
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" };
```

- [ ] **Step 3: Commit**

```bash
git add types/ lib/cart/types.ts
git commit -m "feat: add shared TypeScript types and cart types"
```

---

## Task 3: UI Components — Button, Input, SectionContainer

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/SectionContainer.tsx`

- [ ] **Step 1: Create Button component**

Create `components/ui/Button.tsx`:

```tsx
import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary px-10 py-4 rounded-md font-bold tracking-tight hover:opacity-90 transition-all active:scale-95",
  secondary:
    "bg-secondary-container text-on-secondary-container px-10 py-4 rounded-md font-bold tracking-tight hover:opacity-90 transition-all active:scale-95",
  tertiary:
    "text-primary font-bold border-b border-primary/30 pb-1 hover:border-primary transition-all bg-transparent",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  href,
  ...props
}: ButtonProps) {
  const styles = `${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={styles}>
        {children}
      </a>
    );
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create Input component**

Create `components/ui/Input.tsx`:

```tsx
import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Input({ label, className = "", id, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="text-xs uppercase tracking-widest font-bold text-primary"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-surface-container-low border-none rounded-sm px-6 py-4 text-on-surface font-body focus:bg-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors caret-primary ${className}`}
        {...props}
      />
    </div>
  );
}

export function Textarea({
  label,
  className = "",
  id,
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="text-xs uppercase tracking-widest font-bold text-primary"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full bg-surface-container-low border-none rounded-sm px-6 py-4 text-on-surface font-body focus:bg-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors caret-primary resize-none ${className}`}
        {...props}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create SectionContainer component**

Create `components/ui/SectionContainer.tsx`:

```tsx
type Layer = 0 | 1 | 2 | 3;

interface SectionContainerProps {
  layer?: Layer;
  className?: string;
  children: React.ReactNode;
}

const layerBg: Record<Layer, string> = {
  0: "bg-surface",
  1: "bg-surface-container",
  2: "bg-surface-container-highest",
  3: "bg-surface-container-lowest",
};

export function SectionContainer({
  layer = 0,
  className = "",
  children,
}: SectionContainerProps) {
  return (
    <section className={`py-32 ${layerBg[layer]} ${className}`}>
      <div className="container mx-auto px-6 md:px-10">{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: Verify components render**

Temporarily import one component in `app/page.tsx` (will be replaced later):

```tsx
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface">
      <div className="space-x-4">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
      </div>
    </main>
  );
}
```

Run:
```bash
npm run dev
```

Expected: Three styled buttons visible at `localhost:3000`.

- [ ] **Step 5: Commit**

```bash
git add components/ui/ app/page.tsx
git commit -m "feat: add Button, Input, SectionContainer UI components"
```

---

## Task 4: UI Components — ProductCard, Accordion, BotanicalToast

**Files:**
- Create: `components/ui/ProductCard.tsx`
- Create: `components/ui/Accordion.tsx`
- Create: `components/ui/BotanicalToast.tsx`

- [ ] **Step 1: Create ProductCard component**

Create `components/ui/ProductCard.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  name: string;
  slug: string;
  subtitle: string;
  price: number;
  imageUrl: string;
  tag?: string;
}

export function ProductCard({
  name,
  slug,
  subtitle,
  price,
  imageUrl,
  tag,
}: ProductCardProps) {
  return (
    <Link href={`/products/${slug}`} className="space-y-6 group block">
      <div className="aspect-[3/4] bg-surface-container rounded-lg overflow-hidden relative">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {tag && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-surface-container-lowest text-[10px] uppercase tracking-widest px-3 py-1 rounded-full text-primary font-bold">
              {tag}
            </span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xl font-bold text-primary">{name}</h3>
        <p className="text-on-surface-variant text-sm mt-1">{subtitle}</p>
        <p className="text-secondary font-bold mt-4">
          ${price.toFixed(2)} CAD
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create Accordion component**

Create `components/ui/Accordion.tsx`:

```tsx
"use client";

import { useState } from "react";

interface AccordionItemProps {
  question: string;
  children: React.ReactNode;
}

export function AccordionItem({ question, children }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-surface-container-low rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-8 py-6 text-left hover:bg-surface-container-high transition-colors"
      >
        <span className="text-primary font-bold text-lg pr-4">{question}</span>
        <span
          className={`text-on-surface-variant transition-transform duration-300 ${
            isOpen ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-8 pb-6 text-on-surface-variant leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create BotanicalToast component**

Create `components/ui/BotanicalToast.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

type ToastVariant = "info" | "success" | "error";

interface BotanicalToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onClose: () => void;
}

const variantAccent: Record<ToastVariant, string> = {
  info: "bg-primary",
  success: "bg-primary",
  error: "bg-error",
};

export function BotanicalToast({
  message,
  variant = "info",
  visible,
  onClose,
}: BotanicalToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-stretch bg-surface-container-lowest/90 backdrop-blur-xl rounded-lg shadow-botanical-lg overflow-hidden">
        <div className={`w-1 ${variantAccent[variant]}`} />
        <div className="px-6 py-4 flex items-center gap-4">
          <p className="text-on-surface text-sm font-body">{message}</p>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary text-sm"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/ProductCard.tsx components/ui/Accordion.tsx components/ui/BotanicalToast.tsx
git commit -m "feat: add ProductCard, Accordion, BotanicalToast components"
```

---

## Task 5: Layout — Navbar, MobileMenu, Footer

**Files:**
- Create: `components/layout/Navbar.tsx`
- Create: `components/layout/MobileMenu.tsx`
- Create: `components/layout/Footer.tsx`
- Create: `app/(store)/layout.tsx`

- [ ] **Step 1: Create Navbar**

Create `components/layout/Navbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Catalog" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Journal" },
];

interface NavbarProps {
  cartItemCount: number;
  onCartClick: () => void;
}

export function Navbar({ cartItemCount, onCartClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 glass-nav">
      <div className="flex justify-between items-center px-6 md:px-10 py-6 max-w-[1440px] mx-auto">
        <Link
          href="/"
          className="font-headline text-2xl font-bold text-primary tracking-tighter"
        >
          Shrey Care
        </Link>

        <div className="hidden md:flex space-x-12 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-headline text-lg tracking-tight text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-6">
          <button
            onClick={onCartClick}
            className="relative text-primary hover:opacity-80 transition-transform duration-200 active:scale-95"
            aria-label="Open cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary text-on-secondary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-primary"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={navLinks}
      />
    </nav>
  );
}
```

- [ ] **Step 2: Create MobileMenu**

Create `components/layout/MobileMenu.tsx`:

```tsx
"use client";

import Link from "next/link";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}

export function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-on-background/40"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-72 bg-surface-container-lowest p-8 space-y-8 shadow-botanical-lg">
        <button
          onClick={onClose}
          className="text-primary text-2xl font-light"
          aria-label="Close menu"
        >
          &times;
        </button>
        <nav className="flex flex-col space-y-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="font-headline text-xl text-primary tracking-tight"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Footer**

Create `components/layout/Footer.tsx`:

```tsx
import Link from "next/link";

const discoverLinks = [
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Customer Service" },
  { href: "/faq", label: "FAQ" },
  { href: "/policies/shipping-returns", label: "Shipping & Returns" },
];

const socialLinks = [
  { href: "#", label: "Instagram" },
  { href: "#", label: "Pinterest" },
];

export function Footer() {
  return (
    <footer className="bg-surface-container">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-6 md:px-10 py-16 max-w-[1440px] mx-auto">
        <div className="space-y-6">
          <div className="font-headline text-xl italic text-primary">
            Shrey Care
          </div>
          <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">
            Curating the world&apos;s most potent botanicals for discerning
            individuals who seek purity and performance in every drop.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary font-bold">
              Discover
            </p>
            <ul className="space-y-2">
              {discoverLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm uppercase tracking-widest text-on-surface-variant hover:text-secondary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary font-bold">
              Social
            </p>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm uppercase tracking-widest text-on-surface-variant hover:text-secondary transition-colors duration-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6 md:text-right">
          <p className="text-on-surface-variant text-sm uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Shrey Care. The Botanical Atelier.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Create store layout**

Create `app/(store)/layout.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/cart/CartContext";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const { state } = useCart();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Navbar cartItemCount={itemCount} onCartClick={() => setCartOpen(true)} />
      <main className="pt-20">{children}</main>
      <Footer />
      {/* CartDrawer will be added in Task 10 */}
    </>
  );
}
```

> Note: This layout depends on `CartContext` which is built in Task 9. It will not compile until then. That's expected — we build bottom-up and wire together.

- [ ] **Step 5: Commit**

```bash
git add components/layout/ app/(store)/layout.tsx
git commit -m "feat: add Navbar, MobileMenu, Footer, and store layout"
```

---

## Task 6: Sanity Setup & Schemas

**Files:**
- Create: `sanity.config.ts`
- Create: `sanity.cli.ts`
- Create: `sanity/schema.ts`
- Create: `sanity/schemas/product.ts`
- Create: `sanity/schemas/blogPost.ts`
- Create: `sanity/schemas/faq.ts`
- Create: `sanity/schemas/pageContent.ts`
- Create: `sanity/schemas/policyPage.ts`
- Create: `sanity/schemas/subscriber.ts`
- Create: `sanity/schemas/siteSettings.ts`
- Create: `lib/sanity/client.ts`
- Create: `lib/sanity/image.ts`
- Create: `lib/sanity/queries.ts`
- Create: `app/studio/[[...index]]/page.tsx`

- [ ] **Step 1: Create Sanity config**

Create `sanity.config.ts`:

```ts
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schema } from "./sanity/schema";

export default defineConfig({
  name: "shreycare",
  title: "Shrey Care",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  plugins: [structureTool()],
  schema,
  basePath: "/studio",
});
```

Create `sanity.cli.ts`:

```ts
import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  },
});
```

- [ ] **Step 2: Create product schema**

Create `sanity/schemas/product.ts`:

```ts
import { defineType, defineField } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "price",
      title: "Price (CAD)",
      type: "number",
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Hair Oil", value: "hair-oil" },
          { title: "Hair Mask", value: "hair-mask" },
          { title: "Face Mask", value: "face-mask" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt Text",
              type: "string",
            }),
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "ingredients",
      title: "Ingredients",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "benefits",
      title: "Benefits",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "howToUse",
      title: "How to Use",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Best Seller", value: "best-seller" },
          { title: "Limited Edition", value: "limited-edition" },
          { title: "New", value: "new" },
        ],
      },
    }),
    defineField({
      name: "inStock",
      title: "In Stock",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: "name", media: "images.0" },
  },
});
```

- [ ] **Step 3: Create remaining schemas**

Create `sanity/schemas/blogPost.ts`:

```ts
import { defineType, defineField } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "featuredImage",
      title: "Featured Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alt Text", type: "string" }),
          ],
        },
      ],
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Ingredients", value: "ingredients" },
          { title: "Hair Care", value: "hair-care" },
          { title: "Rituals", value: "rituals" },
          { title: "News", value: "news" },
        ],
      },
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "title", media: "featuredImage" },
  },
});
```

Create `sanity/schemas/faq.ts`:

```ts
import { defineType, defineField } from "sanity";

export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "answer",
      title: "Answer",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Ordering", value: "ordering" },
          { title: "Shipping", value: "shipping" },
          { title: "Products", value: "products" },
          { title: "Returns", value: "returns" },
        ],
      },
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: "question" },
  },
});
```

Create `sanity/schemas/pageContent.ts`:

```ts
import { defineType, defineField } from "sanity";

export const pageContent = defineType({
  name: "pageContent",
  title: "Page Content",
  type: "document",
  fields: [
    defineField({
      name: "heroHeadline",
      title: "Hero Headline",
      type: "string",
    }),
    defineField({
      name: "heroSubtext",
      title: "Hero Subtext",
      type: "text",
    }),
    defineField({
      name: "heroCTA",
      title: "Hero CTA Text",
      type: "string",
    }),
    defineField({
      name: "testimonials",
      title: "Testimonials",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "quote", title: "Quote", type: "text" }),
            defineField({ name: "name", title: "Name", type: "string" }),
            defineField({ name: "title", title: "Title", type: "string" }),
          ],
        },
      ],
    }),
    defineField({
      name: "newsletterHeadline",
      title: "Newsletter Headline",
      type: "string",
    }),
    defineField({
      name: "newsletterSubtext",
      title: "Newsletter Subtext",
      type: "text",
    }),
    defineField({
      name: "aboutContent",
      title: "About Page Content",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
});
```

Create `sanity/schemas/policyPage.ts`:

```ts
import { defineType, defineField } from "sanity";

export const policyPage = defineType({
  name: "policyPage",
  title: "Policy Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
});
```

Create `sanity/schemas/subscriber.ts`:

```ts
import { defineType, defineField } from "sanity";

export const subscriber = defineType({
  name: "subscriber",
  title: "Newsletter Subscriber",
  type: "document",
  fields: [
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "subscribedAt",
      title: "Subscribed At",
      type: "datetime",
    }),
  ],
});
```

Create `sanity/schemas/siteSettings.ts`:

```ts
import { defineType, defineField } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "brandName",
      title: "Brand Name",
      type: "string",
    }),
    defineField({
      name: "contactEmail",
      title: "Contact Email",
      type: "string",
    }),
    defineField({
      name: "contactPhone",
      title: "Contact Phone",
      type: "string",
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "object",
      fields: [
        defineField({ name: "instagram", title: "Instagram URL", type: "url" }),
        defineField({ name: "pinterest", title: "Pinterest URL", type: "url" }),
      ],
    }),
    defineField({
      name: "announcementBar",
      title: "Announcement Bar Text",
      type: "string",
      description: "Leave empty to hide the announcement bar",
    }),
  ],
});
```

- [ ] **Step 4: Create schema index**

Create `sanity/schema.ts`:

```ts
import { type SchemaTypeDefinition } from "sanity";
import { product } from "./schemas/product";
import { blogPost } from "./schemas/blogPost";
import { faq } from "./schemas/faq";
import { pageContent } from "./schemas/pageContent";
import { policyPage } from "./schemas/policyPage";
import { subscriber } from "./schemas/subscriber";
import { siteSettings } from "./schemas/siteSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, blogPost, faq, pageContent, policyPage, subscriber, siteSettings],
};
```

- [ ] **Step 5: Create Sanity client and helpers**

Create `lib/sanity/client.ts`:

```ts
import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: true,
});

export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
```

Create `lib/sanity/image.ts`:

```ts
import imageUrlBuilder from "@sanity/image-url";
import { sanityClient } from "./client";

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: { asset: { _ref: string } }) {
  return builder.image(source);
}
```

Create `lib/sanity/queries.ts`:

```ts
export const allProductsQuery = `*[_type == "product" && inStock == true] | order(sortOrder asc) {
  _id, name, "slug": slug.current, description, price, category, images, ingredients, tags
}`;

export const productBySlugQuery = `*[_type == "product" && slug.current == $slug][0] {
  _id, name, "slug": slug.current, description, price, category, images, ingredients, benefits, howToUse, tags, inStock
}`;

export const productsByCategoryQuery = `*[_type == "product" && category == $category && inStock == true] | order(sortOrder asc) {
  _id, name, "slug": slug.current, description, price, category, images, tags
}`;

export const featuredProductsQuery = `*[_type == "product" && inStock == true] | order(sortOrder asc) [0...4] {
  _id, name, "slug": slug.current, description, price, images, ingredients, tags
}`;

export const allBlogPostsQuery = `*[_type == "blogPost"] | order(publishedAt desc) {
  _id, title, "slug": slug.current, excerpt, featuredImage, category, publishedAt, author
}`;

export const blogPostBySlugQuery = `*[_type == "blogPost" && slug.current == $slug][0] {
  _id, title, "slug": slug.current, excerpt, featuredImage, body, category, publishedAt, author
}`;

export const allFaqsQuery = `*[_type == "faq"] | order(sortOrder asc) {
  _id, question, answer, category
}`;

export const pageContentQuery = `*[_type == "pageContent"][0] {
  heroHeadline, heroSubtext, heroCTA, testimonials, newsletterHeadline, newsletterSubtext, aboutContent
}`;

export const policyPageBySlugQuery = `*[_type == "policyPage" && slug.current == $slug][0] {
  title, body
}`;

export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  brandName, contactEmail, contactPhone, socialLinks, announcementBar
}`;
```

- [ ] **Step 6: Create Sanity Studio page**

Create `app/studio/[[...index]]/page.tsx`:

```tsx
"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

- [ ] **Step 7: Commit**

```bash
git add sanity/ sanity.config.ts sanity.cli.ts lib/sanity/ app/studio/
git commit -m "feat: set up Sanity CMS with all schemas and studio"
```

---

## Task 7: Cart Context & CartDrawer

**Files:**
- Create: `lib/cart/CartContext.tsx`
- Create: `components/layout/CartDrawer.tsx`

- [ ] **Step 1: Create CartContext**

Create `lib/cart/CartContext.tsx`:

```tsx
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
```

- [ ] **Step 2: Create CartDrawer**

Create `components/layout/CartDrawer.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useCart } from "@/lib/cart/CartContext";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { state, removeItem, updateQuantity, total } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-on-background/40"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-surface-container-lowest shadow-botanical-lg flex flex-col">
        <div className="flex justify-between items-center px-8 py-6">
          <h2 className="font-headline text-2xl text-primary">Your Cart</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant text-2xl hover:text-primary"
            aria-label="Close cart"
          >
            &times;
          </button>
        </div>

        {state.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 space-y-4">
            <p className="text-on-surface-variant">Your cart is empty</p>
            <button
              onClick={onClose}
              className="bg-primary text-on-primary px-8 py-3 rounded-md font-bold hover:opacity-90 transition-all"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-8 space-y-6">
              {state.items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="w-20 h-20 bg-surface-container rounded-lg overflow-hidden relative flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-primary font-bold text-sm truncate">
                      {item.name}
                    </h3>
                    <p className="text-secondary text-sm font-bold mt-1">
                      ${item.price.toFixed(2)} CAD
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-md bg-surface-container-low text-primary text-sm flex items-center justify-center hover:bg-surface-container-high"
                      >
                        -
                      </button>
                      <span className="text-sm text-on-surface font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-md bg-surface-container-low text-primary text-sm flex items-center justify-center hover:bg-surface-container-high"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-on-surface-variant hover:text-error text-sm self-start"
                    aria-label={`Remove ${item.name}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="px-8 py-6 bg-surface-container-low space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant text-sm uppercase tracking-widest">
                  Subtotal
                </span>
                <span className="text-primary font-bold text-xl">
                  ${total.toFixed(2)} CAD
                </span>
              </div>
              <form action="/api/checkout" method="POST">
                <input
                  type="hidden"
                  name="items"
                  value={JSON.stringify(state.items)}
                />
                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary py-4 rounded-md font-bold hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  Proceed to Checkout
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire CartProvider into root layout**

Update `app/layout.tsx` — wrap body children with `CartProvider`:

```tsx
import type { Metadata } from "next";
import { Noto_Serif, Manrope } from "next/font/google";
import { CartProvider } from "@/lib/cart/CartContext";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shrey Care | The Botanical Atelier",
    template: "%s | Shrey Care",
  },
  description:
    "Luxury botanical hair care crafted with cold-pressed oils and rare herbal infusions. Rooted in Ayurveda, refined by science.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSerif.variable} ${manrope.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Update store layout with CartDrawer**

Update `app/(store)/layout.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { useCart } from "@/lib/cart/CartContext";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const { state } = useCart();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Navbar cartItemCount={itemCount} onCartClick={() => setCartOpen(true)} />
      <main className="pt-20">{children}</main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/cart/ components/layout/CartDrawer.tsx app/layout.tsx app/(store)/layout.tsx
git commit -m "feat: add cart context, CartDrawer, and wire providers"
```

---

## Task 8: Landing Page Sections

**Files:**
- Create: `components/sections/Hero.tsx`
- Create: `components/sections/BrandStory.tsx`
- Create: `components/sections/BenefitsTrinity.tsx`
- Create: `components/sections/FeaturedProducts.tsx`
- Create: `components/sections/Testimonial.tsx`
- Create: `components/sections/NewsletterSignup.tsx`
- Create: `app/(store)/page.tsx`

- [ ] **Step 1: Create Hero section**

Create `components/sections/Hero.tsx`:

```tsx
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface HeroProps {
  headline?: string;
  subtext?: string;
  ctaText?: string;
}

export function Hero({
  headline = "Nurture Your Hair with Nature's Finest",
  subtext = "Experience the botanical alchemy of cold-pressed oils and rare herbal infusions. Crafted in small batches for the modern atelier.",
  ctaText = "Shop Collection",
}: HeroProps) {
  return (
    <header className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 z-10 space-y-8">
          <p className="text-sm uppercase tracking-widest text-secondary font-bold">
            The Essence of Purity
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-primary leading-tight tracking-tighter">
            {headline.split(" with ")[0]} <br />
            <span className="italic font-normal">
              with {headline.split(" with ")[1]}
            </span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
            {subtext}
          </p>
          <div className="pt-6 flex items-center space-x-8">
            <Button href="/products">{ctaText}</Button>
            <Button variant="tertiary" href="/about">
              Learn our Process
            </Button>
          </div>
        </div>
        <div className="lg:col-span-6 relative">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="relative z-0 aspect-[4/5] bg-surface-container rounded-lg overflow-hidden transform rotate-2">
            <Image
              src="/images/hero-product.jpg"
              alt="Shrey Care Botanical Oil"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="absolute -bottom-10 -left-10 z-20 bg-surface-container-lowest p-8 rounded-lg shadow-botanical max-w-xs transform -rotate-3">
            <p className="text-primary italic font-headline text-xl">
              &ldquo;A transformative ritual for the senses and the scalp.&rdquo;
            </p>
            <p className="text-xs uppercase tracking-widest mt-4 text-on-surface-variant">
              &mdash; Vogue Beauty
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create BrandStory section**

Create `components/sections/BrandStory.tsx`:

```tsx
import Image from "next/image";

export function BrandStory() {
  return (
    <section className="py-32 bg-surface-container">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <Image
                src="/images/ingredients.jpg"
                alt="Botanical Ingredients"
                width={400}
                height={500}
                className="rounded-lg transform translate-y-12 object-cover"
              />
              <Image
                src="/images/extraction.jpg"
                alt="Oil Extraction"
                width={400}
                height={500}
                className="rounded-lg transform -translate-y-8 object-cover"
              />
            </div>
          </div>
          <div className="space-y-8 order-1 lg:order-2">
            <p className="text-secondary font-bold uppercase tracking-widest text-sm">
              Our Philosophy
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
              Rooted in Earth, <br />
              Refined by Science.
            </h2>
            <p className="text-on-surface-variant leading-relaxed text-lg">
              Shrey Care began in a small greenhouse with a single mission: to
              provide hair nourishment without compromise. We marry ancient
              Ayurvedic wisdom with modern extraction techniques to ensure every
              drop contains the maximum botanical potency.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div>
                <p className="text-3xl font-headline text-primary">100%</p>
                <p className="text-sm text-on-surface-variant uppercase tracking-tighter">
                  Organic Sourcing
                </p>
              </div>
              <div>
                <p className="text-3xl font-headline text-primary">0%</p>
                <p className="text-sm text-on-surface-variant uppercase tracking-tighter">
                  Synthetic Fragrance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create BenefitsTrinity section**

Create `components/sections/BenefitsTrinity.tsx`:

```tsx
const benefits = [
  {
    icon: "🌿",
    title: "Lush Growth",
    description:
      "Infused with rosemary and bhringraj to stimulate the follicle and encourage thicker, fuller hair cycles.",
  },
  {
    icon: "✨",
    title: "Mirror Shine",
    description:
      "Argan and Camellia oils smooth the cuticle for a weightless, light-reflecting finish that never feels greasy.",
  },
  {
    icon: "🛡️",
    title: "True Strength",
    description:
      "Amla and Vitamin E work to fortify the hair shaft from within, preventing breakage and split ends.",
  },
];

export function BenefitsTrinity() {
  return (
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-primary mb-6">
            The Trinity of Care
          </h2>
          <p className="text-on-surface-variant">
            Three pillars of botanical health designed to restore, rejuvenate,
            and protect your crown.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-surface-container-low p-12 rounded-lg group hover:bg-surface-container-high transition-all duration-500"
            >
              <div className="text-4xl mb-8">{benefit.icon}</div>
              <h3 className="text-2xl font-bold text-primary mb-4">
                {benefit.title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create FeaturedProducts section**

Create `components/sections/FeaturedProducts.tsx`:

```tsx
import { ProductCard } from "@/components/ui/ProductCard";
import { urlFor } from "@/lib/sanity/image";
import type { Product } from "@/types";

interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="py-32 bg-surface-container-lowest">
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <p className="text-secondary font-bold uppercase tracking-widest text-sm mb-4">
              The Collection
            </p>
            <h2 className="text-4xl font-bold text-primary">
              Selected for Your Ritual
            </h2>
          </div>
          <a
            href="/products"
            className="text-primary font-bold border-b border-primary/20 pb-1"
          >
            View All Products
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              name={product.name}
              slug={product.slug}
              subtitle={product.ingredients?.slice(0, 2).join(" & ") ?? ""}
              price={product.price}
              imageUrl={
                product.images?.[0]
                  ? urlFor(product.images[0]).width(600).height(800).url()
                  : "/images/placeholder-product.jpg"
              }
              tag={product.tags?.[0]?.replace("-", " ")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create Testimonial section**

Create `components/sections/Testimonial.tsx`:

```tsx
import type { Testimonial as TestimonialType } from "@/types";

interface TestimonialProps {
  testimonial?: TestimonialType;
}

const defaultTestimonial: TestimonialType = {
  quote:
    "Since incorporating Shrey Care into my weekly ritual, my hair feels like silk. It's not just an oil, it's a moment of profound self-care that I look forward to every single day.",
  name: "Elena Rodriguez",
  title: "Architect & Creative Director",
};

export function Testimonial({
  testimonial = defaultTestimonial,
}: TestimonialProps) {
  return (
    <section className="py-32 bg-primary text-on-primary relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-10 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="text-6xl text-secondary">&ldquo;</div>
          <h2 className="text-3xl md:text-5xl font-headline italic leading-relaxed">
            &ldquo;{testimonial.quote}&rdquo;
          </h2>
          <div className="space-y-2">
            <p className="uppercase tracking-[0.2em] font-bold text-secondary">
              {testimonial.name}
            </p>
            <p className="text-sm opacity-60">{testimonial.title}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create NewsletterSignup section**

Create `components/sections/NewsletterSignup.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10">
        <div className="bg-surface-container rounded-2xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:max-w-md space-y-4">
            <h2 className="text-3xl font-bold text-primary">
              Join the Atelier
            </h2>
            <p className="text-on-surface-variant">
              Receive botanical tips, exclusive early access to small batches,
              and 10% off your first order.
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="w-full md:w-auto flex flex-col sm:flex-row gap-4"
          >
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="min-w-[300px]"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-primary text-on-primary px-8 py-4 rounded-md font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
          {status === "success" && (
            <p className="text-primary text-sm font-bold">Welcome to the Atelier!</p>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Assemble landing page**

Create `app/(store)/page.tsx`:

```tsx
import { sanityClient } from "@/lib/sanity/client";
import { featuredProductsQuery, pageContentQuery } from "@/lib/sanity/queries";
import { Hero } from "@/components/sections/Hero";
import { BrandStory } from "@/components/sections/BrandStory";
import { BenefitsTrinity } from "@/components/sections/BenefitsTrinity";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { Testimonial } from "@/components/sections/Testimonial";
import { NewsletterSignup } from "@/components/sections/NewsletterSignup";

export const revalidate = 60;

export default async function HomePage() {
  const [products, pageContent] = await Promise.all([
    sanityClient.fetch(featuredProductsQuery),
    sanityClient.fetch(pageContentQuery),
  ]);

  return (
    <>
      <Hero
        headline={pageContent?.heroHeadline}
        subtext={pageContent?.heroSubtext}
        ctaText={pageContent?.heroCTA}
      />
      <BrandStory />
      <BenefitsTrinity />
      <FeaturedProducts products={products} />
      <Testimonial testimonial={pageContent?.testimonials?.[0]} />
      <NewsletterSignup />
    </>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add components/sections/ app/(store)/page.tsx
git commit -m "feat: build landing page with all sections"
```

---

## Task 9: Product Catalog Page

**Files:**
- Create: `app/(store)/products/page.tsx`

- [ ] **Step 1: Create product catalog page**

Create `app/(store)/products/page.tsx`:

```tsx
import { sanityClient } from "@/lib/sanity/client";
import { allProductsQuery } from "@/lib/sanity/queries";
import { ProductCard } from "@/components/ui/ProductCard";
import { urlFor } from "@/lib/sanity/image";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Catalog",
  description:
    "Explore our curated collection of botanical hair oils and treatments.",
};

export const revalidate = 60;

export default async function ProductCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  let products: Product[] = await sanityClient.fetch(allProductsQuery);

  // Filter by category
  if (params.category) {
    products = products.filter((p) => p.category === params.category);
  }

  // Sort
  if (params.sort === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (params.sort === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  }

  const categories = [
    { value: "", label: "All Products" },
    { value: "hair-oil", label: "Hair Oils" },
    { value: "hair-mask", label: "Hair Masks" },
    { value: "face-mask", label: "Face Masks" },
  ];

  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10">
        <div className="mb-16">
          <p className="text-secondary font-bold uppercase tracking-widest text-sm mb-4">
            The Collection
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary italic">
            Curated Elixirs for Organic Radiance
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-12">
          {categories.map((cat) => (
            <a
              key={cat.value}
              href={
                cat.value
                  ? `/products?category=${cat.value}`
                  : "/products"
              }
              className={`text-sm uppercase tracking-widest px-4 py-2 rounded-md transition-colors ${
                params.category === cat.value ||
                (!params.category && !cat.value)
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {cat.label}
            </a>
          ))}

          <div className="ml-auto">
            <select
              className="bg-surface-container-low text-on-surface-variant text-sm px-4 py-2 rounded-md border-none focus:ring-1 focus:ring-primary/30"
              defaultValue={params.sort || ""}
            >
              <option value="">Sort by</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              name={product.name}
              slug={product.slug}
              subtitle={product.ingredients?.slice(0, 2).join(" & ") ?? ""}
              price={product.price}
              imageUrl={
                product.images?.[0]
                  ? urlFor(product.images[0]).width(600).height(800).url()
                  : "/images/placeholder-product.jpg"
              }
              tag={product.tags?.[0]?.replace("-", " ")}
            />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">
              No products found in this category yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(store)/products/page.tsx
git commit -m "feat: add product catalog page with filters"
```

---

## Task 10: Product Detail Page

**Files:**
- Create: `app/(store)/products/[slug]/page.tsx`

- [ ] **Step 1: Create product detail page**

Create `app/(store)/products/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { sanityClient } from "@/lib/sanity/client";
import {
  productBySlugQuery,
  allProductsQuery,
  featuredProductsQuery,
} from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { ProductCard } from "@/components/ui/ProductCard";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateStaticParams() {
  const products: Product[] = await sanityClient.fetch(allProductsQuery);
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product: Product | null = await sanityClient.fetch(productBySlugQuery, {
    slug,
  });
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product: Product | null = await sanityClient.fetch(productBySlugQuery, {
    slug,
  });

  if (!product) notFound();

  const relatedProducts: Product[] = await sanityClient.fetch(
    featuredProductsQuery
  );
  const crossSell = relatedProducts
    .filter((p) => p._id !== product._id)
    .slice(0, 4);

  const mainImage = product.images?.[0]
    ? urlFor(product.images[0]).width(800).height(1000).url()
    : "/images/placeholder-product.jpg";

  return (
    <div className="bg-surface min-h-screen">
      {/* Product Hero */}
      <section className="py-16">
        <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-surface-container rounded-lg overflow-hidden relative">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1).map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-surface-container rounded-lg overflow-hidden relative"
                  >
                    <Image
                      src={urlFor(img).width(200).height(200).url()}
                      alt={`${product.name} ${i + 2}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8 lg:py-8">
            {product.tags?.[0] && (
              <span className="text-xs uppercase tracking-widest text-secondary font-bold">
                {product.tags[0].replace("-", " ")}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-primary">
              {product.name}
            </h1>
            <p className="text-2xl text-secondary font-bold">
              ${product.price.toFixed(2)} CAD
            </p>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              {product.description}
            </p>

            {/* Ingredients */}
            {product.ingredients?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-widest text-primary font-bold">
                  Key Ingredients
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="bg-surface-container-low px-4 py-2 rounded-md text-sm text-on-surface-variant"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <AddToCartButton
              productId={product._id}
              name={product.name}
              slug={product.slug}
              price={product.price}
              image={mainImage}
              inStock={product.inStock}
            />
          </div>
        </div>
      </section>

      {/* Cross-sell */}
      {crossSell.length > 0 && (
        <section className="py-32 bg-surface-container">
          <div className="container mx-auto px-6 md:px-10">
            <h2 className="text-3xl font-bold text-primary mb-12">
              Complete the Ritual
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {crossSell.map((p) => (
                <ProductCard
                  key={p._id}
                  name={p.name}
                  slug={p.slug}
                  subtitle={p.ingredients?.slice(0, 2).join(" & ") ?? ""}
                  price={p.price}
                  imageUrl={
                    p.images?.[0]
                      ? urlFor(p.images[0]).width(600).height(800).url()
                      : "/images/placeholder-product.jpg"
                  }
                  tag={p.tags?.[0]?.replace("-", " ")}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create AddToCartButton client component**

Create `app/(store)/products/[slug]/AddToCartButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  inStock: boolean;
}

export function AddToCartButton({
  productId,
  name,
  slug,
  price,
  image,
  inStock,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ productId, name, slug, price, quantity: 1, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (!inStock) {
    return (
      <button
        disabled
        className="w-full bg-surface-container-high text-on-surface-variant py-4 rounded-md font-bold cursor-not-allowed"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full bg-primary text-on-primary py-4 rounded-md font-bold hover:opacity-90 transition-all active:scale-[0.98]"
    >
      {added ? "Added to Cart ✓" : "Add to Cart"}
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(store)/products/
git commit -m "feat: add product detail page with add-to-cart"
```

---

## Task 11: Stripe Checkout API

**Files:**
- Create: `lib/stripe.ts`
- Create: `app/api/checkout/route.ts`
- Create: `app/api/webhooks/stripe/route.ts`
- Create: `app/(store)/order/success/page.tsx`

- [ ] **Step 1: Create Stripe server instance**

Create `lib/stripe.ts`:

```ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});
```

- [ ] **Step 2: Create checkout API route**

Create `app/api/checkout/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sanityClient } from "@/lib/sanity/client";
import { productBySlugQuery } from "@/lib/sanity/queries";
import type { CartItem } from "@/lib/cart/types";

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: CartItem[] } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate prices against Sanity
    const lineItems = await Promise.all(
      items.map(async (item) => {
        const product = await sanityClient.fetch(productBySlugQuery, {
          slug: item.slug,
        });

        if (!product || !product.inStock) {
          throw new Error(`Product ${item.name} is unavailable`);
        }

        return {
          price_data: {
            currency: "cad",
            product_data: {
              name: product.name,
              description: product.description || undefined,
            },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: item.quantity,
        };
      })
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["CA"] },
      automatic_tax: { enabled: true },
      success_url: `${request.nextUrl.origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/products`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create Stripe webhook handler**

Create `app/api/webhooks/stripe/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sanityWriteClient } from "@/lib/sanity/client";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    await sanityWriteClient.create({
      _type: "order",
      orderNumber: `SC-${Date.now()}`,
      customerEmail: session.customer_details?.email,
      items: lineItems.data.map((item) => ({
        _type: "orderItem",
        _key: item.id,
        name: item.description,
        quantity: item.quantity,
        price: (item.amount_total || 0) / 100,
      })),
      total: (session.amount_total || 0) / 100,
      shippingAddress: session.shipping_details?.address,
      status: "paid",
      stripeSessionId: session.id,
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ received: true });
}
```

> Note: This creates an `order` document type in Sanity. Add the following schema if order management is needed later. For now, orders are stored as raw documents.

- [ ] **Step 4: Create order success page**

Create `app/(store)/order/success/page.tsx`:

```tsx
import { stripe } from "@/lib/stripe";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;

  if (!params.session_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-on-surface-variant">No order found.</p>
      </div>
    );
  }

  const session = await stripe.checkout.sessions.retrieve(params.session_id, {
    expand: ["line_items"],
  });

  return (
    <section className="min-h-screen py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10 max-w-2xl text-center space-y-8">
        <div className="text-6xl">🌿</div>
        <h1 className="text-4xl font-bold text-primary">
          Thank You for Your Order
        </h1>
        <p className="text-on-surface-variant text-lg">
          Your botanical ritual is on its way. A confirmation email has been sent
          to <strong>{session.customer_details?.email}</strong>.
        </p>

        <div className="bg-surface-container rounded-2xl p-8 text-left space-y-6">
          <div className="flex justify-between">
            <span className="text-sm uppercase tracking-widest text-on-surface-variant">
              Order Total
            </span>
            <span className="text-primary font-bold text-xl">
              ${((session.amount_total || 0) / 100).toFixed(2)} CAD
            </span>
          </div>

          {session.line_items?.data.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="text-on-surface">
                {item.description} &times; {item.quantity}
              </span>
              <span className="text-on-surface-variant">
                ${((item.amount_total || 0) / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/products"
          className="inline-block bg-primary text-on-primary px-10 py-4 rounded-md font-bold hover:opacity-90 transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Update CartDrawer to use fetch for checkout**

Update the checkout button in `components/layout/CartDrawer.tsx` — replace the `<form>` with a client-side fetch:

Replace the form section at the bottom with:

```tsx
<button
  onClick={async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: state.items }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }}
  className="w-full bg-primary text-on-primary py-4 rounded-md font-bold hover:opacity-90 transition-all active:scale-[0.98]"
>
  Proceed to Checkout
</button>
```

Remove the `<form>` and `<input type="hidden">` that were there before.

- [ ] **Step 6: Commit**

```bash
git add lib/stripe.ts app/api/checkout/ app/api/webhooks/ app/(store)/order/ components/layout/CartDrawer.tsx
git commit -m "feat: add Stripe checkout, webhook, and order success page"
```

---

## Task 12: Newsletter API

**Files:**
- Create: `app/api/newsletter/route.ts`

- [ ] **Step 1: Create newsletter API**

Create `app/api/newsletter/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { sanityWriteClient } from "@/lib/sanity/client";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await sanityWriteClient.create({
      _type: "subscriber",
      email,
      subscribedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/newsletter/
git commit -m "feat: add newsletter subscription API"
```

---

## Task 13: About Page

**Files:**
- Create: `app/(store)/about/page.tsx`

- [ ] **Step 1: Create about page**

Create `app/(store)/about/page.tsx`:

```tsx
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Beauty rooted in nature. Learn about Shrey Care's mission, ingredients, and botanical heritage.",
};

export default function AboutPage() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Hero */}
      <section className="py-32">
        <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-primary leading-tight">
              Beauty Rooted <br />
              <span className="italic font-normal">In Nature</span>
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-lg">
              Shrey Care was born from a belief that nature provides everything
              our hair needs to thrive. We source the finest botanicals and
              craft them into luxurious formulations using time-honored Ayurvedic
              methods refined by modern science.
            </p>
          </div>
          <div className="aspect-[4/5] bg-surface-container rounded-lg overflow-hidden relative">
            <Image
              src="/images/about-hero.jpg"
              alt="Botanical garden"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-32 bg-surface-container">
        <div className="container mx-auto px-6 md:px-10 max-w-3xl space-y-8">
          <h2 className="text-3xl font-bold text-primary">
            From the Garden to the Atelier
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Every Shrey Care product begins its journey in carefully tended
            botanical gardens. Our cold-pressed extraction process preserves
            the full spectrum of nutrients, ensuring that each bottle delivers
            the potency nature intended.
          </p>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            We never use synthetic fragrances, parabens, or sulfates. Our
            commitment to purity means you can trust every ingredient on our
            label — because what you put on your body matters as much as what
            you put in it.
          </p>
        </div>
      </section>

      {/* Science Section */}
      <section className="py-32 bg-primary text-on-primary">
        <div className="container mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Where Science Meets Spirit
            </h2>
            <p className="text-on-primary/80 text-lg leading-relaxed">
              Our formulations are developed in collaboration with
              trichologists and Ayurvedic practitioners. We test every batch
              for potency and purity, combining the wisdom of ancient
              traditions with rigorous modern standards.
            </p>
          </div>
          <div className="aspect-video bg-primary-container rounded-lg overflow-hidden relative">
            <Image
              src="/images/about-science.jpg"
              alt="Science and nature"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(store)/about/
git commit -m "feat: add about page"
```

---

## Task 14: Blog Pages

**Files:**
- Create: `app/(store)/blog/page.tsx`
- Create: `app/(store)/blog/[slug]/page.tsx`

- [ ] **Step 1: Create blog listing page**

Create `app/(store)/blog/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import { allBlogPostsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import type { BlogPost } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal",
  description: "Botanical wisdom, hair care rituals, and ingredient deep-dives.",
};

export const revalidate = 60;

export default async function BlogPage() {
  const posts: BlogPost[] = await sanityClient.fetch(allBlogPostsQuery);

  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10">
        <div className="mb-16">
          <p className="text-secondary font-bold uppercase tracking-widest text-sm mb-4">
            The Journal
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Botanical Wisdom
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className="group space-y-4"
            >
              <div className="aspect-[3/2] bg-surface-container rounded-lg overflow-hidden relative">
                {post.featuredImage && (
                  <Image
                    src={urlFor(post.featuredImage).width(600).height(400).url()}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
              </div>
              <div className="space-y-2">
                {post.category && (
                  <p className="text-xs uppercase tracking-widest text-secondary font-bold">
                    {post.category.replace("-", " ")}
                  </p>
                )}
                <h2 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">
                  {post.title}
                </h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {post.excerpt}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">
              Journal entries coming soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create blog post detail page**

Create `app/(store)/blog/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import {
  blogPostBySlugQuery,
  allBlogPostsQuery,
} from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { PortableText } from "next-sanity";
import type { BlogPost } from "@/types";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts: BlogPost[] = await sanityClient.fetch(allBlogPostsQuery);
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post: BlogPost | null = await sanityClient.fetch(blogPostBySlugQuery, {
    slug,
  });
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post: BlogPost | null = await sanityClient.fetch(blogPostBySlugQuery, {
    slug,
  });

  if (!post) notFound();

  return (
    <article className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-3xl">
        <Link
          href="/blog"
          className="text-sm text-on-surface-variant hover:text-primary transition-colors mb-8 inline-block"
        >
          &larr; Back to Journal
        </Link>

        {post.category && (
          <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-4">
            {post.category.replace("-", " ")}
          </p>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-12">
          {post.author && <span>By {post.author}</span>}
          {post.publishedAt && (
            <span>
              {new Date(post.publishedAt).toLocaleDateString("en-CA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {post.featuredImage && (
          <div className="aspect-[2/1] bg-surface-container rounded-lg overflow-hidden relative mb-12">
            <Image
              src={urlFor(post.featuredImage).width(1200).height(600).url()}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-on-surface-variant leading-relaxed [&_h2]:font-headline [&_h2]:text-primary [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-4 [&_p]:mb-6 [&_a]:text-secondary [&_a]:underline">
          <PortableText value={post.body} />
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(store)/blog/
git commit -m "feat: add blog listing and detail pages"
```

---

## Task 15: Contact Page

**Files:**
- Create: `app/(store)/contact/page.tsx`
- Create: `app/api/contact/route.ts`

- [ ] **Step 1: Create contact API**

Create `app/api/contact/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "Shrey Care Contact <onboarding@resend.dev>",
      to: ["contact@shreycare.com"], // Update with real email
      subject: `Contact Form: ${subject || "General Inquiry"}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create contact page**

Create `app/(store)/contact/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BotanicalToast } from "@/components/ui/BotanicalToast";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [toast, setToast] = useState({ visible: false, message: "", variant: "info" as const });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setStatus("success");
        setToast({ visible: true, message: "Message sent! We'll be in touch.", variant: "success" as const });
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
        setToast({ visible: true, message: "Failed to send. Please try again.", variant: "error" as const });
      }
    } catch {
      setStatus("error");
      setToast({ visible: true, message: "Something went wrong.", variant: "error" as const });
    }
  }

  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-2xl">
        <div className="mb-12">
          <p className="text-secondary font-bold uppercase tracking-widest text-sm mb-4">
            Get in Touch
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Contact Us
          </h1>
          <p className="text-on-surface-variant mt-4 text-lg">
            Have a question about our products or your order? We&apos;d love to
            hear from you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input id="name" name="name" label="Name" placeholder="Your name" required />
          <Input id="email" name="email" label="Email" type="email" placeholder="you@example.com" required />
          <Input id="subject" name="subject" label="Subject" placeholder="How can we help?" />
          <Textarea id="message" name="message" label="Message" placeholder="Tell us more..." rows={6} required />
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>

      <BotanicalToast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(store)/contact/ app/api/contact/
git commit -m "feat: add contact page with email via Resend"
```

---

## Task 16: FAQ Page

**Files:**
- Create: `app/(store)/faq/page.tsx`

- [ ] **Step 1: Create FAQ page**

Create `app/(store)/faq/page.tsx`:

```tsx
import { sanityClient } from "@/lib/sanity/client";
import { allFaqsQuery } from "@/lib/sanity/queries";
import { AccordionItem } from "@/components/ui/Accordion";
import { PortableText } from "next-sanity";
import type { FAQ } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Shrey Care products, shipping, and orders.",
};

export const revalidate = 60;

const categoryLabels: Record<string, string> = {
  ordering: "Ordering",
  shipping: "Shipping",
  products: "Products",
  returns: "Returns",
};

export default async function FAQPage() {
  const faqs: FAQ[] = await sanityClient.fetch(allFaqsQuery);

  const grouped = faqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
    const cat = faq.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-3xl">
        <div className="mb-16">
          <p className="text-secondary font-bold uppercase tracking-widest text-sm mb-4">
            Help Center
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Frequently Asked Questions
          </h1>
        </div>

        <div className="space-y-12">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-bold text-primary uppercase tracking-widest text-sm">
                {categoryLabels[category] || category}
              </h2>
              <div className="space-y-3">
                {items.map((faq) => (
                  <AccordionItem key={faq._id} question={faq.question}>
                    <PortableText value={faq.answer} />
                  </AccordionItem>
                ))}
              </div>
            </div>
          ))}
        </div>

        {faqs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">
              FAQ content coming soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(store)/faq/
git commit -m "feat: add FAQ page with grouped accordions"
```

---

## Task 17: Shipping & Returns Policy Page

**Files:**
- Create: `app/(store)/policies/shipping-returns/page.tsx`

- [ ] **Step 1: Create shipping & returns page**

Create `app/(store)/policies/shipping-returns/page.tsx`:

```tsx
import { sanityClient } from "@/lib/sanity/client";
import { policyPageBySlugQuery } from "@/lib/sanity/queries";
import { PortableText } from "next-sanity";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Shrey Care shipping and returns policy for Canadian orders.",
};

export const revalidate = 60;

export default async function ShippingReturnsPage() {
  const page = await sanityClient.fetch(policyPageBySlugQuery, {
    slug: "shipping-returns",
  });

  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-12">
          {page?.title || "Shipping & Returns"}
        </h1>

        {page?.body ? (
          <div className="prose prose-lg max-w-none text-on-surface-variant leading-relaxed [&_h2]:font-headline [&_h2]:text-primary [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-4 [&_p]:mb-6">
            <PortableText value={page.body} />
          </div>
        ) : (
          <div className="space-y-8 text-on-surface-variant leading-relaxed text-lg">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Shipping</h2>
              <p>
                We ship across Canada. Standard shipping takes 5-7 business days.
                Free shipping on orders over $75 CAD.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Returns</h2>
              <p>
                We accept returns within 30 days of delivery for unopened
                products. Please contact us at contact@shreycare.com to initiate
                a return.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(store)/policies/
git commit -m "feat: add shipping and returns policy page"
```

---

## Task 18: NextAuth Setup

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/account/layout.tsx`
- Create: `app/account/orders/page.tsx`

- [ ] **Step 1: Create NextAuth config**

Create `lib/auth.ts`:

```ts
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Replace with real user lookup (database or Sanity)
        // For now, this is a placeholder that accepts any email/password
        if (credentials?.email && credentials?.password) {
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split("@")[0],
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

- [ ] **Step 2: Create NextAuth route**

Create `app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 3: Create auth layout**

Create `app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Create login page**

Create `app/(auth)/login/page.tsx`:

```tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/account/orders");
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
        <p className="text-on-surface-variant mt-2">
          Sign in to your Shrey Care account
        </p>
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/account/orders" })}
        className="w-full bg-surface-container-low text-on-surface py-4 rounded-md font-bold hover:bg-surface-container-high transition-colors"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-surface-container-high" />
        <span className="text-xs text-on-surface-variant uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-surface-container-high" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input id="email" name="email" label="Email" type="email" required />
        <Input id="password" name="password" label="Password" type="password" required />
        {error && <p className="text-error text-sm">{error}</p>}
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary font-bold">
          Create one
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Create register page**

Create `app/(auth)/register/page.tsx`:

```tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // For now, register = sign in with credentials
    // Replace with real registration when you add a user database
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Registration failed. Please try again.");
    } else {
      router.push("/account/orders");
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Join the Atelier</h1>
        <p className="text-on-surface-variant mt-2">
          Create your Shrey Care account
        </p>
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/account/orders" })}
        className="w-full bg-surface-container-low text-on-surface py-4 rounded-md font-bold hover:bg-surface-container-high transition-colors"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-surface-container-high" />
        <span className="text-xs text-on-surface-variant uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-surface-container-high" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input id="name" name="name" label="Name" required />
        <Input id="email" name="email" label="Email" type="email" required />
        <Input id="password" name="password" label="Password" type="password" required />
        {error && <p className="text-error text-sm">{error}</p>}
        <Button type="submit" className="w-full">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-bold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Create account layout and orders page**

Create `app/account/layout.tsx`:

```tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-surface pt-20">
      <div className="container mx-auto px-6 md:px-10 py-16">{children}</div>
    </div>
  );
}
```

Create `app/account/orders/page.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
};

export default function OrdersPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-primary mb-8">My Orders</h1>

      <div className="bg-surface-container-low rounded-lg p-12 text-center">
        <p className="text-on-surface-variant text-lg">
          No orders yet. Start your botanical journey!
        </p>
        <a
          href="/products"
          className="inline-block mt-6 bg-primary text-on-primary px-8 py-3 rounded-md font-bold hover:opacity-90 transition-all"
        >
          Browse Products
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Add SessionProvider to root layout**

Update `app/layout.tsx` to wrap with NextAuth SessionProvider. Create a providers wrapper:

Create `app/providers.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/lib/cart/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
```

Update `app/layout.tsx` body:

```tsx
import type { Metadata } from "next";
import { Noto_Serif, Manrope } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shrey Care | The Botanical Atelier",
    template: "%s | Shrey Care",
  },
  description:
    "Luxury botanical hair care crafted with cold-pressed oils and rare herbal infusions. Rooted in Ayurveda, refined by science.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSerif.variable} ${manrope.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add lib/auth.ts app/api/auth/ app/(auth)/ app/account/ app/providers.tsx app/layout.tsx
git commit -m "feat: add NextAuth with login, register, and account pages"
```

---

## Task 19: SEO & Sitemap

**Files:**
- Create: `next-sitemap.config.js`
- Modify: `next.config.ts`

- [ ] **Step 1: Configure next-sitemap**

Create `next-sitemap.config.js`:

```js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://shreycare.com",
  generateRobotsTxt: true,
  exclude: ["/studio/*", "/account/*", "/api/*"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/studio", "/account", "/api"] },
    ],
  },
};
```

- [ ] **Step 2: Add postbuild script to package.json**

Add to `package.json` scripts:

```json
"postbuild": "next-sitemap"
```

- [ ] **Step 3: Update next.config.ts for images**

Update `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Commit**

```bash
git add next-sitemap.config.js next.config.ts package.json
git commit -m "feat: add sitemap generation and image config"
```

---

## Task 20: Placeholder Images & Final Wiring

**Files:**
- Create: `public/images/` directory with placeholder images
- Verify: All pages compile and render

- [ ] **Step 1: Create placeholder images directory**

```bash
mkdir -p public/images
```

Create placeholder SVGs for development. Create `public/images/placeholder-product.jpg` — for now, download or create a simple placeholder:

```bash
# Create a simple SVG placeholder as fallback
cat > public/images/placeholder.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <rect fill="#f0ede8" width="600" height="800"/>
  <text fill="#45483f" font-family="sans-serif" font-size="24" text-anchor="middle" x="300" y="400">Product Image</text>
</svg>
EOF
```

Copy the SVG for different uses:

```bash
cp public/images/placeholder.svg public/images/hero-product.jpg
cp public/images/placeholder.svg public/images/ingredients.jpg
cp public/images/placeholder.svg public/images/extraction.jpg
cp public/images/placeholder.svg public/images/about-hero.jpg
cp public/images/placeholder.svg public/images/about-science.jpg
cp public/images/placeholder.svg public/images/placeholder-product.jpg
```

> These will be replaced with real images later. Next.js Image component will handle any format.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build completes with no errors. Some pages may show warnings about missing Sanity env vars — that's expected until you connect Sanity.

- [ ] **Step 3: Commit**

```bash
git add public/images/
git commit -m "feat: add placeholder images for development"
```

---

## Task 21: Environment Setup Guide

**Files:**
- Create: `SETUP.md`

- [ ] **Step 1: Create setup instructions**

Create `SETUP.md`:

```markdown
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
   - Note the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## 4. Set up NextAuth

1. Generate a secret: `openssl rand -base64 32`
2. Fill in `.env.local`:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL=http://localhost:3000`
3. (Optional) Set up Google OAuth at https://console.cloud.google.com/

## 5. Set up Resend (for contact form)

1. Go to https://resend.com/ and create an account
2. Get your API key → `RESEND_API_KEY`

## 6. Run locally

```bash
npm run dev
```

## 7. Deploy to Vercel

1. Push repo to GitHub
2. Import in Vercel
3. Add all environment variables
4. Deploy
```

- [ ] **Step 2: Final commit**

```bash
git add SETUP.md
git commit -m "docs: add setup guide for environment configuration"
```

---

## Summary

| Task | Description | Commits |
|------|------------|---------|
| 1 | Project scaffolding + Tailwind tokens | 1 |
| 2 | Shared TypeScript types | 1 |
| 3 | Button, Input, SectionContainer | 1 |
| 4 | ProductCard, Accordion, BotanicalToast | 1 |
| 5 | Navbar, MobileMenu, Footer, store layout | 1 |
| 6 | Sanity setup + all 7 schemas | 1 |
| 7 | Cart context + CartDrawer | 1 |
| 8 | Landing page (6 sections) | 1 |
| 9 | Product catalog page | 1 |
| 10 | Product detail page + AddToCart | 1 |
| 11 | Stripe checkout + webhook + success page | 1 |
| 12 | Newsletter API | 1 |
| 13 | About page | 1 |
| 14 | Blog listing + detail | 1 |
| 15 | Contact page + email API | 1 |
| 16 | FAQ page | 1 |
| 17 | Shipping & Returns page | 1 |
| 18 | NextAuth + login/register/account | 1 |
| 19 | SEO + sitemap | 1 |
| 20 | Placeholder images + build verify | 1 |
| 21 | Setup guide | 1 |
