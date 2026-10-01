import { markNotificationReadAction } from "@/lib/actions/student"
import { requireUser } from "@/lib/auth"
import { formatDateTime } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export default async function NotificationsPage() {
  const profile = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase.from("notifications").select("id, title, message, type, is_read, created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(50)

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">Notifications</h1>
        <form action={markNotificationReadAction}>
          <input type="hidden" name="id" value="all" />
          <button type="submit" className="min-h-11 rounded-lg border border-border px-3 text-sm">Mark all read</button>
        </form>
      </div>
      <div className="grid gap-2">
        {(data ?? []).map((item) => (
          <article key={item.id} className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-medium">{item.title}</p>
            <p className="mt-1">{item.message}</p>
            <p className="mt-1 text-muted-foreground">{formatDateTime(item.created_at)} · {item.is_read ? "Read" : "Unread"}</p>
          </article>
        ))}
        {(data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p> : null}
      </div>
    </div>
  )
}
