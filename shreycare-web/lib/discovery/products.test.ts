import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildExternalCheckoutUrl,
  buildProductUrl,
  discoveryProductsQuery,
  normalizeDiscoveryProduct,
  recommendDiscoveryProducts,
  sanitizeDiscoveryCopy,
  searchDiscoveryProducts,
} from "./products";

const baseUrl = "https://shreycare.com";

function imageUrlResolver(image: { asset?: { _ref?: string } }) {
  return `https://cdn.shreycare.test/${image.asset?._ref ?? "missing"}.jpg`;
}

function sourceProduct(overrides: Record<string, unknown> = {}) {
  return {
    _id: "product-1",
    name: "ShreyCare Hair Growth Hair Oil",
    slug: "hair-growth-hair-oil",
    description:
      "A botanical oil for hair loss that helps clear dandruff, treats dry scalp, and can promote new hair growth as a natural remedy.",
    price: 24.99,
    category: "hair-oil",
    images: [
      { _key: "main", asset: { _ref: "image-main", _type: "reference" } },
      { _key: "second", asset: { _ref: "image-second", _type: "reference" } },
    ],
    ingredients: ["bhringraj", "amla"],
    benefits: [],
    howToUse: [],
    tags: [],
    inStock: true,
    bottleCount: 1,
    qualifiesForFreeShipping: false,
    ...overrides,
  };
}

function discoveryProduct(overrides: Record<string, unknown> = {}) {
  const product = normalizeDiscoveryProduct(sourceProduct(overrides), {
    baseUrl,
    currency: "CAD",
    imageUrlResolver,
  });
  assert.ok(product, "expected fixture product to normalize");
  return product;
}

describe("sanitizeDiscoveryCopy", () => {
  it("rewrites direct medical-style hair care claims", () => {
    const safe = sanitizeDiscoveryCopy(
      "Treats dry scalp, clear dandruff, promote new hair growth, hair loss remedy.",
    );

    assert.doesNotMatch(safe.toLowerCase(), /treats dry scalp/);
    assert.doesNotMatch(safe.toLowerCase(), /clear dandruff/);
    assert.doesNotMatch(safe.toLowerCase(), /promote new hair growth/);
    assert.doesNotMatch(safe.toLowerCase(), /hair loss/);
    assert.doesNotMatch(safe.toLowerCase(), /remedy/);
    assert.match(safe, /comfortable-feeling scalp/i);
    assert.match(safe, /look of flakes/i);
    assert.match(safe, /fuller-looking, stronger-feeling hair/i);
  });
});

describe("link helpers", () => {
  it("builds canonical product and external checkout URLs", () => {
    assert.equal(
      buildProductUrl("hair-growth-hair-oil", baseUrl),
      "https://shreycare.com/products/hair-growth-hair-oil",
    );
    assert.equal(
      buildExternalCheckoutUrl("hair-growth-hair-oil", baseUrl),
      "https://shreycare.com/products/hair-growth-hair-oil",
    );
  });
});

describe("discoveryProductsQuery", () => {
  it("fetches fields required by the discovery normalizer", () => {
    assert.match(discoveryProductsQuery, /inStock/);
    assert.match(discoveryProductsQuery, /"slug": slug\.current/);
    assert.match(discoveryProductsQuery, /images/);
  });
});

describe("normalizeDiscoveryProduct", () => {
  it("omits invalid or unavailable products", () => {
    assert.equal(
      normalizeDiscoveryProduct(sourceProduct({ slug: "" }), {
        baseUrl,
        currency: "CAD",
        imageUrlResolver,
      }),
      null,
    );
    assert.equal(
      normalizeDiscoveryProduct(sourceProduct({ price: "24.99" }), {
        baseUrl,
        currency: "CAD",
        imageUrlResolver,
      }),
      null,
    );
    assert.equal(
      normalizeDiscoveryProduct(sourceProduct({ images: [] }), {
        baseUrl,
        currency: "CAD",
        imageUrlResolver,
      }),
      null,
    );
    assert.equal(
      normalizeDiscoveryProduct(sourceProduct({ inStock: false }), {
        baseUrl,
        currency: "CAD",
        imageUrlResolver,
      }),
      null,
    );
  });

  it("creates an OpenAI-friendly discovery record with external checkout only", () => {
    const product = discoveryProduct();

    assert.equal(product.id, "hair-growth-hair-oil");
    assert.equal(product.title, "ShreyCare Hair Growth Hair Oil");
    assert.equal(product.brand, "ShreyCare Organics");
    assert.equal(product.category, "hair-oil");
    assert.equal(product.url, "https://shreycare.com/products/hair-growth-hair-oil");
    assert.equal(product.external_checkout_url, product.url);
    assert.equal(product.image_url, "https://cdn.shreycare.test/image-main.jpg");
    assert.deepEqual(product.additional_image_urls, [
      "https://cdn.shreycare.test/image-second.jpg",
    ]);
    assert.equal(product.price, 24.99);
    assert.equal(product.currency, "CAD");
    assert.equal(product.availability, "in_stock");
    assert.equal(product.condition, "new");
    assert.equal(product.target_country, "CA");
    assert.equal(product.is_eligible_search, true);
    assert.equal(product.is_eligible_checkout, false);
    assert.ok(product.concerns.includes("hair-fall"));
    assert.doesNotMatch(product.description.toLowerCase(), /hair loss|remedy/);
  });
});

describe("searchDiscoveryProducts", () => {
  it("matches product titles, descriptions, categories, and concern terms", () => {
    const products = [
      discoveryProduct(),
      discoveryProduct({
        _id: "product-2",
        name: "ShreyCare Anti-Dandruff Hair Oil",
        slug: "anti-dandruff-hair-oil",
        description: "Botanical scalp care that helps reduce the look of flakes.",
      }),
      discoveryProduct({
        _id: "product-3",
        name: "ShreyCare Holistic Hair Oil",
        slug: "holistic-hair-oil",
        description: "A nourishing oil for dry, dull, frizzy-looking hair.",
      }),
    ];

    assert.equal(searchDiscoveryProducts(products, "flakes")[0].id, "anti-dandruff-hair-oil");
    assert.equal(searchDiscoveryProducts(products, "dry frizzy")[0].id, "holistic-hair-oil");
    assert.equal(searchDiscoveryProducts(products, "growth")[0].id, "hair-growth-hair-oil");
  });
});

describe("recommendDiscoveryProducts", () => {
  it("maps shopper concerns to the best matching ShreyCare oils", () => {
    const products = [
      discoveryProduct(),
      discoveryProduct({
        _id: "product-2",
        name: "ShreyCare Anti-Dandruff Hair Oil",
        slug: "anti-dandruff-hair-oil",
        description: "Botanical scalp care that helps reduce the look of flakes.",
      }),
      discoveryProduct({
        _id: "product-3",
        name: "ShreyCare Holistic Hair Oil",
        slug: "holistic-hair-oil",
        description: "A nourishing oil for dry, dull, frizzy-looking hair.",
      }),
    ];

    assert.equal(
      recommendDiscoveryProducts(products, "my hair feels thin and falls a lot")[0].id,
      "hair-growth-hair-oil",
    );
    assert.equal(
      recommendDiscoveryProducts(products, "itchy scalp with flakes")[0].id,
      "anti-dandruff-hair-oil",
    );
    assert.equal(
      recommendDiscoveryProducts(products, "dry dull frizzy hair")[0].id,
      "holistic-hair-oil",
    );
    assert.deepEqual(
      recommendDiscoveryProducts(products, "not sure").map((product) => product.id),
      ["hair-growth-hair-oil", "anti-dandruff-hair-oil", "holistic-hair-oil"],
    );
  });
});
