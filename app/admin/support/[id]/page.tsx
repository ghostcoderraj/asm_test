import { notFound } from "next/navigation"
import { updateTicketAction } from "@/lib/actions/student"
import { BoundForm } from "@/components/bound-form"
import { controlClass, SubmitButton } from "@/components/form-bits"
import { TicketThread } from "@/components/support/ticket-thread"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validators"

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  await requireAdmin()
  const supabase = await createClient()
  const { data: ticket } = await supabase.from("support_tickets").select("id, ticket_number, subject, description, status, priority, category, attachment_path").eq("id", id).maybeSingle()
  if (!ticket) notFound()
  const { data: messages } = await supabase.from("support_messages").select("id, sender_id, message, is_internal, created_at").eq("ticket_id", id).order("created_at")

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <div>
        <p className="text-sm text-muted-foreground">{ticket.ticket_number} · {ticket.category}</p>
        <h1 className="font-heading text-3xl">{ticket.subject}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm">{ticket.description}</p>
        {ticket.attachment_path ? <p className="mt-2 text-xs text-muted-foreground">Attachment path: {ticket.attachment_path}</p> : null}
      </div>
      <BoundForm action={updateTicketAction} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <select name="status" defaultValue={ticket.status} className={controlClass}>
          {["OPEN", "IN_PROGRESS", "WAITING_FOR_STUDENT", "RESOLVED", "CLOSED"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select name="priority" defaultValue={ticket.priority} className={controlClass}>
          {["LOW", "MEDIUM", "HIGH"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <SubmitButton>Update ticket</SubmitButton>
      </BoundForm>
      <TicketThread ticketId={ticket.id} initial={messages ?? []} staff />
    </div>
  )
}
