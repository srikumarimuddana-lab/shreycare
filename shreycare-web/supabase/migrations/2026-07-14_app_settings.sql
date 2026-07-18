-- Admin-editable application settings, so credentials like the Stripe keys can
-- be configured from the admin panel instead of only via environment variables.
--
-- Security: this table holds secrets in plaintext, so it is service-role only
-- (RLS denies anon/auth). The app reads it exclusively server-side with the
-- service-role key. Bootstrap secrets (Supabase URL + service-role key, and
-- ADMIN_SECRET) must NOT live here — they're needed to reach this table and to
-- authenticate the admin who edits it, so they stay in the environment.

CREATE TABLE IF NOT EXISTS app_settings (
  key         text PRIMARY KEY,
  value       text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Service role only. No anon/authenticated policy is defined, so RLS denies
-- all access to them; the service role bypasses RLS but we add an explicit
-- policy for clarity/parity with the other tables.
CREATE POLICY "Service role full access"
  ON app_settings FOR ALL USING (true) WITH CHECK (true);
