// Server-only JSON-LD helpers. Emit schema.org structured data so Google can
// surface rich results (Organization, Product price/availability, FAQ
// accordions, breadcrumbs, articles) in SERP.

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";

export function OrganizationSchema({ siteUrl = DEFAULT_SITE_URL }: { siteUrl?: string } = {}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "ShreyCare Organics",
        alternateName: "Shreycare Organics",
        url: siteUrl,
        logo: `${siteUrl}/images/logo.png`,
        description:
          "Luxury botanical hair care crafted with cold-pressed oils and rare herbal infusions. Rooted in Ayurveda, refined by science.",
        sameAs: [
          "https://www.instagram.com/shreycareorganics",
          "https://www.pinterest.com/shreycareorganics",
        ],
      }}
    />
  );
}

export function WebSiteSchema({ siteUrl = DEFAULT_SITE_URL }: { siteUrl?: string } = {}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "ShreyCare Organics",
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/products?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

interface ProductSchemaInput {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency?: string;
  images: string[];
  inStock: boolean;
  category?: string;
  siteUrl?: string;
}

export function ProductSchema({
  name,
  slug,
  description,
  price,
  currency = "CAD",
  images,
  inStock,
  category,
  siteUrl = DEFAULT_SITE_URL,
}: ProductSchemaInput) {
  const url = `${siteUrl}/products/${slug}`;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        description,
        image: images,
        sku: slug,
        mpn: slug,
        brand: { "@type": "Brand", name: "ShreyCare Organics" },
        category,
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: currency,
          price: price.toFixed(2),
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: "ShreyCare Organics" },
        },
      }}
    />
  );
}

interface ArticleSchemaInput {
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  siteUrl?: string;
}

export function ArticleSchema({
  title,
  slug,
  excerpt,
  image,
  author,
  publishedAt,
  updatedAt,
  siteUrl = DEFAULT_SITE_URL,
}: ArticleSchemaInput) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: excerpt,
        image: image ? [image] : undefined,
        author: author
          ? { "@type": "Person", name: author }
          : { "@type": "Organization", name: "ShreyCare Organics" },
        publisher: {
          "@type": "Organization",
          name: "ShreyCare Organics",
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/images/logo.png`,
          },
        },
        datePublished: publishedAt,
        dateModified: updatedAt || publishedAt,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteUrl}/blog/${slug}`,
        },
      }}
    />
  );
}

export function BreadcrumbSchema({
  items,
  siteUrl = DEFAULT_SITE_URL,
}: {
  items: { name: string; path: string }[];
  siteUrl?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${siteUrl}${item.path}`,
        })),
      }}
    />
  );
}

export function FAQSchema({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer,
          },
        })),
      }}
    />
  );
}
