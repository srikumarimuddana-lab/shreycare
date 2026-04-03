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
