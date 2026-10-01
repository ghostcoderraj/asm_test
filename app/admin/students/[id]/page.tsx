import { notFound } from "next/navigation"
import { setStudentActiveAction, setStudentRoleAction } from "@/lib/actions/admin"
import { requireAdmin } from "@/lib/auth"
import { examLabel, formatDate, formatInr } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validators"

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const actor = await requireAdmin()
  const supabase = await createClient()
  const { data: student } = await supabase.from("profiles").select("id, full_name, mobile_number, target_exam, role, is_active, created_at").eq("id", id).maybeSingle()
  if (!student) notFound()
  const [{ data: attempts }, { data: subscriptions }, { data: payments }, { data: tickets }] = await Promise.all([
    supabase.from("test_attempts").select("id, status, score, percentage, created_at, tests(title)").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("subscriptions").select("status, expiry_date, subscription_plans(name)").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("payments").select("id, amount, currency, status, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("support_tickets").select("id, ticket_number, subject, status").eq("user_id", id).order("created_at", { ascending: false }),
  ])

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">{student.full_name}</h1>
        <p className="text-sm text-muted-foreground">{student.mobile_number} · {examLabel(student.target_exam)} · {student.role} · joined {formatDate(student.created_at)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <form action={setStudentActiveAction}>
          <input type="hidden" name="id" value={student.id} />
          <input type="hidden" name="active" value={student.is_active ? "false" : "true"} />
          <button className="min-h-11 rounded-lg border border-border px-3 text-sm" type="submit">{student.is_active ? "Disable account" : "Enable account"}</button>
        </form>
        {actor.role === "SUPER_ADMIN" ? (
          <form action={setStudentRoleAction} className="flex gap-2">
            <input type="hidden" name="id" value={student.id} />
            <select name="role" defaultValue={student.role} className="h-11 rounded-lg border border-input px-3">
              <option>STUDENT</option>
              <option>ADMIN</option>
              <option>SUPER_ADMIN</option>
            </select>
            <button className="min-h-11 rounded-lg bg-primary px-3 text-sm text-primary-foreground" type="submit">Change role</button>
          </form>
        ) : null}
      </div>
      <form action="/api/admin/students/reset-password" method="post" className="grid max-w-md gap-2 rounded-xl border border-border bg-card p-4">
        <input type="hidden" name="userId" value={student.id} />
        <p className="text-sm font-medium">Set a new password</p>
        <p className="text-xs text-muted-foreground">The current password cannot be viewed. Tell the student the temporary password directly.</p>
        <input name="password" type="password" minLength={8} required className="h-11 rounded-lg border border-input px-3" />
        <button className="min-h-11 rounded-lg border border-border" type="submit">Reset password</button>
      </form>
      <Section title="Test history">
        {(attempts ?? []).map((attempt) => {
          const test = attempt.tests as { title?: string } | { title?: string }[] | null
          const title = Array.isArray(test) ? test[0]?.title : test?.title
          return <p key={attempt.id}>{title ?? "Practice"} · {attempt.status} · {attempt.score ?? "—"} · {formatDate(attempt.created_at)}</p>
        })}
      </Section>
      <Section title="Subscription">
        {(subscriptions ?? []).map((item, index) => {
          const plan = item.subscription_plans as { name?: string } | { name?: string }[] | null
          const name = Array.isArray(plan) ? plan[0]?.name : plan?.name
          return <p key={index}>{name} · {item.status} · {formatDate(item.expiry_date)}</p>
        })}
      </Section>
      <Section title="Payments">
        {(payments ?? []).map((payment) => <p key={payment.id}>{formatInr(payment.amount, payment.currency)} · {payment.status} · {formatDate(payment.created_at)}</p>)}
      </Section>
      <Section title="Support">
        {(tickets ?? []).map((ticket) => <p key={ticket.id}>{ticket.ticket_number} · {ticket.subject} · {ticket.status}</p>)}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 text-sm">
      <h2 className="font-medium">{title}</h2>
      <div className="mt-2 grid gap-1">{children}</div>
    </section>
  )
}
