import { saveTopicAction } from "@/lib/actions/admin"
import { BoundForm } from "@/components/bound-form"
import { controlClass, SubmitButton } from "@/components/form-bits"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function TopicsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: topics } = await supabase.from("topics").select("id, name, exam, description, is_active").order("name")
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="font-heading text-3xl">Topics</h1>
        <p className="mt-1 text-sm text-muted-foreground">These are content categories, not an official exam weightage.</p>
        <div className="mt-4 grid gap-2">
          {(topics ?? []).map((topic) => (
            <article key={topic.id} className="rounded-xl border border-border bg-card p-3 text-sm">
              <p className="font-medium">{topic.name}</p>
              <p className="text-muted-foreground">{topic.exam} · {topic.is_active ? "Active" : "Hidden"}</p>
            </article>
          ))}
        </div>
      </div>
      <BoundForm action={saveTopicAction}>
        <h2 className="font-medium">Add topic</h2>
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="exam">Exam</Label>
          <select id="exam" name="exam" className={controlClass} defaultValue="BOTH">
            <option>STET</option>
            <option>BPSC</option>
            <option>BOTH</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" className="h-11" />
        </div>
        <SubmitButton>Save topic</SubmitButton>
      </BoundForm>
    </div>
  )
}
