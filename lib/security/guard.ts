import "server-only"

const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((time) => now - time < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 5000) {
    const oldest = buckets.keys().next().value
    if (oldest) buckets.delete(oldest)
  }
  return true
}

export function clientAddress(headerStore: { get(name: string): string | null }) {
  const real = headerStore.get("x-real-ip")?.trim()
  if (real) return real
  const forwarded = headerStore.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean) ?? []
  return forwarded.at(-1) || "local"
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host")
  if (origin) {
    try {
      return new URL(origin).host === host
    } catch {
      return false
    }
  }
  const site = request.headers.get("sec-fetch-site")
  if (!site) return true
  return site === "same-origin" || site === "same-site" || site === "none"
}

export function isRazorpayId(value: string, prefix: "pay" | "order") {
  return new RegExp(`^${prefix}_[A-Za-z0-9]+$`).test(value)
}
