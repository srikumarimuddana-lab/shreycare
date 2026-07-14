import { NextRequest, NextResponse } from "next/server";
import { getStripe, getStripeMode, isStripeConfigured } from "@/lib/stripe";
import { isAuthorized } from "@/lib/admin-auth";
import { logOrderAudit } from "@/lib/payments/audit";
import { HANDLED_STRIPE_EVENTS } from "@/lib/payments/stripe-events";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Stripe configuration surface for the admin settings page: environment
// checklist plus management of webhook endpoints registered in Stripe.
// Secrets are reported as booleans only — never their values.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const config = {
    mode: getStripeMode(),
    secretKeySet: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookSecretSet: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    resendKeySet: Boolean(process.env.RESEND_API_KEY),
    handledEvents: HANDLED_STRIPE_EVENTS,
  };

  if (!isStripeConfigured()) {
    return NextResponse.json({ ...config, endpoints: [] });
  }

  try {
    const endpoints = await getStripe().webhookEndpoints.list({ limit: 20 });
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

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Set STRIPE_SECRET_KEY first." }, { status: 503 });
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
    const endpoint = await getStripe().webhookEndpoints.create({
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
  if (!isStripeConfigured()) {
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
    const endpoint = await getStripe().webhookEndpoints.update(body.id, {
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
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    await getStripe().webhookEndpoints.del(body.id);
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
