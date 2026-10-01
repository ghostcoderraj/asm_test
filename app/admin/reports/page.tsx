import { updateReportAction } from "@/lib/actions/admin"
import { requireAdmin } from "@/lib/auth"
import { formatDate } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export default async function ReportsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from("question_reports").select("id, reason, description, status, created_at, questions(question_text)").order("created_at", { ascending: false }).limit(100)
  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Question reports</h1>
      <div className="grid gap-3">
        {(data ?? []).map((report) => {
          const question = report.questions as { question_text?: string } | { question_text?: string }[] | null
          const text = Array.isArray(question) ? question[0]?.question_text : question?.question_text
          return (
            <article key={report.id} className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">{report.reason} · {report.status}</p>
              <p className="mt-1">{text}</p>
              {report.description ? <p className="mt-1 text-muted-foreground">{report.description}</p> : null}
              <p className="mt-1 text-muted-foreground">{formatDate(report.created_at)}</p>
              <form action={updateReportAction} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={report.id} />
                <select name="status" defaultValue={report.status} className="h-11 rounded-lg border border-input px-3">
                  {["OPEN", "REVIEWING", "RESOLVED", "REJECTED"].map((item) => <option key={item}>{item}</option>)}
                </select>
                <button className="min-h-11 rounded-lg bg-primary px-3 text-primary-foreground" type="submit">Save</button>
              </form>
            </article>
          )
        })}
      </div>
    </div>
  )
}
