import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function TestsAdminPage() {
  await requireAdmin()
  const supabase = await createClient()
  const withPaper = await supabase.from("tests").select("id, title, exam, paper, duration_minutes, total_questions, is_free, status, selection_mode").order("created_at", { ascending: false })
  const data = withPaper.error?.message?.toLowerCase().includes("paper")
    ? (await supabase.from("tests").select("id, title, exam, duration_minutes, total_questions, is_free, status, selection_mode").order("created_at", { ascending: false })).data?.map((test) => ({ ...test, paper: "BOTH" }))
    : withPaper.data
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">Tests</h1>
        <Link href="/admin/tests/new" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground">Create test</Link>
      </div>
      <div className="grid gap-2">
        {(data ?? []).map((test) => (
          <Link key={test.id} href={`/admin/tests/${test.id}`} className="rounded-xl border border-border bg-card p-4 text-sm">
            <span className="font-medium">{test.title}</span>
            <span className="mt-1 block text-muted-foreground">{test.exam}{test.exam === "BPSC" ? "" : ` · ${test.paper === "PAPER_I" ? "Paper I" : test.paper === "PAPER_II" ? "Paper II" : "Both papers"}`} · {test.total_questions} questions · {test.duration_minutes} min · {test.is_free ? "Free" : "Premium"} · {test.selection_mode} · {test.status}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
