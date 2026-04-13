import { sanityClient } from "@/lib/sanity/client";
import { policyPageBySlugQuery } from "@/lib/sanity/queries";
import { PortableText } from "next-sanity";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Cookie Policy",
  description:
    "How ShreyCare Organics collects, uses, and protects your personal data, and how we use cookies and analytics.",
};

export const revalidate = 60;

export default async function PrivacyPolicyPage() {
  const page = await sanityClient.fetch(policyPageBySlugQuery, {
    slug: "privacy",
  });

  return (
    <section className="py-16 bg-surface min-h-screen">
      <div className="container mx-auto px-6 md:px-10 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-12">
          {page?.title || "Privacy & Cookie Policy"}
        </h1>

        {page?.body ? (
          <div className="prose prose-lg max-w-none text-on-surface-variant leading-relaxed [&_h2]:font-headline [&_h2]:text-primary [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-4 [&_p]:mb-6">
            <PortableText value={page.body} />
          </div>
        ) : (
          <div className="space-y-8 text-on-surface-variant leading-relaxed text-lg">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">
                Information we collect
              </h2>
              <p>
                When you place an order or create an account with ShreyCare
                Organics, we collect the information needed to fulfil that
                order — your name, contact details, shipping address, and
                payment information. We never store raw card numbers; payments
                are processed by our PCI-compliant payment provider.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">
                Cookies and analytics
              </h2>
              <p>
                We use cookies to keep you signed in, remember the contents of
                your cart, and understand how visitors use the site so we can
                improve it. Analytics cookies are only set after you accept
                them on our cookie banner. You can change your choice at any
                time by clearing cookies for this site in your browser.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">
                Third-party services
              </h2>
              <p>
                We use Google Analytics 4 with Google Consent Mode v2 to
                measure site performance. No analytics or advertising data is
                sent to Google until you grant consent. We also use Stripe for
                payments and Resend for transactional email.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">
                Your rights
              </h2>
              <p>
                You can request access to, correction of, or deletion of your
                personal data at any time. Contact us at{" "}
                <a
                  href="mailto:support@shreycare.com"
                  className="text-primary underline hover:text-secondary"
                >
                  support@shreycare.com
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
