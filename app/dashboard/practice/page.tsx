import Link from "next/link"
import { PracticeStart } from "@/components/practice/start-panel"
import { buttonVariants } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"
import { practicePaper } from "@/lib/exam/papers"
import { createClient } from "@/lib/supabase/server"
import type { PracticeHome } from "@/types/practice"
import { cn } from "cn"

const emptyHome: PracticeHome = {
  topics: [],
  weak: [],
  pyq_count: 0,
  pyq_based_count: 0,
  pyq_years: [],
  incorrect_count: 0,
  saved_count: 0,
  mixed_count: 0,
}

function bandLabel(band: string) {
  if (band === "CRITICAL") return "Critical"
  if (band === "WEAK") return "Weak"
  return "Needs practice"
}

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string; paper?: string }>
}) {
  const profile = await requireUser()
  const query = await searchParams
  const exam = query.exam === "BPSC" || query.exam === "STET" || query.exam === "BOTH"
    ? query.exam
    : profile.target_exam === "BPSC"
      ? "BPSC"
      : "STET"
  const paper = practicePaper(query.paper, profile.target_paper)
  if (exam === "BPSC" || profile.target_exam === "BPSC") {
    return (
      <div className="grid gap-4">
        <h1 className="font-heading text-3xl">BPSC Music Practice</h1>
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          BPSC Music practice is coming soon. The current series is STET Music.
        </p>
        {profile.target_exam === "BOTH" ? (
          <Link href="/dashboard/practice?exam=STET&paper=BOTH" className={cn(buttonVariants(), "min-h-11 w-fit")}>Open STET practice</Link>
        ) : null}
      </div>
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("practice_home", { p_exam: "STET", p_paper: paper })
  const home = (error ? emptyHome : (data as PracticeHome)) ?? emptyHome
  const href = (nextPaper: string) => `/dashboard/practice?exam=STET&paper=${nextPaper}`

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">STET Music Practice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {paper === "BOTH" ? "Both papers together: Paper I and Paper II in one practice set." : "Practice by topic and subtopic."}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Topics and subtopics are arranged for study. They are not an official exam weightage.</p>
      </div>

      {profile.target_exam === "BOTH" ? (
        <div className="flex flex-wrap gap-2">
          <Link href={href(paper)} className={cn(buttonVariants({ variant: "default" }), "min-h-11")}>STET</Link>
          <span className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}>BPSC · Coming soon</span>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Paper">
        <Link href={href("PAPER_I")} className={cn(buttonVariants({ variant: paper === "PAPER_I" ? "default" : "outline" }), "min-h-11")} aria-current={paper === "PAPER_I" ? "page" : undefined}>Paper I</Link>
        <Link href={href("PAPER_II")} className={cn(buttonVariants({ variant: paper === "PAPER_II" ? "default" : "outline" }), "min-h-11")} aria-current={paper === "PAPER_II" ? "page" : undefined}>Paper II</Link>
        <Link href={href("BOTH")} className={cn(buttonVariants({ variant: paper === "BOTH" ? "default" : "outline" }), "min-h-11")} aria-current={paper === "BOTH" ? "page" : undefined}>Both</Link>
      </div>

      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">Questions could not be loaded. Please try again.</p> : null}

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-heading text-xl">My weak topics</h2>
        {home.weak.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No weak topics yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {home.weak.slice(0, 8).map((item) => (
              <li key={item.subtopic_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <span>
                  <span className="font-medium">{item.subtopic_name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.topic_name} · {bandLabel(item.band)} · {item.wrong} wrong</span>
                </span>
                <Link href={`/dashboard/practice/${item.topic_slug}/${item.subtopic_slug}?paper=${paper}`} className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}>Practice</Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 max-w-sm">
          <PracticeStart label="Practice weak topics" mode="WEAK" exam="STET" paper={paper} emptyMessage="No weak topics yet." />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-medium">Previous year questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">{home.pyq_count > 0 ? `${home.pyq_count} questions` : "No questions available."}</p>
          <div className="mt-3">
            <PracticeStart label="Practice PYQ" mode="PYQ" exam="STET" paper={paper} years={home.pyq_years} emptyMessage="No questions available." />
          </div>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-medium">PYQ-based practice</h2>
          <p className="mt-1 text-sm text-muted-foreground">{home.pyq_based_count > 0 ? `${home.pyq_based_count} questions` : "No questions available."}</p>
          <div className="mt-3">
            <PracticeStart label="PYQ-based practice" mode="PYQ_BASED" exam="STET" paper={paper} emptyMessage="No questions available." />
          </div>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-medium">Mixed practice</h2>
          <p className="mt-1 text-sm text-muted-foreground">{home.mixed_count > 0 ? `${home.mixed_count} questions` : "No questions available."}</p>
          <div className="mt-3">
            <PracticeStart label="Mixed practice" mode="MIXED" exam="STET" paper={paper} showType />
          </div>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-medium">Practice incorrect questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">{home.incorrect_count > 0 ? `${home.incorrect_count} questions` : "No incorrect questions yet."}</p>
          <div className="mt-3">
            <PracticeStart label="Practice incorrect questions" mode="INCORRECT" exam="STET" paper={paper} emptyMessage="No incorrect questions yet." />
          </div>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-medium">Saved questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">{home.saved_count > 0 ? `${home.saved_count} questions` : "You have not saved any questions yet."}</p>
          <div className="mt-3">
            <PracticeStart label="Saved questions" mode="SAVED" exam="STET" paper={paper} emptyMessage="You have not saved any questions yet." />
          </div>
        </article>
      </section>

      <section className="grid gap-3">
        <h2 className="font-heading text-xl">Topics</h2>
        {home.topics.length === 0 ? <p className="text-sm text-muted-foreground">No questions available.</p> : null}
        {home.topics.map((topic) => (
          <article key={topic.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{String(topic.display_order).padStart(2, "0")}</p>
            <h3 className="font-medium">{topic.name}</h3>
            {Array.isArray(topic.preview) && topic.preview.length ? <p className="mt-1 text-sm text-muted-foreground">{topic.preview.join(" · ")}</p> : null}
            <div className="mt-3">
              <Link href={`/dashboard/practice/${topic.slug}?paper=${paper}`} className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}>View subtopics</Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
