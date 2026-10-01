import { notFound } from "next/navigation"
import { AttachmentUpload } from "@/components/support/attachment-upload"
import { TicketThread } from "@/components/support/ticket-thread"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validators"

export default async function TicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params
  if (!isUuid(ticketId)) notFound()
  const profile = await requireUser()
  const supabase = await createClient()
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, description, status, category, created_at")
    .eq("id", ticketId)
    .eq("user_id", profile.id)
    .maybeSingle()
  if (!ticket) notFound()
  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, sender_id, message, is_internal, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at")

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <div>
        <p className="text-sm text-muted-foreground">{ticket.ticket_number} · {ticket.status}</p>
        <h1 className="font-heading text-3xl">{ticket.subject}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm">{ticket.description}</p>
        <AttachmentUpload ticketId={ticket.id} />
      </div>
      <TicketThread ticketId={ticket.id} initial={messages ?? []} />
    </div>
  )
}
