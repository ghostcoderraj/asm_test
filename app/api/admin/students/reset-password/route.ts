import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { auditAdminAction } from "@/lib/security/audit"
import { clientAddress, rateLimit, sameOrigin } from "@/lib/security/guard"
import { isUuid } from "@/lib/validators"

export async function POST(request: Request) {
  if (!sameOrigin(request)) redirect("/access-denied")
  const admin = await requireAdmin()
  if (!rateLimit(`reset:${admin.id}:${clientAddress(request.headers)}`, 10, 60 * 60 * 1000)) redirect("/access-denied")
  const form = await request.formData()
  const userId = String(form.get("userId") ?? "")
  const password = String(form.get("password") ?? "")
  if (!isUuid(userId)) redirect("/admin/students")
  const valid = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
  if (!valid) redirect(`/admin/students/${userId}?reset=invalid`)

  let failed = false
  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.updateUserById(userId, { password })
    failed = Boolean(error)
  } catch {
    failed = true
  }
  await auditAdminAction({ actorId: admin.id, action: "reset_student_password", resource: userId, result: failed ? "failed" : "ok" })
  redirect(`/admin/students/${userId}?reset=${failed ? "failed" : "ok"}`)
}
