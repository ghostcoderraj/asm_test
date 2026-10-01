import Link from "next/link"
import { notFound } from "next/navigation"
import { ReportDialog } from "@/components/test/report-dialog"
import { requireUser } from "@/lib/auth"
import { examLabel, formatDuration } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validators"
import type { Paper, TopicStat } from "@/types/domain"

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params
  if (!isUuid(attemptId)) notFound()
  await requireUser()
  const supabase = await createClient()
  const paperResult = await supabase.rpc("get_attempt_paper", { p_attempt_id: attemptId })
  if (paperResult.error || !paperResult.data) notFound()
  const paper = paperResult.data as Paper
  if (paper.attempt.status === "IN_PROGRESS") notFound()
  const topics = await supabase.rpc("attempt_topic_analytics", { p_attempt_id: attemptId })
  const rows = (topics.data ?? []) as TopicStat[]
  const attempt = paper.attempt

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{examLabel(attempt.exam)} · {attempt.status === "AUTO_SUBMITTED" ? "Auto submitted" : "Submitted"}</p>
        <h1 className="font-heading text-3xl">{attempt.title}</h1>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Score" value={`${attempt.score}/${attempt.total_questions}`} />
        <Card label="Percentage" value={`${attempt.percentage}%`} />
        <Card label="Correct" value={attempt.correct_answers ?? 0} />
        <Card label="Wrong" value={attempt.wrong_answers ?? 0} />
        <Card label="Unanswered" value={attempt.unanswered ?? 0} />
        <Card label="Accuracy" value={`${attempt.accuracy}%`} />
        <Card label="Time taken" value={formatDuration(attempt.time_taken)} />
      </section>
      <section>
        <h2 className="font-medium">Topic analytics</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 font-medium">Topic</th>
                <th className="p-3 font-medium">Attempted</th>
                <th className="p-3 font-medium">Correct</th>
                <th className="p-3 font-medium">Wrong</th>
                <th className="p-3 font-medium">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.topic_id} className="border-t border-border">
                  <td className="p-3">{row.topic_name}</td>
                  <td className="p-3">{row.attempted}</td>
                  <td className="p-3">{row.correct}</td>
                  <td className="p-3">{row.wrong}</td>
                  <td className="p-3">{row.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="font-medium">Review</h2>
        {paper.questions.map((question, index) => (
          <article key={question.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{question.topic_name} · Question {index + 1}</p>
            <h3 className="mt-1 font-medium">{question.question_text}</h3>
            <ul className="mt-3 grid gap-1 text-sm">
              {(["A", "B", "C", "D"] as const).map((key) => {
                const text = question[`option_${key.toLowerCase()}` as "option_a"]
                const chosen = question.selected_answer === key
                const right = question.correct_option === key
                return (
                  <li key={key} className={right ? "text-primary" : chosen ? "text-destructive" : ""}>
                    {key}. {text} {right ? "· Correct" : ""} {chosen ? "· Your answer" : ""}
                  </li>
                )
              })}
            </ul>
            {question.explanation ? <p className="mt-3 text-sm text-muted-foreground">{question.explanation}</p> : null}
            <ReportDialog questionId={question.id} attemptId={attempt.id} />
          </article>
        ))}
      </section>
      <Link href="/dashboard/history" className="text-sm text-primary underline">Back to history</Link>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl">{value}</p>
    </article>
  )
}
