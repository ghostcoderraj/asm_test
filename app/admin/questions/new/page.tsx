import { QuestionEditor } from "@/components/admin/question-editor"

export default function NewQuestionPage() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <h1 className="font-heading text-3xl">New question</h1>
      <QuestionEditor />
    </div>
  )
}
