"use client"

import { useActionState } from "react"
import type { ActionResult } from "@/lib/errors"

export function BoundForm({
  action,
  children,
  className = "grid gap-4",
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>
  children: React.ReactNode
  className?: string
}) {
  const [state, formAction] = useActionState(action, null)
  return (
    <form action={formAction} className={className}>
      {state ? (
        <p className={state.success ? "text-sm text-primary" : "rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"} role="status">
          {state.message}
        </p>
      ) : null}
      {children}
    </form>
  )
}
