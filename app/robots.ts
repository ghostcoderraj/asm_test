import type { MetadataRoute } from "next"
import { publicAppUrl } from "@/lib/supabase/env"

export default function robots(): MetadataRoute.Robots {
  const base = publicAppUrl()
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api"] },
    sitemap: `${base}/sitemap.xml`,
  }
}
