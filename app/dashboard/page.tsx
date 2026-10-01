import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { startTopicPracticeAction, startWeakPracticeAction } from "@/lib/actions/student"
import { StartForm } from "@/components/test/start-form"
import { createClient } from "@/lib/supabase/server"
import { targetSummary } from "@/lib/exam/papers"
import { examLabel, formatDate, formatDuration } from "@/lib/format"
import { shouldRevise, type WeaknessBand } from "@/lib/exam/weakness"
import type { StudentDashboard } from "@/types/domain"

export default async function DashboardPage() {
  const profile = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase.rpc("student_dashboard")
  const dash = (data ?? null) as StudentDashboard | null
  const weak = dash?.weak_topics.filter((topic) => shouldRevise((topic.band ?? "STRONG") as WeaknessBand)) ?? []

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">Welcome {profile.full_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Target: {targetSummary(profile.target_exam, profile.target_paper)}</p>
      </div>
      {!dash ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm">The dashboard will appear after the Supabase migration has been applied.</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Tests attempted" value={dash.stats.tests_attempted} />
            <Stat label="Average score" value={`${dash.stats.average_score}%`} />
            <Stat label="Average accuracy" value={`${dash.stats.average_accuracy}%`} />
            <Stat label="Questions attempted" value={dash.stats.questions_attempted} />
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-medium">Free tests</h2>
              <p className="mt-2 font-heading text-3xl">{dash.free.limit} free tests</p>
              <p className="text-sm text-muted-foreground">
                Used: {dash.free.used} · Remaining: {dash.free.premium ? "Included with premium" : dash.free.remaining}
              </p>
              {dash.free.remaining === 0 && !dash.free.premium ? (
                <div className="mt-3 text-sm">
                  <p>Your {dash.free.limit} free mock tests are completed.</p>
                  <p>Unlock the complete STET & BPSC Music Test Series.</p>
                  <Link href="/dashboard/premium" className="mt-2 inline-flex min-h-11 items-center font-medium text-primary underline">
                    Unlock Premium
                  </Link>
                </div>
              ) : null}
            </article>
            <article className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-medium">Premium</h2>
              <p className="mt-2 text-lg">{dash.free.premium ? "Active" : "Not active"}</p>
              <p className="text-sm text-muted-foreground">Expiry date: {formatDate(dash.subscription?.expiry_date)}</p>
            </article>
          </section>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-medium">Weak topics</h2>
            <div className="mt-3 grid gap-3">
              {weak.length === 0 ? <p className="text-sm text-muted-foreground">Complete a test to see topics that need revision.</p> : null}
              {weak.map((topic) => (
                <div key={topic.topic_id} className="rounded-lg bg-muted p-3">
                  <p className="font-medium">{topic.topic_name}</p>
                  <p className="text-sm">{topic.wrong} wrong out of {topic.attempted}</p>
                  <p className="text-sm">Accuracy: {topic.accuracy}%</p>
                  <p className="text-sm">You should revise this topic.</p>
                  <div className="mt-2 max-w-sm">
                    <StartForm action={startTopicPracticeAction} hidden={{ topicId: topic.topic_id }} label={`Practice ${topic.topic_name}`} />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-medium">Recommended practice</h2>
            <p className="mt-1 text-sm text-muted-foreground">Twenty questions from weak topics, skipping questions attempted in the last 30 days when possible.</p>
            <div className="mt-3 max-w-xs">
              <StartForm action={startWeakPracticeAction} label="Practice my weak topics" />
            </div>
          </section>
          <section>
            <h2 className="font-medium">Recent tests</h2>
            <div className="mt-3 grid gap-2">
              {dash.recent_attempts.length === 0 ? <p className="text-sm text-muted-foreground">No attempts yet.</p> : null}
              {dash.recent_attempts.map((attempt) => (
                <Link key={attempt.id} href={attempt.status === "IN_PROGRESS" ? `/dashboard/attempt/${attempt.id}` : `/dashboard/results/${attempt.id}`} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <span className="font-medium">{attempt.title}</span>
                  <span className="mt-1 block text-muted-foreground">
                    {examLabel(attempt.exam)} · {formatDate(attempt.submitted_at ?? attempt.created_at)} · {attempt.status === "IN_PROGRESS" ? "In progress" : `${attempt.score}/${attempt.percentage}%`} · {formatDuration(attempt.time_taken)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string | number; value: string | number }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-3xl">{value}</p>
    </article>
  )
}
