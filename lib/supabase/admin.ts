import "server-only"
import { createClient } from "@supabase/supabase-js"
import { supabaseUrl } from "@/lib/supabase/env"

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_MISSING")
  return createClient(supabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
