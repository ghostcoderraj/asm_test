import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { formatDate } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export default async function SupportPage() {
  const profile = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, status, priority, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">Support</h1>
        <Link href="/dashboard/support/new" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground">
          Raise a query
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Email <a className="text-primary underline" href="mailto:anandsangitmahavidyalaya@gmail.com">anandsangitmahavidyalaya@gmail.com</a>.
        If payment is done and the course is still locked, call <a className="text-primary underline" href="tel:+91915327692">+91 915327692</a>.
      </p>
      <div className="grid gap-2">
        {(data ?? []).map((ticket) => (
          <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`} className="rounded-xl border border-border bg-card p-4 text-sm">
            <span className="font-medium">{ticket.ticket_number} · {ticket.subject}</span>
            <span className="mt-1 block text-muted-foreground">{ticket.status} · {ticket.priority} · {formatDate(ticket.created_at)}</span>
          </Link>
        ))}
        {(data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No queries yet.</p> : null}
      </div>
    </div>
  )
}
