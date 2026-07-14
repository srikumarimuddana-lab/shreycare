"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Categorical palette for payment methods — fixed assignment, never cycled.
// Validated for lightness band, chroma, CVD separation, and contrast against
// the light admin surface (see dataviz palette validator).
const METHOD_COLORS: Record<string, string> = {
  stripe: "#4f772d",
  interac: "#2f6bb5",
  cash: "#a4762c",
  other: "#9c4f8f",
};
const METHOD_ORDER = ["stripe", "interac", "cash", "other"] as const;
const METHOD_LABELS: Record<string, string> = {
  stripe: "Card (Stripe)",
  interac: "e-Transfer",
  cash: "Cash",
  other: "Other",
};

interface MethodBucket {
  method: string;
  count: number;
  grossRevenue: number;
  collected: number;
  pending: number;
  refunded: number;
  disputed: number;
  failedOrExpired: number;
}

interface MonthPoint {
  month: string;
  stripe: number;
  interac: number;
  cash: number;
  other: number;
  total: number;
}

interface WebhookEvent {
  id: string;
  type: string;
  status: string;
  order_number: string | null;
  error: string | null;
  received_at: string;
}

interface AuditEntry {
  id: string;
  order_number: string | null;
  actor: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface Analytics {
  totalOrders: number;
  grossRevenue: number;
  collected: number;
  pending: number;
  refunded: number;
  disputed: number;
  averageOrderValue: number;
  byMethod: MethodBucket[];
  monthly: MonthPoint[];
  statusCounts: Record<string, number>;
  stripeMode: "live" | "test" | "unconfigured";
  webhookEvents: WebhookEvent[];
  auditLog: AuditEntry[];
  auditTablesMissing: boolean;
}

const money = (n: number) =>
  `$${n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PaymentsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/admin/payments/analytics?${params}`);
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    setData(await res.json());
    setLoading(false);
  }, [from, to, router]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-on-surface-variant text-sm">Loading payments…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode banner + filters */}
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <ModeBadge mode={data.stripeMode} />
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-primary uppercase tracking-widest">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-outline-variant/50 bg-surface-container-lowest" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-primary uppercase tracking-widest">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-outline-variant/50 bg-surface-container-lowest" />
          </div>
          {(from || to) && (
            <button onClick={() => { setFrom(""); setTo(""); }}
              className="text-error text-xs font-semibold hover:underline px-2 py-1.5">
              Clear
            </button>
          )}
        </div>
      </div>

      {data.auditTablesMissing && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-xl px-5 py-4 text-sm">
          The Stripe audit tables were not found. Run the migration
          {" "}<code className="font-mono text-xs">supabase/migrations/2026-07-13_stripe_payments.sql</code>{" "}
          in the Supabase SQL editor to enable webhook history and the order audit trail.
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <Stat label="Collected" value={money(data.collected)} accent="text-green-700" sub="Net of refunds" />
        <Stat label="Pending" value={money(data.pending)} accent="text-yellow-700" sub="Awaiting payment" />
        <Stat label="Refunded" value={money(data.refunded)} accent="text-red-700" sub="Returned to customers" />
        <Stat label="Disputed" value={money(data.disputed)} accent="text-red-700" sub="Chargebacks open" />
        <Stat label="Avg order" value={money(data.averageOrderValue)} sub="Across paid orders" />
        <Stat label="Orders" value={`${data.totalOrders}`} sub="All payment states" />
      </div>

      {/* Monthly revenue by method */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-headline text-lg text-primary">Collected revenue by month</h2>
          <Legend />
        </div>
        <MonthlyChart monthly={data.monthly} />
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-primary uppercase tracking-widest">View as table</summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-on-surface-variant">
                  <th className="py-1.5 pr-4">Month</th>
                  {METHOD_ORDER.map((m) => (
                    <th key={m} className="py-1.5 pr-4">{METHOD_LABELS[m]}</th>
                  ))}
                  <th className="py-1.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {data.monthly.map((p) => (
                  <tr key={p.month}>
                    <td className="py-1.5 pr-4 font-mono">{p.month}</td>
                    {METHOD_ORDER.map((m) => (
                      <td key={m} className="py-1.5 pr-4">{money(p[m as keyof MonthPoint] as number)}</td>
                    ))}
                    <td className="py-1.5 font-semibold">{money(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {/* Method breakdown */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
        <h2 className="font-headline text-lg text-primary">By payment method</h2>
        <MethodBars buckets={data.byMethod} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-on-surface-variant text-xs">
                <th className="py-2 pr-4">Method</th>
                <th className="py-2 pr-4 text-right">Orders</th>
                <th className="py-2 pr-4 text-right">Gross</th>
                <th className="py-2 pr-4 text-right">Collected</th>
                <th className="py-2 pr-4 text-right">Pending</th>
                <th className="py-2 pr-4 text-right">Refunded</th>
                <th className="py-2 text-right">Failed / expired</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {data.byMethod.map((b) => (
                <tr key={b.method}>
                  <td className="py-2.5 pr-4">
                    <span className="inline-flex items-center gap-2 font-medium text-on-surface">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: METHOD_COLORS[b.method] }} />
                      {METHOD_LABELS[b.method] ?? b.method}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right">{b.count}</td>
                  <td className="py-2.5 pr-4 text-right">{money(b.grossRevenue)}</td>
                  <td className="py-2.5 pr-4 text-right font-semibold">{money(b.collected)}</td>
                  <td className="py-2.5 pr-4 text-right">{money(b.pending)}</td>
                  <td className="py-2.5 pr-4 text-right">{money(b.refunded)}</td>
                  <td className="py-2.5 text-right">{money(b.failedOrExpired)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stripe webhook activity */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-3">
        <h2 className="font-headline text-lg text-primary">Recent Stripe events</h2>
        {data.webhookEvents.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            No webhook events yet. Configure the webhook endpoint under Settings, then events will appear here as payments happen.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-on-surface-variant">
                  <th className="py-2 pr-4">Received</th>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {data.webhookEvents.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 pr-4 whitespace-nowrap text-on-surface-variant">{formatDateTime(e.received_at)}</td>
                    <td className="py-2 pr-4 font-mono">{e.type}</td>
                    <td className="py-2 pr-4 font-mono text-primary">{e.order_number ?? "—"}</td>
                    <td className="py-2 pr-4"><EventStatus status={e.status} /></td>
                    <td className="py-2 text-on-surface-variant max-w-[18rem] truncate" title={e.error ?? ""}>{e.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order audit trail */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-3">
        <h2 className="font-headline text-lg text-primary">Order audit trail</h2>
        {data.auditLog.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No audit entries yet. Order creations, edits, payments, and refunds will be recorded here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-on-surface-variant">
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Actor</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {data.auditLog.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-4 whitespace-nowrap text-on-surface-variant">{formatDateTime(a.created_at)}</td>
                    <td className="py-2 pr-4 font-mono text-primary">{a.order_number ?? "—"}</td>
                    <td className="py-2 pr-4">{a.actor}</td>
                    <td className="py-2 pr-4 font-semibold">{a.action.replace(/_/g, " ")}</td>
                    <td className="py-2 text-on-surface-variant max-w-[24rem] truncate" title={a.details ? JSON.stringify(a.details) : ""}>
                      {a.details ? summariseDetails(a.details) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function summariseDetails(details: Record<string, unknown>): string {
  if (details.changes && typeof details.changes === "object") {
    return `changed: ${Object.keys(details.changes as object).join(", ")}`;
  }
  return Object.entries(details)
    .filter(([, v]) => v !== null && typeof v !== "object")
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-CA", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function Stat({ label, value, sub, accent = "text-primary" }: {
  label: string; value: string; sub: string; accent?: string;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-1">{label}</p>
      <p className={`text-lg sm:text-xl font-bold ${accent}`}>{value}</p>
      <p className="text-[11px] text-on-surface-variant mt-0.5">{sub}</p>
    </div>
  );
}

function ModeBadge({ mode }: { mode: "live" | "test" | "unconfigured" }) {
  const styles = {
    live: "bg-green-100 text-green-800 border-green-300",
    test: "bg-yellow-100 text-yellow-800 border-yellow-300",
    unconfigured: "bg-red-100 text-red-800 border-red-300",
  }[mode];
  const label = {
    live: "Stripe: LIVE mode",
    test: "Stripe: TEST mode",
    unconfigured: "Stripe not configured",
  }[mode];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${styles}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {label}
    </span>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3">
      {METHOD_ORDER.map((m) => (
        <span key={m} className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: METHOD_COLORS[m] }} />
          {METHOD_LABELS[m]}
        </span>
      ))}
    </div>
  );
}

// Stacked monthly bar chart: thin bars, 2px surface gaps between segments,
// hover tooltip per month, recessive gridlines. Values live in the tooltip
// and the "view as table" fallback rather than on every mark.
function MonthlyChart({ monthly }: { monthly: MonthPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 720;
  const H = 220;
  const PAD_L = 48;
  const PAD_B = 24;
  const PAD_T = 12;
  const plotW = W - PAD_L - 8;
  const plotH = H - PAD_T - PAD_B;

  const max = Math.max(1, ...monthly.map((p) => p.total));
  // Round the axis top to a friendly step.
  const step = niceStep(max / 4);
  const axisMax = Math.max(step, Math.ceil(max / step) * step);
  const y = (v: number) => PAD_T + plotH - (v / axisMax) * plotH;

  const slot = plotW / monthly.length;
  const barW = Math.min(28, slot * 0.55);

  const hovered = hover !== null ? monthly[hover] : null;

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img"
        aria-label="Monthly collected revenue, stacked by payment method">
        {/* gridlines + y labels */}
        {Array.from({ length: 5 }, (_, i) => {
          const v = (axisMax / 4) * i;
          return (
            <g key={i}>
              <line x1={PAD_L} x2={W - 8} y1={y(v)} y2={y(v)} stroke="#e5e2dd" strokeWidth={1} />
              <text x={PAD_L - 6} y={y(v) + 3} textAnchor="end" fontSize={9} fill="#75716b">
                {v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `$${v}`}
              </text>
            </g>
          );
        })}

        {monthly.map((p, i) => {
          const x = PAD_L + slot * i + (slot - barW) / 2;
          let cursor = y(0);
          const segments = METHOD_ORDER.map((m) => {
            const v = p[m] as number;
            const h = (v / axisMax) * plotH;
            const seg = { m, v, y: cursor - h, h };
            cursor -= h + (v > 0 ? 2 : 0); // 2px surface gap between segments
            return seg;
          }).filter((s) => s.v > 0);

          return (
            <g key={p.month}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}>
              {/* hover hit target wider than the mark */}
              <rect x={PAD_L + slot * i} y={PAD_T} width={slot} height={plotH}
                fill={hover === i ? "#38452710" : "transparent"} />
              {segments.map((s, j) => (
                <rect key={s.m} x={x} y={s.y} width={barW} height={Math.max(1, s.h)}
                  rx={j === segments.length - 1 ? 3 : 0}
                  fill={METHOD_COLORS[s.m]} />
              ))}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize={9} fill="#75716b">
                {monthLabel(p.month)}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute top-2 right-2 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-md px-3 py-2 text-xs space-y-1">
          <p className="font-bold text-on-surface">{monthLabel(hovered.month)} — {money(hovered.total)}</p>
          {METHOD_ORDER.filter((m) => (hovered[m] as number) > 0).map((m) => (
            <p key={m} className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: METHOD_COLORS[m] }} />
              {METHOD_LABELS[m]}: {money(hovered[m] as number)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Horizontal collected-revenue bars per method with direct labels.
function MethodBars({ buckets }: { buckets: MethodBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.collected));
  return (
    <div className="space-y-2.5">
      {buckets.map((b) => (
        <div key={b.method} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs font-medium text-on-surface-variant">
            {METHOD_LABELS[b.method] ?? b.method}
          </span>
          <div className="flex-1 h-5 bg-surface-container-low rounded overflow-hidden">
            <div className="h-full rounded-r"
              style={{
                width: `${Math.max(b.collected > 0 ? 2 : 0, (b.collected / max) * 100)}%`,
                backgroundColor: METHOD_COLORS[b.method],
              }} />
          </div>
          <span className="w-24 shrink-0 text-right text-xs font-semibold text-on-surface">
            {money(b.collected)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EventStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    processed: "bg-green-100 text-green-800",
    skipped: "bg-surface-container text-on-surface-variant",
    error: "bg-red-100 text-red-800",
    processing: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

function monthLabel(yyyyMm: string): string {
  const [yr, mo] = yyyyMm.split("-").map(Number);
  return new Date(Date.UTC(yr, mo - 1, 1)).toLocaleDateString("en-CA", {
    month: "short", timeZone: "UTC",
  });
}

function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const unit = raw / pow;
  if (unit <= 1) return pow;
  if (unit <= 2) return 2 * pow;
  if (unit <= 5) return 5 * pow;
  return 10 * pow;
}
