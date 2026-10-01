import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const paths = ["", "/stet-music-mock-test", "/bpsc-music-mock-test", "/stet-music-practice", "/bpsc-music-practice", "/music-mock-test", "/register", "/login"]
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }))
}
