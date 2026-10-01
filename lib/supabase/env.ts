export function publicAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (configured && !configured.includes("localhost")) return configured
  if (process.env.VERCEL_ENV === "production") return "https://test.anandsangit.com"
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return configured || "http://localhost:3000"
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error("SUPABASE_NOT_CONFIGURED")
  return url
}

export function supabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error("SUPABASE_NOT_CONFIGURED")
  return key
}
