import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { formatDate } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin()
  const { status } = await searchParams
  const supabase = await createClient()
  let query = supabase.from("support_tickets").select("id, ticket_number, subject, status, priority, category, created_at").order("created_at", { ascending: false }).limit(100)
  if (status) query = query.eq("status", status)
  const { data } = await query
  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Support</h1>
      <form className="flex gap-2">
        <select name="status" defaultValue={status ?? ""} className="h-11 rounded-lg border border-input px-3">
          <option value="">All statuses</option>
          {["OPEN", "IN_PROGRESS", "WAITING_FOR_STUDENT", "RESOLVED", "CLOSED"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground" type="submit">Filter</button>
      </form>
      <div className="grid gap-2">
        {(data ?? []).map((ticket) => (
          <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="rounded-xl border border-border bg-card p-4 text-sm">
            <span className="font-medium">{ticket.ticket_number} · {ticket.subject}</span>
            <span className="mt-1 block text-muted-foreground">{ticket.category} · {ticket.priority} · {ticket.status} · {formatDate(ticket.created_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
