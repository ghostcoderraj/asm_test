"use client"

import Link from "next/link"
import { useActionState } from "react"
import { SubmitButton } from "@/components/form-bits"
import type { ActionResult } from "@/lib/errors"

export function StartForm({
  action,
  hidden,
  label,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>
  hidden?: Record<string, string>
  label: string
}) {
  const [state, formAction] = useActionState(action, null)
  const locked = state?.code === "FREE_LIMIT_REACHED" || state?.code === "PREMIUM_REQUIRED"
  return (
    <form action={formAction} className="grid gap-2">
      {hidden
        ? Object.entries(hidden).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)
        : null}
      {state && !state.success ? (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          <p>{state.message}</p>
          {locked ? (
            <Link href="/dashboard/premium" className="mt-1 inline-block font-medium underline">
              Unlock Premium
            </Link>
          ) : null}
        </div>
      ) : null}
      <SubmitButton>{label}</SubmitButton>
    </form>
  )
}
