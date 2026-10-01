import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export async function auditAdminAction(input: { actorId: string; action: string; resource?: string; result: "ok" | "failed" }) {
  console.info(JSON.stringify({ audit: true, ...input, at: new Date().toISOString() }))
  try {
    const admin = createAdminClient()
    await admin.from("admin_audit_log").insert({
      actor_id: input.actorId,
      action: input.action,
      resource: input.resource ?? null,
      result: input.result,
    })
  } catch {
    // The audit table is optional until its migration is applied.
  }
}
