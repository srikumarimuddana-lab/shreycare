"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

interface Endpoint {
  id: string;
  url: string;
  status: string;
  enabledEvents: string[];
  created: number;
}

interface StripeSettings {
  mode: "live" | "test" | "unconfigured";
  secretKeySet: boolean;
  webhookSecretSet: boolean;
  siteUrl: string | null;
  resendKeySet: boolean;
  handledEvents: string[];
  endpoints: Endpoint[];
  stripeError?: string;
}

interface NewEndpointSecret {
  id: string;
  url: string;
  secret: string;
}

export function SettingsDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [settings, setSettings] = useState<StripeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<NewEndpointSecret | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/admin/settings/stripe");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = (await res.json()) as StripeSettings;
    setSettings(data);
    setNewUrl((current) =>
      current || (data.siteUrl ? `${data.siteUrl}/api/webhooks/stripe` : ""),
    );
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function createEndpoint() {
    if (!newUrl) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/settings/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create endpoint.");
      setCreatedSecret(data);
      toast("Webhook endpoint created in Stripe.", "success");
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create endpoint.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function toggleEndpoint(endpoint: Endpoint) {
    const disable = endpoint.status === "enabled";
    const res = await fetch("/api/admin/settings/stripe", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: endpoint.id, disabled: disable }),
    });
    if (res.ok) {
      toast(`Endpoint ${disable ? "disabled" : "enabled"}.`, "success");
      fetchData();
    } else {
      toast("Update failed.", "error");
    }
  }

  async function deleteEndpoint(endpoint: Endpoint) {
    if (!confirm(`Delete webhook endpoint ${endpoint.url}? Stripe will stop sending events to it.`)) return;
    const res = await fetch("/api/admin/settings/stripe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: endpoint.id }),
    });
    if (res.ok) {
      toast("Endpoint deleted.", "success");
      fetchData();
    } else {
      toast("Delete failed.", "error");
    }
  }

  function copySecret() {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret.secret).then(
      () => toast("Signing secret copied.", "success"),
      () => toast("Copy failed — select and copy manually.", "error"),
    );
  }

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-on-surface-variant text-sm">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Configuration checklist ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
        <h2 className="font-headline text-lg text-primary">Payment configuration</h2>
        <ul className="space-y-2.5 text-sm">
          <CheckRow
            ok={settings.secretKeySet}
            label="Stripe secret key"
            detail={
              settings.secretKeySet
                ? `Configured — ${settings.mode.toUpperCase()} mode`
                : "Set STRIPE_SECRET_KEY in your hosting environment to enable card payments."
            }
          />
          <CheckRow
            ok={settings.webhookSecretSet}
            label="Webhook signing secret"
            detail={
              settings.webhookSecretSet
                ? "Configured — incoming Stripe events are signature-verified."
                : "Create a webhook endpoint below, then set STRIPE_WEBHOOK_SECRET to its signing secret."
            }
          />
          <CheckRow
            ok={Boolean(settings.siteUrl)}
            label="Public site URL"
            detail={
              settings.siteUrl
                ? settings.siteUrl
                : "Set NEXT_PUBLIC_SITE_URL so payment links and QR codes use your real domain."
            }
          />
          <CheckRow
            ok={settings.resendKeySet}
            label="Email (Resend)"
            detail={
              settings.resendKeySet
                ? "Configured — receipts and payment alerts will send."
                : "Set RESEND_API_KEY to send receipts and payment notifications."
            }
          />
        </ul>
        {settings.mode === "test" && (
          <p className="text-xs bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-lg px-4 py-3">
            Stripe is in TEST mode — no real cards will be charged. Swap in your
            live keys (sk_live_…) when you&apos;re ready to accept real payments.
          </p>
        )}
      </div>

      {/* ── New endpoint signing secret (shown once) ── */}
      {createdSecret && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-5 space-y-3">
          <h3 className="font-headline text-lg text-green-900">
            Webhook created — copy its signing secret now
          </h3>
          <p className="text-sm text-green-900">
            Stripe only reveals this secret once. Add it to your hosting
            environment as <code className="font-mono text-xs">STRIPE_WEBHOOK_SECRET</code> and
            redeploy — the webhook rejects unsigned events until then.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-xs bg-white border border-green-300 rounded-lg px-3 py-2 overflow-x-auto">
              {createdSecret.secret}
            </code>
            <button
              onClick={copySecret}
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setCreatedSecret(null)}
            className="text-xs text-green-900 underline"
          >
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      {/* ── Webhook endpoints ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
        <h2 className="font-headline text-lg text-primary">Stripe webhook endpoints</h2>
        <p className="text-sm text-on-surface-variant">
          Stripe pushes payment events (payments, refunds, disputes, expiries)
          to these URLs. The website needs exactly one endpoint pointing at{" "}
          <code className="font-mono text-xs">/api/webhooks/stripe</code>, subscribed to the{" "}
          {settings.handledEvents.length} events the site handles.
        </p>

        {settings.stripeError && (
          <p className="text-sm bg-red-50 border border-red-300 text-red-900 rounded-lg px-4 py-3">
            Couldn&apos;t reach Stripe: {settings.stripeError}
          </p>
        )}

        {settings.endpoints.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-on-surface-variant text-xs">
                  <th className="py-2 pr-4">URL</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Events</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {settings.endpoints.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs break-all">{e.url}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        e.status === "enabled"
                          ? "bg-green-100 text-green-800"
                          : "bg-surface-container text-on-surface-variant"
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-on-surface-variant">
                      {e.enabledEvents.includes("*") ? "all" : e.enabledEvents.length}
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleEndpoint(e)}
                        className="text-xs font-semibold text-primary hover:underline mr-3"
                      >
                        {e.status === "enabled" ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => deleteEndpoint(e)}
                        className="text-xs font-semibold text-error hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-outline-variant/40 pt-4 space-y-2">
          <label className="block text-[10px] font-semibold text-primary uppercase tracking-widest">
            Add endpoint
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-domain.com/api/webhooks/stripe"
              className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={createEndpoint}
              disabled={creating || !settings.secretKeySet || !newUrl}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Creating…" : "Create in Stripe"}
            </button>
          </div>
          <p className="text-xs text-on-surface-variant">
            The endpoint is created in your Stripe account, subscribed to:{" "}
            {settings.handledEvents.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`material-symbols-outlined text-lg leading-5 mt-0.5 ${
          ok ? "text-green-700" : "text-yellow-700"
        }`}
      >
        {ok ? "check_circle" : "error"}
      </span>
      <div>
        <p className="font-semibold text-on-surface text-sm">{label}</p>
        <p className="text-xs text-on-surface-variant">{detail}</p>
      </div>
    </li>
  );
}
