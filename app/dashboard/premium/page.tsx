import Link from "next/link"
import { CheckoutButton } from "@/components/payments/checkout-button"
import { requireUser } from "@/lib/auth"
import { formatDate, formatInr, examLabel } from "@/lib/format"
import { planTargetExam } from "@/lib/plans"
import { createClient } from "@/lib/supabase/server"
import type { Plan } from "@/types/domain"

const included = [
  "All mock tests",
  "5,000+ questions as the bank grows",
  "Topic practice",
  "Detailed analytics",
  "Weak topic recommendations",
  "Personalized practice",
  "Test history",
]

export default async function PremiumPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const profile = await requireUser()
  const params = await searchParams
  const supabase = await createClient()
  const [{ data: plans }, { data: subscriptions }] = await Promise.all([
    supabase.from("subscription_plans").select("id, name, description, price, currency, duration_days, features").eq("is_active", true).order("price"),
    supabase.from("subscriptions").select("status, expiry_date, plan_id, created_at").eq("user_id", profile.id).order("created_at", { ascending: false }),
  ])
  const rows = subscriptions ?? []
  const subscription = rows.find((row) => row.status === "ACTIVE" && row.expiry_date && new Date(row.expiry_date) > new Date()) ?? rows[0]
  const active = subscription?.status === "ACTIVE" && Boolean(subscription.expiry_date && new Date(subscription.expiry_date) > new Date())
  const offered = profile.target_exam === "BPSC"
    ? []
    : ((plans as Plan[] | null) ?? []).filter((plan) => planTargetExam(plan.name) === profile.target_exam)

  return (
    <div className="grid max-w-2xl gap-4">
      <h1 className="font-heading text-3xl">Premium</h1>
      <p className="text-sm text-muted-foreground">
        Your target is {examLabel(profile.target_exam)}. The price below is the plan for that exam. Change the target exam from Profile if you are preparing for a different exam.
      </p>
      {params.paid && active ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          Payment verified. Premium is active. <Link href="/dashboard/tests" className="text-primary underline">Open mock tests</Link>
        </p>
      ) : null}
      {params.paid && !active ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">The payment could not be confirmed, so mock tests are still locked.</p> : null}
      <p className="text-sm text-muted-foreground">
        Paid but the course is still locked? Call <a className="text-primary underline" href="tel:+91915327692">+91 915327692</a> or email <a className="text-primary underline" href="mailto:anandsangitmahavidyalaya@gmail.com">anandsangitmahavidyalaya@gmail.com</a>.
      </p>
      <p className="text-sm">Status: {active ? "Active" : "Not active"} · Expiry: {formatDate(subscription?.expiry_date)}</p>
      {offered.map((plan) => (
        <article key={plan.id} className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-2xl">{plan.name}</h2>
          <p className="mt-2 font-heading text-4xl">{formatInr(plan.price, plan.currency)}</p>
          <p className="text-sm text-muted-foreground">{plan.duration_days} days</p>
          {plan.description ? <p className="mt-2 text-sm">{plan.description}</p> : null}
          <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
            {(plan.features?.length ? plan.features : included).map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          {active ? <p className="mt-4 text-sm">Your premium access is already active.</p> : <div className="mt-4"><CheckoutButton planId={plan.id} label="Unlock Premium" /></div>}
        </article>
      ))}
      {profile.target_exam === "BOTH" ? (
        <p className="text-sm text-muted-foreground">STET mock tests and practice are open now. BPSC is coming soon.</p>
      ) : null}
      {profile.target_exam === "BPSC" ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">BPSC Music is coming soon. STET mock tests and practice are open now. Students enrolled for both exams can use the STET series.</p>
      ) : null}
      {offered.length === 0 && profile.target_exam !== "BPSC" ? <p className="text-sm text-muted-foreground">No active plan has been published yet for {examLabel(profile.target_exam)}.</p> : null}
    </div>
  )
}
