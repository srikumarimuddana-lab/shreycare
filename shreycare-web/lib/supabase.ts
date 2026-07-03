import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to use Supabase.`);
  }

  return value;
}

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    );
  }

  return supabaseClient;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    supabaseAdminClient = serviceKey
      ? createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), serviceKey)
      : getSupabase();
  }

  return supabaseAdminClient;
}

function lazyClient(getClient: () => SupabaseClient): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get(_target, property) {
      const client = getClient();
      const value = Reflect.get(client, property, client);

      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}

export const supabase = lazyClient(getSupabase);
export const supabaseAdmin = lazyClient(getSupabaseAdmin);
