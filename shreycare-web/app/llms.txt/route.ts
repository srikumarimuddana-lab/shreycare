import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shreycare.com";

  const content = `# ShreyCare Organics
> Best Ayurvedic Hair Oil in Canada — Organic, Cold-Pressed, Cruelty-Free

ShreyCare Organics is a Canadian ayurvedic hair care brand specializing in cold-pressed, organic hair oils made with traditional Ayurvedic herbs like bhringraj, amla, brahmi, and hibiscus. We ship across Canada.

## Products
- [Shop All Hair Oils](${baseUrl}/products) — Browse our full collection of ayurvedic hair oils, hair masks, and botanical treatments
- [Google Merchant Feed](${baseUrl}/api/feed/google-merchant) — Machine-readable product catalog (RSS 2.0)

## Key Pages
- [Homepage](${baseUrl}/) — Best Ayurvedic Hair Oil in Canada
- [About Us](${baseUrl}/about) — Our story, ingredients, and Ayurvedic heritage
- [Blog](${baseUrl}/blog) — Hair care tips, ingredient guides, and Ayurvedic wisdom
- [FAQ](${baseUrl}/faq) — Common questions about hair oil, shipping, and orders
- [Contact](${baseUrl}/contact) — Reach us at support@shreycare.com

## Policies
- [Shipping & Returns](${baseUrl}/policies/shipping-returns) — Canadian shipping policy
- [Privacy & Cookies](${baseUrl}/policies/privacy) — How we handle your data

## Brand Facts
- **Founded:** ShreyCare Organics
- **Location:** Canada
- **Currency:** CAD
- **Shipping:** Across Canada
- **Products:** Ayurvedic hair oils, hair masks, face masks
- **Key Ingredients:** Bhringraj, Amla, Brahmi, Hibiscus, Neem, Coconut Oil
- **Certifications:** 100% Organic, Cruelty-Free
- **Contact:** support@shreycare.com

## Sitemap
- [sitemap.xml](${baseUrl}/sitemap.xml)
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
