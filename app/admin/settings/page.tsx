import { announceAction, saveSettingsAction } from "@/lib/actions/admin"
import { ChangePasswordForm } from "@/components/auth/forms"
import { BoundForm } from "@/components/bound-form"
import { SubmitButton } from "@/components/form-bits"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const profile = await requireAdmin()
  const supabase = await createClient()
  const { data: settings } = profile.role === "SUPER_ADMIN"
    ? await supabase.from("platform_settings").select("key, value")
    : { data: [] }
  const limit = settings?.find((item) => item.key === "free_mock_limit")?.value ?? 2
  const thresholds = (settings?.find((item) => item.key === "weak_thresholds")?.value ?? {}) as {
    strong_max?: number
    needs_practice_max?: number
    weak_max?: number
  }

  return (
    <div className="grid max-w-xl gap-8">
      <h1 className="font-heading text-3xl">Settings</h1>
      <ChangePasswordForm />
      {profile.role === "SUPER_ADMIN" ? (
        <BoundForm action={saveSettingsAction}>
          <h2 className="font-medium">Free tests and weak-topic thresholds</h2>
          <Field name="free_mock_limit" label="Free mock tests" defaultValue={String(limit)} />
          <Field name="strong_max" label="Strong: at most this many wrong" defaultValue={String(thresholds.strong_max ?? 1)} />
          <Field name="needs_practice_max" label="Needs practice: at most this many wrong" defaultValue={String(thresholds.needs_practice_max ?? 2)} />
          <Field name="weak_max" label="Weak: at most this many wrong. Above this is critical." defaultValue={String(thresholds.weak_max ?? 4)} />
          <SubmitButton>Save settings</SubmitButton>
        </BoundForm>
      ) : (
        <p className="text-sm text-muted-foreground">Only a super admin can change roles, free-test limits, and weak-topic thresholds.</p>
      )}
      <BoundForm action={announceAction}>
        <h2 className="font-medium">Announcement</h2>
        <div className="grid gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" className="h-11" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" required />
        </div>
        <SubmitButton>Send to students</SubmitButton>
      </BoundForm>
    </div>
  )
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" min={0} defaultValue={defaultValue} className="h-11" />
    </div>
  )
}
