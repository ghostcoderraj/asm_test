/**
 * Development-only accounts. Do not use these phones or passwords in production.
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
 */
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding users.")
  process.exit(1)
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const users = [
  { phone: "+919800000001", password: "DevOnly#1001", full_name: "Dev Super Admin", target_exam: "BOTH", target_paper: "BOTH", role: "SUPER_ADMIN" },
  { phone: "+919800000002", password: "DevOnly#1002", full_name: "Dev Admin", target_exam: "BOTH", target_paper: "BOTH", role: "ADMIN" },
  { phone: "+919800000003", password: "DevOnly#1003", full_name: "Dev Student STET", target_exam: "BOTH", target_paper: "BOTH", role: "SUPER_ADMIN" },
  { phone: "+919800000004", password: "DevOnly#1004", full_name: "Dev Student BPSC", target_exam: "BPSC", target_paper: null, role: "STUDENT" },
]

for (const user of users) {
  const existing = await admin.from("profiles").select("id").eq("mobile_number", user.phone).maybeSingle()
  let id = existing.data?.id
  if (!id) {
    const created = await admin.auth.admin.createUser({
      phone: user.phone,
      password: user.password,
      phone_confirm: true,
      user_metadata: {
        full_name: user.full_name,
        mobile_number: user.phone,
        target_exam: user.target_exam,
      },
    })
    if (created.error || !created.data.user) {
      console.error(user.phone, created.error?.message)
      continue
    }
    id = created.data.user.id
  }
  const { error } = await admin.from("profiles").update({ role: user.role, full_name: user.full_name, target_exam: user.target_exam, target_paper: user.target_paper }).eq("id", id)
  if (error) console.error(user.phone, error.message)
  else console.log(`${user.role} ${user.phone}`)
}

const { data: student } = await admin.from("profiles").select("id").eq("mobile_number", "+919800000003").maybeSingle()
if (student) {
  const { data: existingTicket } = await admin.from("support_tickets").select("id").eq("user_id", student.id).limit(1).maybeSingle()
  if (!existingTicket) {
    await admin.from("support_tickets").insert({
      user_id: student.id,
      category: "TEST",
      subject: "Sample timer question",
      description: "This is a fictional development ticket. It is not from a real student.",
      priority: "LOW",
      status: "OPEN",
    })
    console.log("Sample support ticket created")
  }
}
