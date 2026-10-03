import Link from "next/link"
import { notFound } from "next/navigation"
import { PracticeStart } from "@/components/practice/start-panel"
import { requireUser } from "@/lib/auth"
import { practicePaper } from "@/lib/exam/papers"
import { createClient } from "@/lib/supabase/server"
import type { PracticeTopic } from "@/types/practice"

export default async function PracticeSubtopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicSlug: string; subtopicSlug: string }>
  searchParams: Promise<{ paper?: string }>
}) {
  await requireUser()
  const { topicSlug, subtopicSlug } = await params
  const query = await searchParams
  const paper = practicePaper(query.paper)
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("practice_topic", { p_slug: topicSlug, p_exam: "STET", p_paper: paper })
  if (error) {
    return <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">Questions could not be loaded. Please try again.</p>
  }
  if (!data) notFound()
  const topic = data as PracticeTopic
  const subtopic = topic.subtopics.find((item) => item.slug === subtopicSlug)
  if (!subtopic) notFound()

  return (
    <div className="grid max-w-xl gap-4">
      <div>
        <Link href={`/dashboard/practice/${topic.slug}?paper=${paper}`} className="text-sm text-muted-foreground">{topic.name}</Link>
        <h1 className="mt-2 font-heading text-3xl">{subtopic.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          PYQ {subtopic.pyq_count} · PYQ-based {subtopic.pyq_based_count} · Practice {subtopic.practice_count}
        </p>
        {subtopic.total_count === 0 ? <p className="mt-2 text-sm text-muted-foreground">No questions are available for this subtopic yet.</p> : null}
      </div>
      <PracticeStart
        label="Start practice"
        mode="SUBTOPIC"
        exam="STET"
        paper={paper}
        topicId={topic.id}
        subtopicId={subtopic.id}
        showType
        emptyMessage="No questions are available for this subtopic yet."
      />
    </div>
  )
}
