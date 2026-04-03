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
