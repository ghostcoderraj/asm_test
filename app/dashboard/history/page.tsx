import Link from "next/link"
import { startTestAction } from "@/lib/actions/student"
import { StartForm } from "@/components/test/start-form"
import { requireUser } from "@/lib/auth"
import { examLabel, formatDate, formatDuration } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

type Row = {
  id: string
  status: string
  score: number | null
  percentage: number | null
  correct_answers: number | null
  wrong_answers: number | null
  time_taken: number | null
  submitted_at: string | null
  created_at: string
  practice_title: string | null
  test_id: string | null
  tests: { title: string; exam: string } | null
}

export default async function HistoryPage() {
  const profile = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from("test_attempts")
    .select("id, status, score, percentage, correct_answers, wrong_answers, time_taken, submitted_at, created_at, practice_title, test_id, tests(title, exam)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
  const rows = (data ?? []) as unknown as Row[]

  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Test history</h1>
      <p className="text-sm text-muted-foreground">Every attempt is stored separately. A reattempt creates a new record.</p>
      <div className="grid gap-3">
        {rows.map((row) => {
          const title = row.tests?.title ?? row.practice_title ?? "Practice"
          const exam = row.tests?.exam ?? "BOTH"
          const done = row.status !== "IN_PROGRESS"
          return (
            <article key={row.id} className="rounded-xl border border-border bg-card p-4 text-sm">
              <h2 className="font-medium">{title}</h2>
              <p className="mt-1 text-muted-foreground">
                {examLabel(exam)} · {formatDate(row.submitted_at ?? row.created_at)} · Score {done ? row.score : "—"} · {done ? `${row.percentage}%` : row.status} · Correct {row.correct_answers ?? "—"} · Wrong {row.wrong_answers ?? "—"} · {formatDuration(row.time_taken)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {done ? (
                  <Link href={`/dashboard/results/${row.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-3">
                    View result
                  </Link>
                ) : (
                  <Link href={`/dashboard/attempt/${row.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-3">
                    Resume
                  </Link>
                )}
                {row.test_id ? <StartForm action={startTestAction} hidden={{ testId: row.test_id }} label="Reattempt" /> : null}
              </div>
            </article>
          )
        })}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No attempts yet.</p> : null}
      </div>
    </div>
  )
}
