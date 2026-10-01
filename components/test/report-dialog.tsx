"use client"

import { useActionState, useState } from "react"
import { reportQuestionAction } from "@/lib/actions/student"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { controlClass, SubmitButton } from "@/components/form-bits"

const reasons = [
  ["WRONG_ANSWER", "Wrong answer"],
  ["INCORRECT_QUESTION", "Incorrect question"],
  ["TYPO", "Typo"],
  ["DUPLICATE", "Duplicate"],
  ["OTHER", "Other"],
]

export function ReportDialog({ questionId, attemptId }: { questionId: string; attemptId?: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(reportQuestionAction, null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="ghost" className="min-h-11" />}>
        Report question
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report question</DialogTitle>
          <DialogDescription>Tell the academic team what looks wrong. This does not change your score.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="questionId" value={questionId} />
          <input type="hidden" name="attemptId" value={attemptId ?? ""} />
          <div className="grid gap-1.5">
            <Label htmlFor="reason">Reason</Label>
            <select id="reason" name="reason" className={controlClass} defaultValue="WRONG_ANSWER">
              {reasons.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Optional details" />
          </div>
          {state ? <p className={state.success ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p> : null}
          <SubmitButton>Submit report</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
