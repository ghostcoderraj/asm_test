import { notFound } from "next/navigation"
import { startTestAction } from "@/lib/actions/student"
import { StartForm } from "@/components/test/start-form"
import { requireUser } from "@/lib/auth"
import { examLabel } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validators"

export default async function TestDetailPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params
  if (!isUuid(testId)) notFound()
  await requireUser()
  const supabase = await createClient()
  const { data: test } = await supabase
    .from("tests")
    .select("id, title, description, exam, duration_minutes, total_questions, is_free, selection_mode")
    .eq("id", testId)
    .eq("status", "PUBLISHED")
    .maybeSingle()
  if (!test) notFound()
  const { data: free } = await supabase.rpc("free_mock_status")
  const status = free as { premium?: boolean; remaining?: number; limit?: number } | null

  return (
    <article className="mx-auto grid w-full max-w-2xl gap-4">
      <p className="text-sm text-muted-foreground">{examLabel(test.exam)}</p>
      <h1 className="font-heading text-3xl">{test.title}</h1>
      {test.description ? <p>{test.description}</p> : null}
      <ul className="grid gap-1 text-sm text-muted-foreground">
        <li>{test.total_questions} questions</li>
        <li>{test.duration_minutes} minutes</li>
        <li>{test.is_free ? "Free mock test" : "Premium mock test"}</li>
        <li>{test.selection_mode === "RANDOM" ? "Questions are chosen when you start and stay fixed for that attempt." : "This test uses a fixed question paper."}</li>
      </ul>
      {test.is_free && status && !status.premium ? (
        <p className="text-sm">Free tests remaining: {status.remaining} of {status.limit}</p>
      ) : null}
      <StartForm action={startTestAction} hidden={{ testId: test.id }} label="Start test" />
    </article>
  )
}
