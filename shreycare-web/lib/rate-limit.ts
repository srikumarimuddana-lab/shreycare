// Minimal in-memory sliding-window rate limiter for abuse-prone public
// endpoints (checkout session creation, pay links). Per-instance only — on
// serverless this resets per cold start, which is fine: the goal is to blunt
// bursts from a single client, not to be a distributed quota system.

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow unbounded.
  if (windows.size > 10_000) {
    for (const [k, w] of windows) {
      if (w.resetAt <= now) windows.delete(k);
    }
  }

  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
