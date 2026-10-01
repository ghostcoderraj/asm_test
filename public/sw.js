const OFFLINE_URL = "/offline.html"

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("asm-shell-v1").then((cache) => cache.add(OFFLINE_URL)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET" || request.mode !== "navigate") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  const path = url.pathname
  const privatePath =
    path.startsWith("/api/") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password")

  if (privatePath) return

  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
})
