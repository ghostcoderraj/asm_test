import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { paperLabel, testMatchesTarget } from "@/lib/exam/papers"
import { createClient } from "@/lib/supabase/server"
import { examLabel } from "@/lib/format"

export default async function TestsPage() {
  const profile = await requireUser()
  const supabase = await createClient()
  const withPaper = await supabase
    .from("tests")
    .select("id, title, description, exam, paper, duration_minutes, total_questions, is_free")
    .eq("status", "PUBLISHED")
    .order("title")
  const data = withPaper.error?.message?.toLowerCase().includes("paper")
    ? (
        await supabase
          .from("tests")
          .select("id, title, description, exam, duration_minutes, total_questions, is_free")
          .eq("status", "PUBLISHED")
          .order("title")
      ).data?.map((test) => ({ ...test, paper: "BOTH" }))
    : withPaper.data
  const tests = (data ?? []).filter((test) => test.exam !== "BPSC" && (profile.role !== "STUDENT" || testMatchesTarget(profile, test)))

  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Mock tests</h1>
      {profile.target_exam === "BPSC" ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">BPSC Music mock tests are coming soon. The current series is STET Music.</p>
      ) : null}
      {profile.target_exam === "BOTH" ? (
        <p className="text-sm text-muted-foreground">BPSC mock tests are coming soon. These are your STET mock tests.</p>
      ) : null}
      <div className="grid gap-3">
        {(tests ?? []).map((test) => (
          <article key={test.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium">{test.title}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{test.is_free ? "Free" : "Premium"}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {examLabel(test.exam)}
              {test.exam === "BPSC" ? "" : ` · ${paperLabel(test.paper) || "Paper I & II"}`}
              {" · "}
              {test.total_questions} questions · {test.duration_minutes} minutes
            </p>
            {test.description ? <p className="mt-2 text-sm">{test.description}</p> : null}
            <Link href={`/dashboard/tests/${test.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
              Open test
            </Link>
          </article>
        ))}
        {(tests ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No published tests for your target exam yet.</p> : null}
      </div>
    </div>
  )
}
