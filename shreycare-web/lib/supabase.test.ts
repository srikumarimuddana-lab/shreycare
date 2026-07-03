import assert from "node:assert/strict";
import { it } from "node:test";

it("does not initialize Supabase clients at module import time", async () => {
  const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const savedAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const savedServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const mod = await import(`./supabase.ts?import-only=${Date.now()}`);

    assert.equal(typeof mod.getSupabase, "function");
    assert.equal(typeof mod.getSupabaseAdmin, "function");
    assert.throws(
      () => mod.getSupabase(),
      /NEXT_PUBLIC_SUPABASE_URL is required/,
    );
  } finally {
    if (savedUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
    }

    if (savedAnonKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = savedAnonKey;
    }

    if (savedServiceKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = savedServiceKey;
    }
  }
});
