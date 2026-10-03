"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const DISMISS_KEY = "asm-install-dismissed"

function subscribe() {
  return () => {}
}

function iosInstallHint() {
  const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
  const installed = "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  return ios && !installed
}

function installDismissed() {
  return localStorage.getItem(DISMISS_KEY) === "1" || window.matchMedia("(display-mode: standalone)").matches
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const pathname = usePathname()
  const iosHint = useSyncExternalStore(subscribe, iosInstallHint, () => false)
  const storedDismiss = useSyncExternalStore(subscribe, installDismissed, () => true)
  const showing = !dismissed && !storedDismiss && (Boolean(prompt) || iosHint) && !pathname.startsWith("/dashboard/attempt")

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  }, [])

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPrompt)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    return () => window.removeEventListener("beforeinstallprompt", onPrompt)
  }, [])

  useEffect(() => {
    if (!showing) return
    const previous = document.body.style.paddingBottom
    document.body.style.paddingBottom = "7.5rem"
    return () => {
      document.body.style.paddingBottom = previous
    }
  }, [showing])

  if (!showing) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1")
    setDismissed(true)
  }

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === "accepted") setDismissed(true)
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
