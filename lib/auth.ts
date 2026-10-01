import "server-only"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type { Profile, Role } from "@/types/domain"

export async function getCurrentProfile() {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const columns = "id, full_name, mobile_number, target_exam, target_paper, role, is_active, avatar_path"
  const { data, error } = await supabase.from("profiles").select(columns).eq("id", user.id).maybeSingle()
  if (error?.message?.toLowerCase().includes("target_paper")) {
    const fallback = await supabase
      .from("profiles")
      .select("id, full_name, mobile_number, target_exam, role, is_active, avatar_path")
      .eq("id", user.id)
      .maybeSingle()
    if (!fallback.data) return null
    return { ...fallback.data, target_paper: fallback.data.target_exam === "BPSC" ? null : "BOTH" } as Profile
  }

  return data as Profile | null
}

export async function requireUser() {
  if (!isSupabaseConfigured()) redirect("/login?error=config")
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")
  if (!profile.is_active) redirect("/login?error=disabled")
  return profile
}

export async function requireRole(roles: Role[]) {
  const profile = await requireUser()
  if (!roles.includes(profile.role)) redirect("/access-denied")
  return profile
}

export async function requireAdmin() {
  return requireRole(["ADMIN", "SUPER_ADMIN"])
}

export async function requireSuperAdmin() {
  return requireRole(["SUPER_ADMIN"])
}
