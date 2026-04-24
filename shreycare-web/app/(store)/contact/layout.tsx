import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — ShreyCare Organics Canada",
  description:
    "Get in touch with ShreyCare Organics. Questions about our ayurvedic hair oils, orders, or shipping across Canada? Email contact@shreycare.com or use our contact form.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
