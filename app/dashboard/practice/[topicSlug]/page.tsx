import Link from "next/link"
import { notFound } from "next/navigation"
import { PracticeStart } from "@/components/practice/start-panel"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { PracticeTopic } from "@/types/practice"

export default async function PracticeTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicSlug: string }>
  searchParams: Promise<{ paper?: string }>
}) {
  await requireUser()
  const { topicSlug } = await params
  const query = await searchParams
  const paper = query.paper === "PAPER_II" ? "PAPER_II" : "PAPER_I"
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("practice_topic", { p_slug: topicSlug, p_exam: "STET", p_paper: paper })
  if (error) {
    return <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">Questions could not be loaded. Please try again.</p>
  }
  if (!data) notFound()
  const topic = data as PracticeTopic

  return (
    <div className="grid gap-6">
      <div>
        <Link href={`/dashboard/practice?exam=STET&paper=${paper}`} className="text-sm text-muted-foreground">STET Music Practice</Link>
        <h1 className="mt-2 font-heading text-3xl">{topic.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Topics and subtopics are arranged for study. They are not an official exam weightage.</p>
        <p className="mt-2 text-sm text-muted-foreground">{topic.total_count > 0 ? `${topic.total_count} questions` : "No questions are available for this topic yet."}</p>
      </div>
      <div className="max-w-sm">
        <PracticeStart label="Practice this topic" mode="TOPIC" exam="STET" paper={paper} topicId={topic.id} showType emptyMessage="No questions are available for this topic yet." />
      </div>
      <section className="grid gap-3">
        {topic.subtopics.map((subtopic) => (
          <article key={subtopic.id} className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-medium">{subtopic.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PYQ {subtopic.pyq_count} · PYQ-based {subtopic.pyq_based_count} · Practice {subtopic.practice_count}
            </p>
            {subtopic.total_count === 0 ? <p className="mt-1 text-sm text-muted-foreground">No questions are available for this subtopic yet.</p> : null}
          </article>
        ))}
      </section>
    </div>
  )
}
