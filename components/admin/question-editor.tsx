import { saveQuestionAction } from "@/lib/actions/admin"
import { BoundForm } from "@/components/bound-form"
import { controlClass, SubmitButton } from "@/components/form-bits"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

type QuestionValues = {
  id?: string
  question_text?: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct_option?: string
  explanation?: string | null
  exam?: string
  topic_id?: string
  subtopic?: string | null
  difficulty?: string
  source?: string | null
  year?: number | null
  paper?: string | null
  question_type?: string | null
  status?: string
}

export async function QuestionEditor({ question }: { question?: QuestionValues }) {
  await requireAdmin()
  const supabase = await createClient()
  const { data: topics } = await supabase.from("topics").select("id, name").order("name")
  return (
    <BoundForm action={saveQuestionAction}>
      {question?.id ? <input type="hidden" name="id" value={question.id} /> : null}
      <Field label="Question" name="question_text" defaultValue={question?.question_text} area />
      <Field label="Option A" name="option_a" defaultValue={question?.option_a} />
      <Field label="Option B" name="option_b" defaultValue={question?.option_b} />
      <Field label="Option C" name="option_c" defaultValue={question?.option_c} />
      <Field label="Option D" name="option_d" defaultValue={question?.option_d} />
      <Select label="Correct option" name="correct_option" defaultValue={question?.correct_option ?? "A"} options={["A", "B", "C", "D"]} />
      <Field label="Explanation" name="explanation" defaultValue={question?.explanation ?? ""} area />
      <Select label="Exam" name="exam" defaultValue={question?.exam ?? "BOTH"} options={["STET", "BPSC", "BOTH"]} />
      <Select label="Paper" name="paper" defaultValue={question?.paper ?? "BOTH"} options={["PAPER_I", "PAPER_II", "BOTH"]} />
      <Select label="Question type" name="question_type" defaultValue={question?.question_type ?? "PRACTICE"} options={["PRACTICE", "PYQ_BASED", "PREVIOUS_YEAR"]} />
      <div className="grid gap-1.5">
        <Label htmlFor="topic_id">Topic</Label>
        <select id="topic_id" name="topic_id" className={controlClass} defaultValue={question?.topic_id ?? ""} required>
          <option value="">Choose a topic</option>
          {(topics ?? []).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
        </select>
      </div>
      <Field label="Subtopic" name="subtopic" defaultValue={question?.subtopic ?? ""} />
      <Select label="Difficulty" name="difficulty" defaultValue={question?.difficulty ?? "MEDIUM"} options={["EASY", "MEDIUM", "HARD"]} />
      <Field label="Source" name="source" defaultValue={question?.source ?? ""} />
      <Field label="Year" name="year" defaultValue={question?.year ? String(question.year) : ""} />
      <Select label="Status" name="status" defaultValue={question?.status ?? "DRAFT"} options={["DRAFT", "PUBLISHED", "ARCHIVED"]} />
      <SubmitButton>Save question</SubmitButton>
    </BoundForm>
  )
}

function Field({ label, name, defaultValue = "", area = false }: { label: string; name: string; defaultValue?: string; area?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {area ? <Textarea id={name} name={name} defaultValue={defaultValue} /> : <Input id={name} name={name} defaultValue={defaultValue} className="h-11 text-base" />}
    </div>
  )
}

function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: string[] }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} className={controlClass} defaultValue={defaultValue}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  )
}
