"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import { replyTicketAction } from "@/lib/actions/student"
import { createClient } from "@/lib/supabase/client"
import { SubmitButton } from "@/components/form-bits"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime } from "@/lib/format"

type Message = {
  id: string
  sender_id: string
  message: string
  is_internal: boolean
  created_at: string
}

export function TicketThread({
  ticketId,
  initial,
  staff = false,
}: {
  ticketId: string
  initial: Message[]
  staff?: boolean
}) {
  const [messages, setMessages] = useState(initial)
  const [state, action] = useActionState(replyTicketAction, null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          const row = payload.new as Message
          setMessages((current) => (current.some((item) => item.id === row.id) ? current : [...current, row]))
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [ticketId])

  return (
    <div className="grid gap-4">
      <ol className="grid gap-3">
        {messages.map((message) => (
          <li key={message.id} className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">
              {formatDateTime(message.created_at)}
              {message.is_internal ? " · Internal note" : ""}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{message.message}</p>
          </li>
        ))}
      </ol>
      <form action={action} className="grid gap-2">
        <input type="hidden" name="ticketId" value={ticketId} />
        <Textarea name="message" required placeholder="Write a reply" />
        {staff ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="internal" />
            Internal note, hidden from the student
          </label>
        ) : null}
        {state ? <p className="text-sm">{state.message}</p> : null}
        <SubmitButton>Send</SubmitButton>
      </form>
    </div>
  )
}
