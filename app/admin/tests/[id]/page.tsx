import { notFound } from "next/navigation"
import { TestEditor } from "@/components/admin/test-editor"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validators"

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  await requireAdmin()
  const supabase = await createClient()
  const { data: test } = await supabase.from("tests").select("*").eq("id", id).maybeSingle()
  if (!test) notFound()
  const { data: links } = await supabase.from("test_questions").select("question_order, questions(id, question_text)").eq("test_id", id).order("question_order")
  const questions = (links ?? []).map((link) => {
    const question = link.questions as { id: string; question_text: string } | { id: string; question_text: string }[] | null
    return Array.isArray(question) ? question[0] : question
  }).filter((question): question is { id: string; question_text: string } => Boolean(question))

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <h1 className="font-heading text-3xl">Edit test</h1>
      <TestEditor test={test} questions={questions} />
    </div>
  )
}
