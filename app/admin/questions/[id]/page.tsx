import { notFound } from "next/navigation"
import { QuestionEditor } from "@/components/admin/question-editor"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validators"

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from("questions").select("*").eq("id", id).maybeSingle()
  if (!data) notFound()
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <h1 className="font-heading text-3xl">Edit question</h1>
      <QuestionEditor question={data} />
    </div>
  )
}
