"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function AttachmentUpload({ ticketId }: { ticketId: string }) {
  const [message, setMessage] = useState<string | null>(null)

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5_000_000) {
      setMessage("Keep the file under 5 MB.")
      return
    }
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const safeName = file.name.replace(/[^\w.]+/g, "_")
    const path = `${user.id}/${ticketId}/${crypto.randomUUID()}-${safeName}`
    const uploaded = await supabase.storage.from("support-attachments").upload(path, file)
    if (uploaded.error) {
      setMessage("The file could not be uploaded.")
      return
    }
    const saved = await supabase.rpc("attach_support_file", { p_ticket_id: ticketId, p_path: path })
    setMessage(saved.error ? "The file uploaded, but it could not be linked to the ticket." : "Screenshot attached.")
  }

  return (
    <label className="grid gap-1 text-sm">
      Optional screenshot
      <input className="min-h-11" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => void onChange(event)} />
      {message ? <span>{message}</span> : null}
    </label>
  )
}
