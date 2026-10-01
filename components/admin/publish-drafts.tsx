"use client"

import { useActionState } from "react"
import { SubmitButton } from "@/components/form-bits"
import { publishDraftQuestionsAction } from "@/lib/actions/admin"
import type { ActionResult } from "@/lib/errors"

export function PublishDrafts({ topicId, label }: { topicId?: string; label: string }) {
  const [state, action] = useActionState(publishDraftQuestionsAction, null as ActionResult | null)
  return (
    <form action={action} className="grid gap-2 rounded-xl border border-border bg-card p-4">
      {topicId ? <input type="hidden" name="topicId" value={topicId} /> : null}
      <p className="text-sm text-muted-foreground">
        Draft questions stay hidden from practice. Publish them here if the import box was left unticked.
      </p>
      <div>
        <SubmitButton variant="outline">{label}</SubmitButton>
      </div>
      {state ? <p className={`text-sm ${state.success ? "text-foreground" : "text-destructive"}`}>{state.message}</p> : null}
    </form>
  )
}
