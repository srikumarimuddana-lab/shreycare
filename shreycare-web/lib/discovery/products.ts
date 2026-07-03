type ProductCategory = "hair-oil" | "hair-mask" | "face-mask" | "other" | string;
type DiscoveryConcern = "hair-fall" | "flakes" | "dryness" | "general";

interface SourceImage {
  _key?: string;
  asset?: {
    _ref?: string;
    _type?: string;
  };
  alt?: string;
}

interface SourceProduct {
  _id?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: unknown;
  category?: ProductCategory;
  images?: SourceImage[];
  ingredients?: string[];
  tags?: string[];
  inStock?: boolean;
}

interface NormalizeOptions {
  baseUrl?: string;
  currency?: string;
  imageUrlResolver?: (image: SourceImage) => string;
}

export interface DiscoveryProduct {
  id: string;
  title: string;
  description: string;
  brand: "ShreyCare Organics";
  category: string;
  url: string;
  image_url: string;
  additional_image_urls: string[];
  price: number;
  currency: string;
  availability: "in_stock";
  condition: "new";
  target_country: "CA";
  is_eligible_search: true;
  is_eligible_checkout: false;
  external_checkout_url: string;
  concerns: DiscoveryConcern[];
}

const DEFAULT_BASE_URL = "https://shreycare.com";
const DEFAULT_CURRENCY = "CAD";

export const discoveryProductsQuery = `*[_type == "product" && inStock == true] | order(sortOrder asc) {
  _id, name, "slug": slug.current, description, price, category,
  images, ingredients, tags, inStock, bottleCount, qualifiesForFreeShipping
}`;

const CONCERN_KEYWORDS: Record<DiscoveryConcern, string[]> = {
  "hair-fall": [
    "growth",
    "hair fall",
    "falling",
    "thin",
    "thinning",
    "weak",
    "breakage",
    "fuller",
    "stronger",
  ],
  flakes: [
    "anti-dandruff",
    "dandruff",
    "flake",
    "flakes",
    "flaky",
    "itchy",
    "scalp",
  ],
  dryness: [
    "holistic",
    "dry",
    "dull",
    "frizz",
    "frizzy",
    "shine",
    "damaged",
    "nourish",
    "nourishing",
  ],
  general: ["general", "overall", "routine", "care"],
};

function cleanBaseUrl(baseUrl?: string): string {
  return (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_BASE_URL).replace(
    /\/+$/,
    "",
  );
}

function normalizeSlug(slug: string): string {
  return slug.replace(/^\/+|\/+$/g, "");
}

export function buildProductUrl(slug: string, baseUrl?: string): string {
  return `${cleanBaseUrl(baseUrl)}/products/${encodeURIComponent(
    normalizeSlug(slug),
  )}`;
}

export function buildExternalCheckoutUrl(slug: string, baseUrl?: string): string {
  return buildProductUrl(slug, baseUrl);
}

export function sanitizeDiscoveryCopy(copy: string): string {
  return copy
    .replace(/promotes?\s+new\s+hair\s+growth/gi, "supports fuller-looking, stronger-feeling hair")
    .replace(/promotes?\s+hair\s+growth/gi, "supports fuller-looking, stronger-feeling hair")
    .replace(/helps?\s+clear\s+dandruff/gi, "helps reduce the look of flakes")
    .replace(/\bclear(?:s|ing)?\s+dandruff\b/gi, "helps reduce the look of flakes")
    .replace(/\btreat(?:s|ing)?\s+dry\s+scalp\b/gi, "supports a more comfortable-feeling scalp")
    .replace(/\bhair\s+loss\b/gi, "hair fall concerns")
    .replace(/\bremed(?:y|ies)\b/gi, "product option");
}

function productText(product: SourceProduct): string {
  return [
    product.name,
    product.description,
    product.category,
    ...(product.ingredients ?? []),
    ...(product.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function detectConcern(input: string): DiscoveryConcern | null {
  const text = input.toLowerCase();

  for (const concern of ["flakes", "hair-fall", "dryness"] as const) {
    if (CONCERN_KEYWORDS[concern].some((keyword) => text.includes(keyword))) {
      return concern;
    }
  }

  return null;
}

function inferConcerns(product: SourceProduct): DiscoveryConcern[] {
  const text = productText(product);
  const concerns = new Set<DiscoveryConcern>();

  for (const concern of ["hair-fall", "flakes", "dryness"] as const) {
    if (CONCERN_KEYWORDS[concern].some((keyword) => text.includes(keyword))) {
      concerns.add(concern);
    }
  }

  if (text.includes("holistic")) {
    concerns.add("general");
  }

  if (concerns.size === 0) {
    concerns.add("general");
  }

  return Array.from(concerns);
}

function defaultImageUrl(image: SourceImage, baseUrl: string): string {
  if (image.asset?._ref) {
    return `${baseUrl}/products`;
  }
  return `${baseUrl}/icon.png`;
}

export function normalizeDiscoveryProduct(
  product: SourceProduct,
  options: NormalizeOptions = {},
): DiscoveryProduct | null {
  const baseUrl = cleanBaseUrl(options.baseUrl);
  const currency = options.currency || process.env.NEXT_PUBLIC_STORE_CURRENCY || DEFAULT_CURRENCY;
  const slug = typeof product.slug === "string" ? product.slug.trim() : "";
  const name = typeof product.name === "string" ? product.name.trim() : "";
  const images = Array.isArray(product.images) ? product.images : [];

  if (
    !slug ||
    !name ||
    typeof product.price !== "number" ||
    !Number.isFinite(product.price) ||
    images.length === 0 ||
    product.inStock !== true
  ) {
    return null;
  }

  const imageUrl = options.imageUrlResolver
    ? options.imageUrlResolver(images[0])
    : defaultImageUrl(images[0], baseUrl);
  const additionalImageUrls = images
    .slice(1, 11)
    .map((image) =>
      options.imageUrlResolver ? options.imageUrlResolver(image) : defaultImageUrl(image, baseUrl),
    )
    .filter(Boolean);
  const description = sanitizeDiscoveryCopy(
    product.description?.trim() ||
      `${name} is a cold-pressed botanical hair care product from ShreyCare Organics.`,
  );
  const url = buildProductUrl(slug, baseUrl);

  return {
    id: slug,
    title: sanitizeDiscoveryCopy(name),
    description,
    brand: "ShreyCare Organics",
    category: product.category || "hair-care",
    url,
    image_url: imageUrl,
    additional_image_urls: additionalImageUrls,
    price: Number(product.price.toFixed(2)),
    currency,
    availability: "in_stock",
    condition: "new",
    target_country: "CA",
    is_eligible_search: true,
    is_eligible_checkout: false,
    external_checkout_url: buildExternalCheckoutUrl(slug, baseUrl),
    concerns: inferConcerns({ ...product, name, description }),
  };
}

function scoreProduct(product: DiscoveryProduct, query: string): number {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
  const haystack = [
    product.title,
    product.description,
    product.category,
    product.concerns.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  let score = 0;
  const concern = detectConcern(query);

  if (concern && product.concerns.includes(concern)) {
    score += scoreConcernMatch(product, concern) * 2;
  }

  for (const term of terms) {
    if (product.title.toLowerCase().includes(term)) {
      score += 3;
    } else if (haystack.includes(term)) {
      score += 1;
    }
  }

  return score;
}

function scoreConcernMatch(
  product: DiscoveryProduct,
  concern: DiscoveryConcern,
): number {
  if (!product.concerns.includes(concern)) {
    return 0;
  }

  const title = product.title.toLowerCase();
  const description = product.description.toLowerCase();
  let score = 1;

  if (CONCERN_KEYWORDS[concern].some((keyword) => title.includes(keyword))) {
    score += 4;
  }

  if (
    CONCERN_KEYWORDS[concern].some((keyword) =>
      description.includes(keyword),
    )
  ) {
    score += 2;
  }

  return score;
}

export function searchDiscoveryProducts(
  products: DiscoveryProduct[],
  query: string,
): DiscoveryProduct[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return products;
  }

  return products
    .map((product, index) => ({
      product,
      index,
      score: scoreProduct(product, normalizedQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.product);
}

export function recommendDiscoveryProducts(
  products: DiscoveryProduct[],
  concernInput: string,
): DiscoveryProduct[] {
  const concern = detectConcern(concernInput);

  if (!concern) {
    return products;
  }

  return products
    .map((product, index) => ({
      product,
      index,
      score: scoreConcernMatch(product, concern),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.product);
}

export async function getDiscoveryProducts(
  options: NormalizeOptions = {},
): Promise<DiscoveryProduct[]> {
  const [{ sanityClient }, { urlFor }] = await Promise.all([
    import("../sanity/client"),
    import("../sanity/image"),
  ]);
  const products = (await sanityClient.fetch(discoveryProductsQuery)) as SourceProduct[];

  return products
    .map((product) =>
      normalizeDiscoveryProduct(product, {
        ...options,
        imageUrlResolver: (image) =>
          urlFor({ asset: { _ref: image.asset?._ref || "" } })
            .width(1200)
            .height(1200)
            .url(),
      }),
    )
    .filter((product): product is DiscoveryProduct => product !== null);
}
