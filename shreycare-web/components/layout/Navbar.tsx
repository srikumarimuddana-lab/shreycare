"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/hair-quiz", label: "Hair Quiz" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

interface NavbarProps {
  cartItemCount: number;
  onCartClick: () => void;
}

export function Navbar({ cartItemCount, onCartClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-surface/86 glass-nav border-b border-outline-variant">
        <div className="flex justify-between items-center px-6 md:px-10 py-4 md:py-5 max-w-[1440px] mx-auto">
          <Link href="/" className="flex items-center gap-2.5 md:gap-3" aria-label="ShreyCare Organics home">
            <Image
              src="/images/logo.png"
              alt="ShreyCare Organics — Hair Oil, Ayurvedic"
              width={180}
              height={180}
              priority
              className="h-10 w-10 md:h-12 md:w-12 object-contain"
            />
            <span className="font-headline text-xl md:text-2xl font-semibold text-primary tracking-tight">
              ShreyCare <span className="italic font-normal text-secondary">Organics</span>
            </span>
          </Link>

          <div className="hidden md:flex space-x-10 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-sm font-medium tracking-tight text-on-surface-variant hover:text-primary transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-5 md:space-x-6">
            <Link
              href="/products"
              className="text-primary hover:opacity-80 transition-opacity duration-200"
              aria-label="Search products"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Link>
            <button
              onClick={onCartClick}
              className="relative text-primary hover:opacity-80 transition-transform duration-200 active:scale-95"
              aria-label="Open cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              className="md:hidden text-primary p-1 -mr-1"
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
      </nav>

      {/* Render OUTSIDE <nav> so the menu isn't trapped in the fixed navbar's
          stacking/backdrop-filter context (which was letting the logo + brand
          text bleed through on mobile). */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={navLinks}
      />
    </>
  );
}
