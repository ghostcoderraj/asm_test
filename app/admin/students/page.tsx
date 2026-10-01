import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { examLabel } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin()
  const { q } = await searchParams
  const supabase = await createClient()
  let query = supabase.from("profiles").select("id, full_name, mobile_number, target_exam, role, is_active, created_at").order("created_at", { ascending: false }).limit(50)
  if (q) query = query.or(`full_name.ilike.%${q}%,mobile_number.ilike.%${q}%`)
  const { data } = await query
  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Students</h1>
      <form>
        <input name="q" defaultValue={q} placeholder="Search name or mobile" className="h-11 w-full max-w-md rounded-lg border border-input px-3" />
      </form>
      <p className="text-sm text-muted-foreground">Passwords are never shown. Supabase Auth stores them outside this table.</p>
      <div className="grid gap-2">
        {(data ?? []).map((student) => (
          <Link key={student.id} href={`/admin/students/${student.id}`} className="rounded-xl border border-border bg-card p-4 text-sm">
            <span className="font-medium">{student.full_name}</span>
            <span className="mt-1 block text-muted-foreground">{student.mobile_number} · {examLabel(student.target_exam)} · {student.role} · {student.is_active ? "Active" : "Disabled"}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
