"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const DISMISS_KEY = "asm-install-dismissed"

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [iosHint, setIosHint] = useState(false)
  const [hidden, setHidden] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if (localStorage.getItem(DISMISS_KEY) === "1") return

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPrompt)
      setHidden(false)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    const installed = "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
    if (ios && !installed) {
      setIosHint(true)
      setHidden(false)
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt)
  }, [])

  if (hidden || pathname.startsWith("/dashboard/attempt")) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1")
    setHidden(true)
  }

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === "accepted") setHidden(true)
    setPrompt(null)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="font-medium">Install ASM Tests</span>
          <span className="mt-1 block text-muted-foreground">
            {iosHint && !prompt
              ? "On iPhone, tap Share, then Add to Home Screen."
              : "Add the test series to your phone home screen and open it like an app."}
          </span>
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="min-h-11" onClick={dismiss}>
            Not now
          </Button>
          {prompt ? (
            <Button type="button" className="min-h-11" onClick={install}>
              Install app
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
