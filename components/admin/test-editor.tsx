import { saveTestAction } from "@/lib/actions/admin"
import { QuestionPicker } from "@/components/admin/question-picker"
import { BoundForm } from "@/components/bound-form"
import { controlClass, SubmitButton } from "@/components/form-bits"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type TestValues = {
  id?: string
  title?: string
  description?: string | null
  exam?: string
  paper?: string
  duration_minutes?: number
  total_questions?: number
  is_free?: boolean
  status?: string
  selection_mode?: string
}

export function TestEditor({ test, questions = [] }: { test?: TestValues; questions?: { id: string; question_text: string }[] }) {
  return (
    <BoundForm action={saveTestAction}>
      {test?.id ? <input type="hidden" name="id" value={test.id} /> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={test?.title} className="h-11" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={test?.description ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select name="exam" label="Exam" defaultValue={test?.exam ?? "BOTH"} options={["STET", "BPSC", "BOTH"]} />
        <div className="grid gap-1.5">
          <Label htmlFor="paper">STET paper</Label>
          <select id="paper" name="paper" className={controlClass} defaultValue={test?.paper ?? "BOTH"}>
            <option value="PAPER_I">Paper I</option>
            <option value="PAPER_II">Paper II</option>
            <option value="BOTH">Both papers</option>
          </select>
        </div>
        <Select name="status" label="Status" defaultValue={test?.status ?? "DRAFT"} options={["DRAFT", "PUBLISHED", "ARCHIVED"]} />
        <Select name="selection_mode" label="Questions" defaultValue={test?.selection_mode ?? "FIXED"} options={["FIXED", "RANDOM"]} />
        <NumberField name="duration_minutes" label="Duration in minutes" defaultValue={test?.duration_minutes ?? 120} />
        <NumberField name="total_questions" label="Number of questions" defaultValue={test?.total_questions ?? 100} />
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="is_free" defaultChecked={test?.is_free ?? false} />
        Free test
      </label>
      <div>
        <h2 className="font-medium">Fixed question paper</h2>
        <p className="mb-2 text-sm text-muted-foreground">Used when the mode is FIXED. Random tests draw a fresh set when a student starts, then keep that set for the attempt.</p>
        <QuestionPicker exam={test?.exam ?? "BOTH"} initial={questions} />
      </div>
      <SubmitButton>Save test</SubmitButton>
    </BoundForm>
  )
}

function NumberField({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" min={1} defaultValue={defaultValue} className="h-11" />
    </div>
  )
}

function Select({ name, label, defaultValue, options }: { name: string; label: string; defaultValue: string; options: string[] }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} className={controlClass} defaultValue={defaultValue}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  )
}
