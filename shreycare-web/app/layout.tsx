import type { Metadata } from "next";
import { Noto_Serif, Manrope } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CookieConsent } from "@/components/layout/CookieConsent";
import {
  OrganizationSchema,
  WebSiteSchema,
} from "@/components/seo/StructuredData";
import { Providers } from "./providers";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-ZJCHBKZGPL";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";
const SITE_DESCRIPTION =
  "Luxury botanical hair care crafted with cold-pressed oils and rare herbal infusions. Rooted in Ayurveda, refined by science.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ShreyCare Organics | Where Nature Leads",
    template: "%s | ShreyCare Organics",
  },
  description: SITE_DESCRIPTION,
  applicationName: "ShreyCare Organics",
  keywords: [
    "ayurvedic hair oil",
    "organic hair oil",
    "herbal hair oil",
    "bhringraj hair oil",
    "amla hair oil",
    "natural hair care",
    "ShreyCare Organics",
  ],
  authors: [{ name: "ShreyCare Organics" }],
  creator: "ShreyCare Organics",
  publisher: "ShreyCare Organics",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "ShreyCare Organics",
    url: SITE_URL,
    title: "ShreyCare Organics | Where Nature Leads",
    description: SITE_DESCRIPTION,
    locale: "en_IN",
    images: [
      {
        url: "/images/logo.png",
        width: 600,
        height: 600,
        alt: "ShreyCare Organics — Hair Oil, Ayurvedic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShreyCare Organics | Where Nature Leads",
    description: SITE_DESCRIPTION,
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSerif.variable} ${manrope.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
        <Script id="consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            // Google Consent Mode v2 defaults — all denied until user opts in.
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              functionality_storage: 'denied',
              personalization_storage: 'denied',
              security_storage: 'granted',
              wait_for_update: 500
            });
            // Redact ad data and preserve click IDs via URL while consent is denied.
            gtag('set', 'ads_data_redaction', true);
            gtag('set', 'url_passthrough', true);
            try {
              var saved = localStorage.getItem('shreycare-consent-v1');
              if (saved === 'granted') {
                gtag('consent', 'update', {
                  ad_storage: 'granted',
                  ad_user_data: 'granted',
                  ad_personalization: 'granted',
                  analytics_storage: 'granted',
                  functionality_storage: 'granted',
                  personalization_storage: 'granted'
                });
              }
            } catch (e) {}
          `}
        </Script>
      </head>
      <body>
        <OrganizationSchema />
        <WebSiteSchema />
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </html>
  );
}
