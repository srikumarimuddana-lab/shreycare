# ShreyCare ChatGPT Discovery + MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first ShreyCare ChatGPT discovery MVP: a reusable product discovery service, OpenAI-friendly product feed endpoint, safer AI-facing copy, and tests.

**Architecture:** Keep product logic in a pure, testable `lib/discovery/products.ts` module. The new feed route reads Sanity through that service and returns JSON with external checkout links only. Copy updates stay in existing AI/SEO surfaces and avoid direct medical claims.

**Tech Stack:** Next.js 16 App Router, TypeScript, Sanity, Node test runner, `tsx` for TypeScript test execution.

---

## File Structure

- Create `shreycare-web/scripts/run-tests.mjs`: finds `.test.ts` files and runs Node's built-in test runner with `tsx`.
- Modify `shreycare-web/package.json`: add `test` script and direct `tsx` dev dependency.
- Create `shreycare-web/lib/discovery/products.ts`: source product types, sanitization, normalization, search, recommendation, link building, Sanity fetch adapter.
- Create `shreycare-web/lib/discovery/products.test.ts`: tests for normalization, links, safe copy, search, and recommendation behavior.
- Create `shreycare-web/app/api/feed/openai-products/route.ts`: JSON product feed endpoint.
- Modify `shreycare-web/app/llms.txt/route.ts`: safer AI-facing product copy and link to the OpenAI product feed.
- Modify `shreycare-web/app/ai.txt/route.ts`: safer AI usage policy wording and feed link.
- Modify `shreycare-web/components/seo/StructuredData.tsx`: safer business description.
- Modify selected metadata in `shreycare-web/app/layout.tsx` and store route pages where hard health claims are prominent.

## Task 1: Add Test Runner

**Files:**
- Create: `shreycare-web/scripts/run-tests.mjs`
- Modify: `shreycare-web/package.json`

- [ ] **Step 1: Add test runner script**

Create `scripts/run-tests.mjs`:

```js
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["lib", "app", "components"];
const tests = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (entry !== "node_modules" && entry !== ".next") walk(path);
      continue;
    }
    if (entry.endsWith(".test.ts")) tests.push(relative(process.cwd(), path));
  }
}

for (const root of roots) {
  try {
    walk(root);
  } catch {
    // Skip missing roots.
  }
}

if (tests.length === 0) {
  console.log("No test files found.");
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...tests],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
```

- [ ] **Step 2: Add package script and dependency**

Update `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "node scripts/run-tests.mjs"
},
"devDependencies": {
  "tsx": "^4.20.6"
}
```

- [ ] **Step 3: Run test command**

Run: `npm test`

Expected: PASS-style output with `No test files found.` until the first test is added.

## Task 2: Product Discovery Service

**Files:**
- Create: `shreycare-web/lib/discovery/products.test.ts`
- Create: `shreycare-web/lib/discovery/products.ts`

- [ ] **Step 1: Write failing tests**

Create tests that import these functions:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildExternalCheckoutUrl,
  buildProductUrl,
  normalizeDiscoveryProduct,
  recommendDiscoveryProducts,
  sanitizeDiscoveryCopy,
  searchDiscoveryProducts,
} from "./products";
```

Tests must verify:

- invalid products normalize to `null`;
- valid products produce required feed fields;
- `is_eligible_checkout` is `false`;
- product and checkout URLs use `https://shreycare.com/products/<slug>`;
- sanitization removes `hair loss`, `promote new hair growth`, `clear dandruff`, `treats dry scalp`, and `remedy`;
- recommendations map hair fall to growth products, flakes to anti-dandruff products, and dryness to holistic products;
- search matches product names and safe descriptions.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test`

Expected: FAIL because `lib/discovery/products.ts` does not exist yet.

- [ ] **Step 3: Implement service**

Create `lib/discovery/products.ts` with:

```ts
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
  concerns: Array<"hair-fall" | "flakes" | "dryness" | "general">;
}
```

Include pure helpers for sanitization, URL building, normalization, search, and recommendation. Add `getDiscoveryProducts()` that dynamically imports Sanity dependencies, fetches `allProductsQuery`, and normalizes products.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm test`

Expected: all discovery service tests pass.

## Task 3: OpenAI Product Feed Endpoint

**Files:**
- Create: `shreycare-web/app/api/feed/openai-products/route.ts`

- [ ] **Step 1: Add route**

Create a route that calls `getDiscoveryProducts()` and returns:

```ts
{
  feed_id: "shreycare-openai-products",
  merchant: "ShreyCare Organics",
  target_country: "CA",
  generated_at: new Date().toISOString(),
  products
}
```

Use `Content-Type: application/json; charset=utf-8` and cache headers `s-maxage=3600, stale-while-revalidate=86400`.

- [ ] **Step 2: Run tests and lint**

Run: `npm test`

Expected: all tests pass.

Run: `npm run lint`

Expected: no lint errors from the new route.

## Task 4: AI-Facing Copy Cleanup

**Files:**
- Modify: `shreycare-web/app/llms.txt/route.ts`
- Modify: `shreycare-web/app/ai.txt/route.ts`
- Modify: `shreycare-web/components/seo/StructuredData.tsx`
- Modify: `shreycare-web/app/layout.tsx`
- Modify: selected metadata in `shreycare-web/app/(store)/page.tsx`, `products/page.tsx`, `hair-quiz/page.tsx`, and `blog/page.tsx`

- [ ] **Step 1: Replace hard claims**

Use these replacements:

- `hair loss` -> `hair fall concerns`
- `promote new hair growth` -> `supports fuller-looking, stronger-feeling hair`
- `clear dandruff` -> `helps reduce the look of flakes`
- `treats dry scalp` -> `supports a more comfortable-feeling scalp`
- `remedy` -> `care ritual`, `routine`, or `product option`

- [ ] **Step 2: Add product feed link to AI files**

Add `https://shreycare.com/api/feed/openai-products` to `llms.txt` and `ai.txt` output as the OpenAI-friendly catalog feed.

- [ ] **Step 3: Scan for hard phrases**

Run:

```powershell
rg -n "hair loss|promote new hair growth|clear dandruff|treats dry scalp|remedy" shreycare-web\app shreycare-web\components -S
```

Expected: no matches in AI-facing route files, structured data, or primary metadata. Blog seed content can remain if not edited in this MVP.

## Task 5: Verification

**Files:**
- Verify changed files only.

- [ ] **Step 1: Run tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: no lint errors.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: build completes successfully. If environment variables are missing locally, capture the exact missing variable and verify with the strongest available fallback.

- [ ] **Step 4: Inspect git diff**

Run: `git diff --stat`

Expected: only the planned files changed.

- [ ] **Step 5: Commit implementation**

Commit message:

```bash
git add shreycare-web docs/superpowers/plans/2026-07-03-shreycare-chatgpt-discovery-mcp.md
git commit -m "feat: add ChatGPT product discovery feed"
```
