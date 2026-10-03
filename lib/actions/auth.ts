"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { clientAddress, rateLimit } from "@/lib/security/guard"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { fail, mapDbError, ok, type ActionResult } from "@/lib/errors"
import { toE164 } from "@/lib/phone"
import { registerSchema, safeNext } from "@/lib/validators"
import { z } from "zod"

const newPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.")

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return fail("UNEXPECTED_ERROR", "Supabase is not configured yet. Add the keys in .env.local.")

  const phone = toE164(String(formData.get("mobile") ?? ""))
  const password = String(formData.get("password") ?? "")
  if (!phone || password.length < 8) return fail("INVALID_INPUT", "Enter a valid mobile number and password.")
  const address = clientAddress(await headers())
  if (!rateLimit(`login:${address}`, 10, 15 * 60 * 1000)) {
    return fail("INVALID_INPUT", "Too many sign-in attempts. Please wait and try again.")
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ phone, password })
  if (error) {
    const text = error.message.toLowerCase()
    if (text.includes("phone") && text.includes("disabled")) return fail("PHONE_PROVIDER_DISABLED")
    return fail("LOGIN_FAILED")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail("LOGIN_FAILED")

  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle()
  if (!profile?.is_active) {
    await supabase.auth.signOut()
    return fail("ACCOUNT_DISABLED")
  }

  const next = safeNext(String(formData.get("next") ?? ""))
  if (next) redirect(next)
  if (profile.role === "ADMIN" || profile.role === "SUPER_ADMIN") redirect("/admin/dashboard")
  redirect("/dashboard")
}

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return fail("UNEXPECTED_ERROR", "Supabase is not configured yet. Add the keys in .env.local.")

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    mobile: formData.get("mobile"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    targetExam: formData.get("targetExam"),
    targetPaper: formData.get("targetPaper") || undefined,
  })
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the form and try again.")
  }

  const phone = toE164(parsed.data.mobile)
  if (!phone) return fail("INVALID_INPUT", "Enter a 10-digit Indian mobile number.")
  const address = clientAddress(await headers())
  if (!rateLimit(`register:${address}`, 5, 60 * 60 * 1000)) {
    return fail("INVALID_INPUT", "Too many accounts were created from this network. Please wait and try again.")
  }

  let createdId: string | undefined
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      phone,
      password: parsed.data.password,
      phone_confirm: true,
      user_metadata: {
        full_name: parsed.data.fullName,
        mobile_number: phone,
        target_exam: parsed.data.targetExam,
        target_paper: parsed.data.targetExam === "BPSC" ? null : parsed.data.targetPaper,
      },
    })
    if (error || !data.user) {
      const text = (error?.message ?? "").toLowerCase()
      if (text.includes("already") || text.includes("registered") || text.includes("exists") || text.includes("duplicate")) {
        return fail("ACCOUNT_EXISTS")
      }
      return fail("UNEXPECTED_ERROR", "Unable to create the account. Please try again.")
    }
    createdId = data.user.id
  } catch {
    return fail("UNEXPECTED_ERROR", "Unable to create the account. Please try again.")
  }

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ phone, password: parsed.data.password })
  if (signInError) {
    return fail("UNEXPECTED_ERROR", createdId ? "The account was created. Please log in with the same mobile number and password." : "Unable to create the account. Please try again.")
  }
  redirect("/dashboard")
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect("/")
}

export async function updateProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const fullName = String(formData.get("fullName") ?? "").trim()
  const targetExam = String(formData.get("targetExam") ?? "")
  const targetPaper = String(formData.get("targetPaper") ?? "")
  if (fullName.length < 2) return fail("INVALID_INPUT", "Enter your full name.")
  if (!["STET", "BPSC", "BOTH"].includes(targetExam)) return fail("INVALID_INPUT", "Choose a target exam.")
  if (targetExam !== "BPSC" && !["PAPER_I", "PAPER_II", "BOTH"].includes(targetPaper)) {
    return fail("INVALID_INPUT", "Choose Paper I, Paper II, or both papers.")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail("FORBIDDEN")

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      target_exam: targetExam,
      target_paper: targetExam === "BPSC" ? null : targetPaper,
    })
    .eq("id", user.id)
  if (error) return mapDbError(error)
  return ok("Profile updated.")
}

export async function changePasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.phone) return fail("FORBIDDEN")

  const address = clientAddress(await headers())
  if (!rateLimit(`password:${user.id}:${address}`, 5, 15 * 60 * 1000)) {
    return fail("INVALID_INPUT", "Too many password changes. Please wait and try again.")
  }

  const currentPassword = String(formData.get("currentPassword") ?? "")
  const newPassword = String(formData.get("newPassword") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")
  const parsed = newPasswordSchema.safeParse(newPassword)
  if (!currentPassword || !parsed.success) {
    return fail("INVALID_INPUT", parsed.success ? "Enter your current password." : parsed.error.issues[0]?.message)
  }
  if (newPassword !== confirmPassword) return fail("INVALID_INPUT", "Passwords do not match.")
  if (newPassword === currentPassword) return fail("INVALID_INPUT", "Choose a password that is different from the current one.")

  const { error: currentError } = await supabase.auth.signInWithPassword({ phone: user.phone, password: currentPassword })
  if (currentError) return fail("INVALID_INPUT", "The current password is incorrect.")

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return fail("UNEXPECTED_ERROR", "The password could not be changed. Please try again.")
  return ok("Password changed.")
}
