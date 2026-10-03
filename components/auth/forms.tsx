"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { changePasswordAction, loginAction, registerAction, updateProfileAction } from "@/lib/actions/auth"
import { SubmitButton } from "@/components/form-bits"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ActionResult } from "@/lib/errors"

const exams = [
  ["STET", "STET Music"],
  ["BPSC", "BPSC Music (coming soon)"],
  ["BOTH", "Both STET & BPSC (BPSC coming soon)"],
] as const

const papers = [
  ["PAPER_I", "Paper I"],
  ["PAPER_II", "Paper II"],
  ["BOTH", "Both papers"],
] as const

function PaperChoice({ value }: { value?: string }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">STET paper</legend>
      {papers.map(([paper, label]) => (
        <label key={paper} className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3">
          <input type="radio" name="targetPaper" value={paper} required defaultChecked={value === paper} className="size-4 accent-primary" />
          {label}
        </label>
      ))}
    </fieldset>
  )
}

function FormError({ state }: { state: ActionResult | null }) {
  if (!state || state.success) return state?.success ? <p className="text-sm text-primary">{state.message}</p> : null
  return (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
      {state.message}
    </p>
  )
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, null)
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <FormError state={state} />
      <div className="grid gap-1.5">
        <Label htmlFor="mobile">Mobile number</Label>
        <Input id="mobile" name="mobile" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" className="h-11 text-base md:text-base" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" className="h-11 text-base md:text-base" required />
      </div>
      <SubmitButton>Login</SubmitButton>
      <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
        Forgot password?
      </Link>
    </form>
  )
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, null)
  const [exam, setExam] = useState("")
  return (
    <form action={action} className="grid gap-4">
      <FormError state={state} />
      <div className="grid gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" className="h-11 text-base md:text-base" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="mobile">Mobile number</Label>
        <Input id="mobile" name="mobile" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" className="h-11 text-base md:text-base" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" className="h-11 text-base md:text-base" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className="h-11 text-base md:text-base" required />
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Target exam</legend>
        {exams.map(([value, label]) => (
          <label key={value} className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3">
            <input type="radio" name="targetExam" value={value} required checked={exam === value} onChange={() => setExam(value)} className="size-4 accent-primary" />
            {label}
          </label>
        ))}
        <p className="text-xs text-muted-foreground">STET mock tests and practice are open now. BPSC is coming soon. Students enrolled for both can use the STET series until then.</p>
      </fieldset>
      {exam === "STET" || exam === "BOTH" ? <PaperChoice /> : null}
      <SubmitButton>Create account</SubmitButton>
    </form>
  )
}

export function ProfileForm({
  fullName,
  targetExam,
  targetPaper,
  mobile,
}: {
  fullName: string
  targetExam: string
  targetPaper?: string | null
  mobile: string
}) {
  const [state, action] = useActionState(updateProfileAction, null)
  const [exam, setExam] = useState(targetExam)
  return (
    <form action={action} className="grid gap-4">
      <FormError state={state} />
      <div className="grid gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} className="h-11 text-base md:text-base" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="mobile">Mobile number</Label>
        <Input id="mobile" value={mobile} readOnly className="h-11 text-base md:text-base" />
        <p className="text-xs text-muted-foreground">Mobile number is the login identity and cannot be changed here.</p>
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Target exam</legend>
        {exams.map(([value, label]) => (
          <label key={value} className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3">
            <input type="radio" name="targetExam" value={value} checked={exam === value} onChange={() => setExam(value)} className="size-4 accent-primary" />
            {label}
          </label>
        ))}
        <p className="text-xs text-muted-foreground">STET mock tests and practice are open now. BPSC is coming soon.</p>
      </fieldset>
      {exam === "STET" || exam === "BOTH" ? <PaperChoice value={targetPaper ?? "BOTH"} /> : null}
      <SubmitButton>Save profile</SubmitButton>
    </form>
  )
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="grid gap-4 rounded-xl border border-border bg-card p-4">
      <div>
        <h2 className="font-heading text-2xl">Change password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter the current password, then choose a new one. It must be at least 8 characters and include a letter and a number.</p>
      </div>
      <FormError state={state} />
      <div className="grid gap-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" className="h-11 text-base md:text-base" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" className="h-11 text-base md:text-base" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className="h-11 text-base md:text-base" required />
      </div>
      <SubmitButton>Change password</SubmitButton>
    </form>
  )
}
