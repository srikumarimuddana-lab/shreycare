"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Catalog" },
  { href: "/about", label: "About" },
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
        <Link href="/" className="flex items-center gap-3" aria-label="ShreyCare Organics home">
          <Image
            src="/images/logo.png"
            alt="ShreyCare Organics — Hair Oil, Ayurvedic"
            width={180}
            height={180}
            priority
            className="h-12 w-12 md:h-14 md:w-14 object-contain"
          />
          <span className="font-headline text-2xl font-bold text-primary tracking-tighter">
            ShreyCare Organics
          </span>
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
