"use client";

import Link from "next/link";
import Image from "next/image";
import { openCookiePreferences } from "./CookieConsent";

const discoverLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Customer Service" },
  { href: "/faq", label: "FAQ" },
  { href: "/policies/shipping-returns", label: "Shipping & Returns" },
  { href: "/policies/privacy", label: "Privacy & Cookies" },
];

const socialLinks = [
  { href: "https://www.instagram.com/shreycare_hair_love/", label: "Instagram" },
  { href: "https://www.facebook.com/people/ShreyCare-Hair-Love/61568316414767/", label: "Facebook" },
];

export function Footer() {
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface/80">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-6 md:px-10 py-16 max-w-[1440px] mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="ShreyCare Organics — Hair Oil, Ayurvedic"
              width={200}
              height={200}
              className="h-14 w-14 object-contain"
            />
            <div className="font-headline text-xl italic text-inverse-on-surface">
              ShreyCare Organics
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-xs">
            Formulating the world&apos;s most potent herbal ingredients for quality-conscious individuals who seek pure care
            and proven results in every drop.
          </p>
          <p className="text-sm">
            Support:{" "}
            <a
              href="mailto:contact@shreycare.com"
              className="text-secondary-container hover:text-inverse-on-surface transition-colors duration-300"
            >
              contact@shreycare.com
            </a>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.14em] text-secondary-container font-semibold">
              Discover
            </p>
            <ul className="space-y-3">
              {discoverLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-inverse-on-surface/75 hover:text-secondary-container transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.14em] text-secondary-container font-semibold">
              Social
            </p>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-inverse-on-surface/75 hover:text-secondary-container transition-colors duration-300"
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
          <p className="text-sm">
            &copy; {new Date().getFullYear()} ShreyCare Organics. Where Nature Leads
          </p>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="text-sm text-inverse-on-surface/75 hover:text-secondary-container transition-colors duration-300"
          >
            Cookie Preferences
          </button>
          <div className="flex md:justify-end space-x-3">
            <span className="w-9 h-9 rounded-full border border-inverse-on-surface/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary-container text-lg leading-none">spa</span>
            </span>
            <span className="w-9 h-9 rounded-full border border-inverse-on-surface/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary-container text-lg leading-none">eco</span>
            </span>
            <span className="w-9 h-9 rounded-full border border-inverse-on-surface/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary-container text-lg leading-none">fluid_med</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
