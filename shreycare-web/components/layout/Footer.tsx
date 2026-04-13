import Link from "next/link";
import Image from "next/image";

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
          <div className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="ShreyCare Organics — Hair Oil, Ayurvedic"
              width={200}
              height={200}
              className="h-20 w-auto object-contain"
            />
          </div>
          <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">
            Formulating the world's most potent herbal ingredients for quality-conscious individuals who seek pure care
            and proven results in every drop.
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
            &copy; {new Date().getFullYear()} ShreyCare Organics. Where Nature Leads
          </p>
          <div className="flex md:justify-end space-x-4">
            <span className="material-symbols-outlined text-primary">spa</span>
            <span className="material-symbols-outlined text-primary">eco</span>
            <span className="material-symbols-outlined text-primary">fluid_med</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
