import { MiniChart } from "@/components/admin/mini-chart"
import { requireAdmin } from "@/lib/auth"
import { formatInr } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

type Dashboard = {
  cards: {
    students: number
    premium_students: number
    questions: number
    published_questions: number
    tests: number
    attempts: number
    revenue: number
    open_tickets: number
    open_reports: number
  }
  registrations: { day: string; count: number }[]
  attempts: { day: string; count: number }[]
  revenue: { day: string; amount: number }[]
  popular_tests: { title: string; attempts: number }[]
  weak_topics: { topic: string; wrong: number }[]
}

export default async function AdminDashboardPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.rpc("admin_dashboard")
  const dash = data as Dashboard | null
  if (!dash) return <p>Apply the database migration to load the admin dashboard.</p>

  const cards = [
    ["Total students", dash.cards.students],
    ["Premium students", dash.cards.premium_students],
    ["Total questions", dash.cards.questions],
    ["Published questions", dash.cards.published_questions],
    ["Total tests", dash.cards.tests],
    ["Test attempts", dash.cards.attempts],
    ["Revenue", formatInr(dash.cards.revenue)],
    ["Open support tickets", dash.cards.open_tickets],
    ["Reported questions", dash.cards.open_reports],
  ]

  return (
    <div className="grid gap-6">
      <h1 className="font-heading text-3xl">Admin dashboard</h1>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-heading text-3xl">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Chart title="Student registrations" data={dash.registrations} xKey="day" yKey="count" />
        <Chart title="Test attempts" data={dash.attempts} xKey="day" yKey="count" />
        <Chart title="Revenue" data={dash.revenue} xKey="day" yKey="amount" />
        <Chart title="Premium is included in revenue and the premium student count above." data={dash.popular_tests} xKey="title" yKey="attempts" heading="Popular tests" />
        <Chart title="Weak topics" data={dash.weak_topics} xKey="topic" yKey="wrong" />
      </section>
    </div>
  )
}

function Chart({ title, heading, data, xKey, yKey }: { title: string; heading?: string; data: Record<string, string | number>[]; xKey: string; yKey: string }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-medium">{heading ?? title}</h2>
      <div className="mt-3">
        <MiniChart data={data} xKey={xKey} yKey={yKey} />
      </div>
    </article>
  )
}
