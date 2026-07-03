# ShreyCare ChatGPT Discovery + MCP MVP Design

## Goal

Make ShreyCare easier for ChatGPT and other AI shopping/search surfaces to understand, recommend, and route into a future ShreyCare ChatGPT app. The first release focuses on product discovery and external checkout, not Instant Checkout.

The user journey is:

1. A shopper asks ChatGPT about hair care products.
2. ChatGPT can understand ShreyCare products from clean catalog data and AI-facing copy.
3. If ShreyCare is surfaced, the shopper can open product pages or the future ShreyCare MCP/app.
4. The shopper checks out on `shreycare.com`.

## Scope

Included:

- Add an OpenAI/ChatGPT-friendly product feed endpoint that reads the existing Sanity product catalog.
- Add a reusable product discovery service for search, recommendations, product lookup, and checkout/product links.
- Rewrite AI-facing marketing copy to avoid medical-style claims.
- Prepare the codebase for MCP tools without submitting or integrating with ChatGPT yet.
- Add focused tests around feed shape, recommendation behavior, safe wording, and links.

Not included:

- Instant Checkout inside ChatGPT.
- OpenAI merchant application submission.
- OAuth/account linking.
- Order status lookup.
- New payment processing behavior.
- Major redesign of storefront pages.

## Existing Context

The app is `shreycare-web`, a Next.js App Router project on Next `16.2.2`. Product data currently lives in Sanity through the `product` schema. There is already:

- A Google Merchant XML feed at `app/api/feed/google-merchant/route.ts`.
- AI crawler allow files at `app/robots.ts`, `app/ai.txt/route.ts`, and `app/llms.txt/route.ts`.
- Manual order checkout at `/checkout` backed by `app/api/orders/route.ts`.
- Product pages at `/products/[slug]`.

This design reuses that structure instead of introducing a separate catalog source.

## Architecture

### Product Discovery Service

Create a small server-side module at `lib/discovery/products.ts` that owns the product transformations needed by feeds and future MCP tools.

Responsibilities:

- Fetch public, in-stock products from Sanity.
- Normalize product fields into an AI-safe discovery shape.
- Map concerns to relevant product categories or keywords.
- Build canonical product URLs.
- Build external checkout/product links.
- Remove or avoid hard medical claims in generated discovery copy.

The module should avoid initializing new third-party clients at module scope. It can reuse the existing Sanity client, while keeping transformation functions pure and directly testable.

### OpenAI Product Feed Endpoint

Add a new route:

`app/api/feed/openai-products/route.ts`

The route returns JSON for now, because it is easy to inspect, test, and adapt to whichever OpenAI commerce ingestion method is approved later.

Each product record should include:

- `id`
- `title`
- `description`
- `brand`
- `category`
- `url`
- `image_url`
- `additional_image_urls`
- `price`
- `currency`
- `availability`
- `condition`
- `target_country`
- `is_eligible_search`
- `is_eligible_checkout`
- `external_checkout_url`

For the MVP, `is_eligible_search` should be `true` for valid public products. `is_eligible_checkout` should be `false` until ShreyCare is approved for direct ChatGPT checkout. The feed should still include `external_checkout_url` so product discovery and future MCP flows can send shoppers to ShreyCare-owned checkout or product pages.

### AI-Facing Copy Cleanup

Update AI-facing copy in:

- `app/llms.txt/route.ts`
- `app/ai.txt/route.ts`
- `components/seo/StructuredData.tsx`
- selected metadata fields where hard claims are currently prominent

Replace medical-style language with cosmetic/supportive phrasing.

Examples:

- `hair loss` -> `hair fall concerns` or `hair that feels weak or thinning-looking`
- `promote new hair growth` -> `supports fuller-looking, stronger-feeling hair`
- `clear dandruff` -> `helps reduce the look of flakes`
- `treats dry scalp` -> `supports a more comfortable-feeling scalp`
- `remedy` -> `care ritual`, `product option`, or `routine`

The goal is not to erase the business positioning. The goal is to make the copy safer for commerce review and less likely to be interpreted as a medical claim.

### Future MCP Tool Shape

The first implementation will not need to publish a full MCP endpoint, but the service should be shaped so these future tools are easy to add:

- `search_products(query, concern?, category?)`
- `get_product(slug)`
- `recommend_product(concern, hair_type?)`
- `create_checkout_link(items)`

All purchasing actions should route to ShreyCare-owned web pages. No tool should collect payment details inside ChatGPT in this MVP.

## Data Flow

Product feed:

1. Request hits `/api/feed/openai-products`.
2. Route calls the discovery service.
3. Service fetches Sanity products.
4. Service normalizes products and generated URLs.
5. Route returns JSON with cache headers.

Future MCP recommendation:

1. ChatGPT calls a recommendation/search tool.
2. Tool passes the query or concern to the discovery service.
3. Service returns structured product matches.
4. ChatGPT presents product options and links to ShreyCare.
5. Shopper completes checkout on `shreycare.com`.

## Error Handling

- If Sanity is unavailable, the feed route should return a JSON error with a `500` status.
- Products missing slug, name, image, or numeric price should be omitted from the feed rather than producing invalid records.
- Unknown recommendation concerns should fall back to a general product list instead of failing.
- Checkout/product links should always use `NEXT_PUBLIC_SITE_URL` with a fallback of `https://shreycare.com`.

## Testing

Add focused automated tests before implementation.

Test targets:

- Product normalization omits invalid products.
- Feed records include required fields and safe defaults.
- Recommendation mapping returns expected products for hair fall, flakes, dryness, and general care concerns.
- Link generation produces canonical `https://shreycare.com/products/<slug>` URLs and safe checkout/product URLs.
- AI copy helper avoids blocked phrases in generated discovery text.

Keep tests concentrated on pure service functions where possible. Route-level tests can be added only where they catch meaningful integration risk.

## Rollout

1. Implement discovery service tests and helpers.
2. Add OpenAI product feed endpoint.
3. Update AI-facing copy.
4. Run lint/build or the closest available verification.
5. Review the feed output locally.

After this MVP is stable, the next design can cover the actual MCP endpoint and ChatGPT app UI.

## Open Questions

- Whether OpenAI will accept the product feed through a hosted URL, SFTP, or partner dashboard flow depends on merchant/product-discovery approval.
- Whether ShreyCare should pursue the standardized `checkout_session` conversion app contract should be decided after product discovery is working.
- Order status lookup should remain out of scope until there is a safe customer verification flow.
