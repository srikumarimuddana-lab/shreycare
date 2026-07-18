import { supabaseAdmin } from "@/lib/supabase";

// Admin-editable settings resolved DB-first with an environment-variable
// fallback. Only non-bootstrap secrets belong here — Supabase credentials and
// ADMIN_SECRET must stay in the environment (they're needed to reach this
// table and to authenticate the admin who edits it).
//
// Each key maps to the env var used as a fallback when the DB has no value, so
// the app keeps working from environment variables until (and unless) a value
// is saved in the admin panel.
const ENV_FALLBACK = {
  stripe_secret_key: "STRIPE_SECRET_KEY",
  stripe_webhook_secret: "STRIPE_WEBHOOK_SECRET",
} as const;

export type SettingKey = keyof typeof ENV_FALLBACK;

export const SETTING_KEYS = Object.keys(ENV_FALLBACK) as SettingKey[];

export type SettingSource = "db" | "env" | "none";

// Short in-process cache so the payment hot paths (checkout, webhook) don't hit
// the DB on every call. Writes invalidate it; other serverless instances pick
// up changes within the TTL.
const TTL_MS = 30_000;
let cache: Map<string, string | null> | null = null;
let cacheAt = 0;

async function loadAll(): Promise<Map<string, string | null>> {
  const now = Date.now();
  if (cache && now - cacheAt < TTL_MS) return cache;

  const map = new Map<string, string | null>();
  try {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("key, value");
    if (error) {
      // Table may not exist yet (migration not run). Fall back to env silently
      // at debug level — this is expected pre-migration.
      console.debug("[settings] load skipped:", error.message);
    } else {
      for (const row of data ?? []) map.set(row.key as string, row.value as string | null);
    }
  } catch (err) {
    console.error("[settings] load failed:", err);
  }

  cache = map;
  cacheAt = now;
  return map;
}

function envValue(key: SettingKey): string | undefined {
  return process.env[ENV_FALLBACK[key]];
}

// Resolve a setting: a non-empty DB value wins, otherwise the env fallback.
export async function getSetting(key: SettingKey): Promise<string | undefined> {
  const map = await loadAll();
  const dbVal = map.get(key);
  if (dbVal != null && dbVal !== "") return dbVal;
  return envValue(key);
}

// Where a setting's effective value comes from — for the admin UI.
export async function getSettingSource(key: SettingKey): Promise<SettingSource> {
  const map = await loadAll();
  const dbVal = map.get(key);
  if (dbVal != null && dbVal !== "") return "db";
  if (envValue(key)) return "env";
  return "none";
}

// Store (or clear, with null/empty) a setting in the DB and invalidate the
// cache so the next read reflects it immediately in this instance.
export async function setSetting(key: SettingKey, value: string | null): Promise<void> {
  const clean = value && value.trim() !== "" ? value.trim() : null;
  const { error } = await supabaseAdmin
    .from("app_settings")
    .upsert(
      { key, value: clean, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) throw new Error(`Failed to save setting: ${error.message}`);
  cache = null;
}

export function invalidateSettingsCache(): void {
  cache = null;
}
