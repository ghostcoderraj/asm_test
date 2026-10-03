import Link from "next/link"
import { setQuestionStatusAction } from "@/lib/actions/admin"
import { PublishDrafts } from "@/components/admin/publish-drafts"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/format"

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ q?: string; exam?: string; topic?: string; difficulty?: string; status?: string; page?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? "1") || 1)
  const size = 20
  const from = (page - 1) * size
  const supabase = await createClient()
  let query = supabase.from("questions").select("id, question_text, exam, difficulty, status, created_at, topics(name)", { count: "exact" }).order("created_at", { ascending: false }).range(from, from + size - 1)
  if (params.q) query = query.ilike("question_text", `%${params.q}%`)
  if (params.exam) query = query.eq("exam", params.exam)
  if (params.topic) query = query.eq("topic_id", params.topic)
  if (params.difficulty) query = query.eq("difficulty", params.difficulty)
  if (params.status) query = query.eq("status", params.status)
  const [{ data, count }, { data: topics }] = await Promise.all([query, supabase.from("topics").select("id, name").order("name")])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">Questions</h1>
        <Link href="/admin/questions/new" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground">New question</Link>
      </div>
      <form className="grid gap-2 sm:grid-cols-5">
        <input name="q" defaultValue={params.q} placeholder="Search" aria-label="Search questions" className="h-11 rounded-lg border border-input px-3" />
        <select name="exam" defaultValue={params.exam ?? ""} className="h-11 rounded-lg border border-input px-3">
          <option value="">Exam</option>
          <option>STET</option>
          <option>BPSC</option>
          <option>BOTH</option>
        </select>
        <select name="topic" defaultValue={params.topic ?? ""} className="h-11 rounded-lg border border-input px-3">
          <option value="">Topic</option>
          {(topics ?? []).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
        </select>
        <select name="difficulty" defaultValue={params.difficulty ?? ""} className="h-11 rounded-lg border border-input px-3">
          <option value="">Difficulty</option>
          <option>EASY</option>
          <option>MEDIUM</option>
          <option>HARD</option>
        </select>
        <select name="status" defaultValue={params.status ?? ""} className="h-11 rounded-lg border border-input px-3">
          <option value="">Status</option>
          <option>DRAFT</option>
          <option>PUBLISHED</option>
          <option>ARCHIVED</option>
        </select>
        <button className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground sm:col-span-5" type="submit">Filter</button>
      </form>
      <PublishDrafts topicId={params.topic} label={params.topic ? "Publish drafts for this topic" : "Publish all draft questions"} />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3">Question</th>
              <th className="p-3">Exam</th>
              <th className="p-3">Topic</th>
              <th className="p-3">Difficulty</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((question) => {
              const topic = question.topics as { name?: string } | { name?: string }[] | null
              const topicName = Array.isArray(topic) ? topic[0]?.name : topic?.name
              return (
                <tr key={question.id} className="border-t border-border align-top">
                  <td className="max-w-sm p-3 break-words">{question.question_text}</td>
                  <td className="p-3">{question.exam}</td>
                  <td className="p-3">{topicName}</td>
                  <td className="p-3">{question.difficulty}</td>
                  <td className="p-3">{question.status}</td>
                  <td className="p-3">{formatDate(question.created_at)}</td>
                  <td className="p-3">
                    <Link href={`/admin/questions/${question.id}`} className="underline">Edit</Link>
                    <form action={setQuestionStatusAction} className="mt-2">
                      <input type="hidden" name="id" value={question.id} />
                      <input type="hidden" name="status" value={question.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED"} />
                      <button type="submit" className="text-primary underline">{question.status === "PUBLISHED" ? "Archive" : "Publish"}</button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {(data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No questions match these filters.</p> : null}
      <p className="text-sm text-muted-foreground">Page {page} · {count ?? 0} questions</p>
      <div className="flex gap-3 text-sm">
        {page > 1 ? <Link href={pageHref(params, page - 1)} className="inline-flex min-h-11 items-center underline">Previous</Link> : null}
        {(count ?? 0) > page * size ? <Link href={pageHref(params, page + 1)} className="inline-flex min-h-11 items-center underline">Next</Link> : null}
      </div>
    </div>
  )
}

function pageHref(params: { q?: string; exam?: string; topic?: string; difficulty?: string; status?: string }, page: number) {
  const search = new URLSearchParams()
  for (const key of ["q", "exam", "topic", "difficulty", "status"] as const) {
    const value = params[key]
    if (value) search.set(key, value)
  }
  search.set("page", String(page))
  return `?${search.toString()}`
}
