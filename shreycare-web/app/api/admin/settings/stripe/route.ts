import { NextRequest, NextResponse } from "next/server";
import { getStripe, getStripeMode, isStripeConfigured } from "@/lib/stripe";
import { isAuthorized } from "@/lib/admin-auth";
import { logOrderAudit } from "@/lib/payments/audit";
import { HANDLED_STRIPE_EVENTS } from "@/lib/payments/stripe-events";
import { getSettingSource, setSetting } from "@/lib/settings";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Stripe configuration surface for the admin settings page: key configuration
// (stored in the DB or env), environment checklist, and management of webhook
// endpoints registered in Stripe. Secret values are NEVER returned — only
// whether they're set and where from (db/env/none).
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const [mode, configured, secretKeySource, webhookSecretSource] =
    await Promise.all([
      getStripeMode(),
      isStripeConfigured(),
      getSettingSource("stripe_secret_key"),
      getSettingSource("stripe_webhook_secret"),
    ]);

  const config = {
    mode,
    secretKeySet: secretKeySource !== "none",
    webhookSecretSet: webhookSecretSource !== "none",
    // Where each secret is resolved from, so the UI can show "saved in panel"
    // vs "using environment variable".
    secretKeySource,
    webhookSecretSource,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    resendKeySet: Boolean(process.env.RESEND_API_KEY),
    handledEvents: HANDLED_STRIPE_EVENTS,
  };

  if (!configured) {
    return NextResponse.json({ ...config, endpoints: [] });
  }

  try {
    const endpoints = await (await getStripe()).webhookEndpoints.list({ limit: 20 });
    return NextResponse.json({
      ...config,
      endpoints: endpoints.data.map((e) => ({
        id: e.id,
        url: e.url,
        status: e.status,
        enabledEvents: e.enabled_events,
        created: e.created,
        apiVersion: e.api_version,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe API error";
    return NextResponse.json({ ...config, endpoints: [], stripeError: message });
  }
}

// Save (or clear) the Stripe secret key and/or webhook signing secret in the
// database, so they can be configured from the admin panel without a redeploy.
// Values are never echoed back; only presence/source is exposed via GET.
export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as {
    stripeSecretKey?: string | null;
    stripeWebhookSecret?: string | null;
  };

  const changed: string[] = [];

  if (body.stripeSecretKey !== undefined) {
    const key = (body.stripeSecretKey ?? "").trim();
    if (key !== "" && !/^(sk|rk)_(live|test)_/.test(key)) {
      return NextResponse.json(
        { error: "That doesn't look like a Stripe secret key (expected sk_live_…, sk_test_…, or a restricted rk_ key)." },
        { status: 400 },
      );
    }
    await setSetting("stripe_secret_key", key || null);
    changed.push(key ? "secret key set" : "secret key cleared");
  }

  if (body.stripeWebhookSecret !== undefined) {
    const secret = (body.stripeWebhookSecret ?? "").trim();
    if (secret !== "" && !secret.startsWith("whsec_")) {
      return NextResponse.json(
        { error: "A Stripe webhook signing secret starts with whsec_." },
        { status: 400 },
      );
    }
    await setSetting("stripe_webhook_secret", secret || null);
    changed.push(secret ? "webhook secret set" : "webhook secret cleared");
  }

  if (changed.length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  logOrderAudit({
    actor: "admin",
    action: "stripe_credentials_updated",
    details: { changed },
  }).catch(() => {});

  const [secretKeySource, webhookSecretSource, mode] = await Promise.all([
    getSettingSource("stripe_secret_key"),
    getSettingSource("stripe_webhook_secret"),
    getStripeMode(),
  ]);

  return NextResponse.json({
    ok: true,
    changed,
    secretKeySource,
    webhookSecretSource,
    mode,
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  if (!(await isStripeConfigured())) {
    return NextResponse.json(
      { error: "Add your Stripe secret key first (below or via STRIPE_SECRET_KEY)." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const url = body.url?.trim();
  if (!url || !/^https:\/\//.test(url)) {
    return NextResponse.json(
      { error: "Webhook URL must be a valid https:// address." },
      { status: 400 },
    );
  }

  try {
    const endpoint = await (await getStripe()).webhookEndpoints.create({
      url,
      enabled_events: [...HANDLED_STRIPE_EVENTS],
      description: "ShreyCare website payments (created from admin settings)",
    });

    logOrderAudit({
      actor: "admin",
      action: "webhook_endpoint_created",
      details: { endpoint_id: endpoint.id, url },
    }).catch(() => {});

    // `secret` is only ever returned at creation time — surface it once so
    // the admin can copy it into STRIPE_WEBHOOK_SECRET.
    return NextResponse.json(
      {
        id: endpoint.id,
        url: endpoint.url,
        secret: endpoint.secret,
        enabledEvents: endpoint.enabled_events,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  if (!(await isStripeConfigured())) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    disabled?: boolean;
  };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const endpoint = await (await getStripe()).webhookEndpoints.update(body.id, {
      disabled: Boolean(body.disabled),
    });
    logOrderAudit({
      actor: "admin",
      action: body.disabled ? "webhook_endpoint_disabled" : "webhook_endpoint_enabled",
      details: { endpoint_id: endpoint.id, url: endpoint.url },
    }).catch(() => {});
    return NextResponse.json({ id: endpoint.id, status: endpoint.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  if (!(await isStripeConfigured())) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    await (await getStripe()).webhookEndpoints.del(body.id);
    logOrderAudit({
      actor: "admin",
      action: "webhook_endpoint_deleted",
      details: { endpoint_id: body.id },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
