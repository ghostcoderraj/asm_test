import type { MetadataRoute } from "next"
import { publicAppUrl } from "@/lib/supabase/env"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicAppUrl()
  const paths = ["", "/stet-music-mock-test", "/bpsc-music-mock-test", "/stet-music-practice", "/bpsc-music-practice", "/music-mock-test", "/register", "/login"]
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }))
}
