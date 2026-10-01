import { createTicketAction } from "@/lib/actions/student"
import { BoundForm } from "@/components/bound-form"
import { controlClass, SubmitButton } from "@/components/form-bits"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { requireUser } from "@/lib/auth"

const categories = [
  ["LOGIN", "Login issue"],
  ["PAYMENT", "Payment issue"],
  ["TEST", "Test issue"],
  ["QUESTION", "Question issue"],
  ["RESULT", "Result issue"],
  ["TECHNICAL", "Technical problem"],
  ["PREMIUM", "Premium access"],
  ["OTHER", "Other"],
]

export default async function NewTicketPage() {
  await requireUser()
  return (
    <div className="mx-auto grid w-full max-w-xl gap-4">
      <h1 className="font-heading text-3xl">Raise a query</h1>
      <BoundForm action={createTicketAction}>
        <div className="grid gap-1.5">
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" className={controlClass} defaultValue="OTHER">
            {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select id="priority" name="priority" className={controlClass} defaultValue="MEDIUM">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" required className="h-11 text-base" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="testId">Test ID, optional</Label>
          <Input id="testId" name="testId" className="h-11 text-base" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="questionId">Question ID, optional</Label>
          <Input id="questionId" name="questionId" className="h-11 text-base" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="paymentId">Payment ID, optional</Label>
          <Input id="paymentId" name="paymentId" className="h-11 text-base" />
        </div>
        <SubmitButton>Submit query</SubmitButton>
      </BoundForm>
    </div>
  )
}
