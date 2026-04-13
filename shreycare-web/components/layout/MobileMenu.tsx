"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}

export function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  // Lock body scroll while the menu is open and close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
    >
      {/* Backdrop covers the navbar too (z > 50). */}
      <div
        className="absolute inset-0 bg-on-background/50"
        onClick={onClose}
      />
      {/* Opaque panel so nothing underneath shows through. */}
      <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-surface shadow-botanical-lg flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2"
            aria-label="ShreyCare Organics home"
          >
            <Image
              src="/images/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="font-headline text-lg font-bold text-primary tracking-tighter">
              ShreyCare
            </span>
          </Link>
          <button
            onClick={onClose}
            className="text-primary p-2 -mr-2"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="block py-4 font-headline text-2xl text-primary tracking-tight border-b border-outline-variant/50 active:opacity-70"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-6 py-6 border-t border-outline-variant space-y-2 text-sm text-on-surface-variant">
          <p className="uppercase tracking-widest text-xs text-primary font-bold">
            Support
          </p>
          <a
            href="mailto:support@shreycare.com"
            className="block text-primary hover:text-secondary"
            onClick={onClose}
          >
            support@shreycare.com
          </a>
        </div>
      </div>
    </div>
  );
}
