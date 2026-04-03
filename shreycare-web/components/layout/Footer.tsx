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
