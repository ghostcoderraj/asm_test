"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toggleSavedQuestionAction } from "@/lib/actions/practice"
import { saveResponseAction, submitAttemptAction } from "@/lib/actions/student"
import { ReportDialog } from "@/components/test/report-dialog"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { formatClock } from "@/lib/format"
import type { Paper, PaperQuestion } from "@/types/domain"
import { cn } from "cn"

type State = "NOT_VISITED" | "VISITED" | "ANSWERED" | "MARKED" | "ANSWERED_AND_MARKED"

const labels: Record<State, string> = {
  NOT_VISITED: "Not visited",
  VISITED: "Visited",
  ANSWERED: "Answered",
  MARKED: "Marked",
  ANSWERED_AND_MARKED: "Answered and marked",
}

function QuestionBadge({ question }: { question: PaperQuestion }) {
  if (question.question_type === "PREVIOUS_YEAR" && question.year) {
    return <p className="mt-2 text-xs font-medium text-primary">PYQ {question.year}</p>
  }
  if (question.question_type === "PYQ_BASED") {
    return <p className="mt-2 text-xs font-medium text-primary">PYQ-based</p>
  }
  return <p className="mt-2 text-xs font-medium text-primary">Practice</p>
}

function questionState(question: PaperQuestion): State {
  const answered = Boolean(question.selected_answer)
  if (answered && question.is_marked) return "ANSWERED_AND_MARKED"
  if (question.is_marked) return "MARKED"
  if (answered) return "ANSWERED"
  if (question.visited) return "VISITED"
  return "NOT_VISITED"
}

const stateClass: Record<State, string> = {
  NOT_VISITED: "border-border bg-card text-foreground",
  VISITED: "border-amber-700/30 bg-amber-100 text-amber-950",
  ANSWERED: "border-emerald-700/30 bg-emerald-700 text-white",
  MARKED: "border-violet-700/30 bg-violet-700 text-white",
  ANSWERED_AND_MARKED: "border-violet-900 bg-violet-900 text-white",
}

export function TestRunner({ paper }: { paper: Paper }) {
  const router = useRouter()
  const [questions, setQuestions] = useState(paper.questions)
  const [index, setIndex] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const started = useRef(Date.now())
  const submittingRef = useRef(false)
  const saveTask = useRef<Promise<void>>(Promise.resolve())
  const finishRef = useRef<(auto?: boolean) => Promise<void>>(async () => {})
  const ends = new Date(paper.attempt.ends_at).getTime()
  const remaining = Math.max(0, Math.floor((ends - now) / 1000))
  const current = questions[index]

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!confirming) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !submittingRef.current) setConfirming(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [confirming])

  useEffect(() => {
    if (remaining === 0) void finish(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  useEffect(() => {
    if (paper.attempt.kind !== "MOCK") return
    function leave() {
      setMessage("You left the test screen. The test is being submitted.")
      void finishRef.current(true)
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") leave()
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", leave)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", leave)
    }
  }, [paper.attempt.kind])

  useEffect(() => {
    started.current = Date.now()
    const question = questions[index]
    if (question && !question.visited) void persist(question, { visitedOnly: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const counts = useMemo(() => {
    const tally = { NOT_VISITED: 0, VISITED: 0, ANSWERED: 0, MARKED: 0, ANSWERED_AND_MARKED: 0 }
    questions.forEach((question) => {
      tally[questionState(question)] += 1
    })
    return tally
  }, [questions])

  async function persist(question: PaperQuestion, options?: { visitedOnly?: boolean }) {
    const elapsed = Math.max(1, Math.round((Date.now() - started.current) / 1000))
    started.current = Date.now()
    const task = (async () => {
      const result = await saveResponseAction({
        attemptId: paper.attempt.id,
        questionId: question.id,
        selected: question.selected_answer,
        marked: question.is_marked,
        timeTaken: options?.visitedOnly ? 0 : elapsed,
      })
      if (!result.success && result.code === "ATTEMPT_CLOSED") {
        router.push(`/dashboard/results/${paper.attempt.id}`)
        return
      }
      if (result.success && "status" in result && result.status === "AUTO_SUBMITTED") {
        router.push(`/dashboard/results/${paper.attempt.id}`)
      }
    })()
    saveTask.current = task
    await task
  }

  function updateCurrent(patch: Partial<PaperQuestion>) {
    const next = questions.map((question, questionIndex) =>
      questionIndex === index ? { ...question, visited: true, ...patch } : question,
    )
    setQuestions(next)
    const updated = next[index]
    if (updated) void persist(updated)
  }

  async function finish(auto = false) {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setConfirming(false)
    await saveTask.current
    const result = await submitAttemptAction(paper.attempt.id, auto)
    if (result && !result.success) {
      submittingRef.current = false
      setSubmitting(false)
      setMessage(result.message)
    }
  }
  finishRef.current = finish

  if (!current) return <p>This attempt has no questions.</p>

  const options = [
    ["A", current.option_a],
    ["B", current.option_b],
    ["C", current.option_c],
    ["D", current.option_d],
  ] as const

  const palette = (
    <div className="grid grid-cols-5 gap-2">
      {questions.map((question, questionIndex) => (
        <button
          key={question.id}
          type="button"
          className={cn("min-h-11 rounded-md border text-sm font-medium", stateClass[questionState(question)], questionIndex === index && "ring-2 ring-primary")}
          onClick={() => setIndex(questionIndex)}
        >
          {questionIndex + 1}
        </button>
      ))}
    </div>
  )

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[1fr_280px]">
      <section className="pb-36 lg:pb-0">
        <div className="sticky top-16 z-10 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 md:top-0 lg:static lg:mx-0 lg:rounded-xl lg:border lg:bg-card">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{paper.attempt.title}</p>
            <p className="font-medium">Question {index + 1} of {questions.length}</p>
          </div>
          <div className="text-right">
            <p className={cn("font-heading text-2xl tabular-nums", remaining < 60 && "text-destructive")} aria-live="polite">
              {formatClock(remaining)}
            </p>
            {paper.attempt.kind === "MOCK" ? (
              <p className="max-w-48 text-xs text-muted-foreground">Leaving this screen or opening another tab submits the test. Question numbers and answer choices are different for each student.</p>
            ) : null}
          </div>
        </div>

        <article className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs tracking-wide text-muted-foreground">{[current.topic_name, current.subtopic_name].filter(Boolean).join(" · ")}</p>
          {paper.attempt.kind === "PRACTICE" ? <QuestionBadge question={current} /> : null}
          <h1 className="mt-2 font-heading text-xl leading-snug break-words">{current.question_text}</h1>
          {current.image_path ? <p className="mt-2 text-xs text-muted-foreground">Image: {current.image_path}</p> : null}
          <div className="mt-4 grid gap-2">
            {options.map(([key, text]) => (
              <button
                key={key}
                type="button"
                className={cn(
                  "min-h-12 rounded-lg border px-3 py-3 text-left text-base",
                  current.selected_answer === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                )}
                onClick={() => updateCurrent({ selected_answer: key })}
              >
                <span className="mr-2 font-semibold">{key}.</span>
                {text}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="min-h-11" onClick={() => updateCurrent({ selected_answer: null })}>
              Clear answer
            </Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => updateCurrent({ is_marked: !current.is_marked })}>
              {current.is_marked ? "Unmark" : "Mark for review"}
            </Button>
            <ReportDialog questionId={current.id} attemptId={paper.attempt.id} />
            {paper.attempt.kind === "PRACTICE" ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => {
                  void toggleSavedQuestionAction(current.id).then((saved) => {
                    if (saved == null) {
                      setMessage("This question could not be saved.")
                      return
                    }
                    setQuestions((items) => items.map((item) => (item.id === current.id ? { ...item, saved } : item)))
                  })
                }}
              >
                {current.saved ? "Saved" : "Save question"}
              </Button>
            ) : null}
          </div>
          {message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}
        </article>
      </section>

      <aside className="hidden lg:block">
        <div className="sticky top-4 rounded-xl border border-border bg-card p-4">
          <h2 className="font-medium">Question palette</h2>
          <div className="mt-3">{palette}</div>
          <Legend counts={counts} />
          <Button type="button" className="mt-4 min-h-11 w-full" disabled={submitting} onClick={() => setConfirming(true)}>
            {submitting ? "Submitting…" : "Submit test"}
          </Button>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 gap-2 border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <Button type="button" variant="outline" className="min-h-12" disabled={index === 0 || submitting} onClick={() => setIndex((value) => value - 1)}>
          Prev
        </Button>
        <Sheet>
          <SheetTrigger className="min-h-12 rounded-lg border border-border text-sm touch-manipulation">Palette</SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80dvh] overflow-auto">
            <SheetHeader>
              <SheetTitle>Questions</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">
              {palette}
              <Legend counts={counts} />
              <Button type="button" className="mt-4 min-h-12 w-full" disabled={submitting} onClick={() => setConfirming(true)}>
                {submitting ? "Submitting…" : "Submit test"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Button type="button" variant="outline" className="min-h-12" disabled={index === questions.length - 1 || submitting} onClick={() => setIndex((value) => value + 1)}>
          Next
        </Button>
        <Button type="button" className="col-span-3 min-h-12 text-base" disabled={submitting} onClick={() => setConfirming(true)}>
          {submitting ? "Submitting…" : "Submit test"}
        </Button>
      </div>

      <div className="mt-4 hidden justify-between lg:flex">
        <Button type="button" variant="outline" className="min-h-11" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
          Previous
        </Button>
        <Button type="button" className="min-h-11" disabled={index === questions.length - 1} onClick={() => setIndex((value) => value + 1)}>
          Next
        </Button>
      </div>

      {confirming ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-black/40 p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-xl bg-card p-5" role="dialog" aria-modal="true" aria-labelledby="submit-title">
            <h2 id="submit-title" className="font-heading text-xl">Submit this test?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Answered: {counts.ANSWERED + counts.ANSWERED_AND_MARKED}. Marked: {counts.MARKED + counts.ANSWERED_AND_MARKED}. You cannot change answers after submission.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="min-h-12" disabled={submitting} onClick={() => setConfirming(false)}>
                Review
              </Button>
              <Button type="button" className="min-h-12" disabled={submitting} onClick={() => void finish(false)}>
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Legend({ counts }: { counts: Record<State, number> }) {
  return (
    <ul className="mt-4 grid gap-1 text-xs text-muted-foreground">
      {(Object.keys(labels) as State[]).map((state) => (
        <li key={state} className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className={cn("size-3 rounded-sm border", stateClass[state])} />
            {labels[state]}
          </span>
          <span>{counts[state]}</span>
        </li>
      ))}
    </ul>
  )
}
