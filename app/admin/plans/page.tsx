import { savePlanAction } from "@/lib/actions/admin"
import { BoundForm } from "@/components/bound-form"
import { SubmitButton } from "@/components/form-bits"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requireAdmin } from "@/lib/auth"
import { formatInr } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export default async function PlansPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: plans } = await supabase.from("subscription_plans").select("id, name, description, price, currency, duration_days, features, is_active").order("price")
  return (
    <div className="grid gap-6">
      <h1 className="font-heading text-3xl">Subscription plans</h1>
      <p className="text-sm text-muted-foreground">The public price is read from this table. Do not hardcode it in the page.</p>
      {(plans ?? []).map((plan) => (
        <BoundForm key={plan.id} action={savePlanAction} className="grid max-w-xl gap-3 rounded-xl border border-border bg-card p-4">
          <input type="hidden" name="id" value={plan.id} />
          <p className="text-sm text-muted-foreground">Current price {formatInr(plan.price, plan.currency)}</p>
          <Field name="name" label="Name" defaultValue={plan.name} />
          <div className="grid gap-1.5">
            <Label htmlFor={`description-${plan.id}`}>Description</Label>
            <Textarea id={`description-${plan.id}`} name="description" defaultValue={plan.description ?? ""} />
          </div>
          <Field name="price" label="Price in rupees" defaultValue={String(plan.price)} />
          <Field name="duration_days" label="Duration in days" defaultValue={String(plan.duration_days)} />
          <div className="grid gap-1.5">
            <Label htmlFor={`features-${plan.id}`}>Features, one per line</Label>
            <Textarea id={`features-${plan.id}`} name="features" defaultValue={(plan.features ?? []).join("\n")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={plan.is_active} />
            Active
          </label>
          <SubmitButton>Save plan</SubmitButton>
        </BoundForm>
      ))}
    </div>
  )
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} className="h-11" />
    </div>
  )
}
