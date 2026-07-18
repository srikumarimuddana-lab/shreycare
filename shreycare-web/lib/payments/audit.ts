import { supabaseAdmin } from "@/lib/supabase";

export interface AuditEntry {
  saleId?: string | null;
  orderNumber?: string | null;
  actor: "admin" | "system:stripe" | "customer";
  action: string;
  details?: Record<string, unknown> | null;
}

// Append-only audit trail. Fire-and-forget by design: an audit insert failure
// must never break the order flow it documents, so errors are logged only.
export async function logOrderAudit(entry: AuditEntry): Promise<void> {
  const { error } = await supabaseAdmin.from("order_audit_log").insert({
    sale_id: entry.saleId ?? null,
    order_number: entry.orderNumber ?? null,
    actor: entry.actor,
    action: entry.action,
    details: entry.details ?? null,
  });
  if (error) {
    console.error("[audit] insert failed:", error, entry.action);
  }
}
