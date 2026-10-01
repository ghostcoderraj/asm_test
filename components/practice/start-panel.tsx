"use client"

import { useEffect, useState } from "react"
import { practiceAvailableAction, startSyllabusPracticeAction } from "@/lib/actions/practice"
import { BoundForm } from "@/components/bound-form"
import { controlClass, SubmitButton } from "@/components/form-bits"
import { Button } from "@/components/ui/button"

const counts = [10, 20, 30, 50, 100]

export function PracticeStart({
  label,
  mode,
  exam,
  paper,
  topicId,
  subtopicId,
  years = [],
  showType = false,
  emptyMessage = "No questions available.",
}: {
  label: string
  mode: string
  exam: string
  paper: string
  topicId?: string
  subtopicId?: string
  years?: number[]
  showType?: boolean
  emptyMessage?: string
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState(mode === "PYQ" ? "PREVIOUS_YEAR" : mode === "PYQ_BASED" ? "PYQ_BASED" : "ALL")
  const [difficulty, setDifficulty] = useState("ALL")
  const [year, setYear] = useState("")
  const [count, setCount] = useState(10)
  const [available, setAvailable] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    practiceAvailableAction({
      mode,
      exam,
      paper,
      topicId,
      subtopicId,
      type,
      difficulty,
      year: year ? Number(year) : null,
    }).then((value) => {
      if (!cancelled) setAvailable(value)
    })
    return () => {
      cancelled = true
    }
  }, [open, mode, exam, paper, topicId, subtopicId, type, difficulty, year])

  const ready = available ?? 0
  const startCount = Math.min(count, ready)

  return (
    <div className="grid gap-3">
      <Button type="button" className="min-h-11" onClick={() => setOpen((value) => !value)}>
        {label}
      </Button>
      {open ? (
        <BoundForm action={startSyllabusPracticeAction} className="grid gap-3 rounded-lg border border-border bg-background p-3">
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="exam" value={exam} />
          <input type="hidden" name="paper" value={paper} />
          <input type="hidden" name="topicId" value={topicId ?? ""} />
          <input type="hidden" name="subtopicId" value={subtopicId ?? ""} />
          <input type="hidden" name="limit" value={startCount || 10} />
          {showType ? (
            <label className="grid gap-1 text-sm">
              Question type
              <select name="type" className={controlClass} value={type} onChange={(event) => setType(event.target.value)}>
                <option value="ALL">All</option>
                <option value="PRACTICE">Practice</option>
                <option value="PREVIOUS_YEAR">Previous year</option>
                <option value="PYQ_BASED">PYQ-based</option>
              </select>
            </label>
          ) : (
            <input type="hidden" name="type" value={type} />
          )}
          <label className="grid gap-1 text-sm">
            Difficulty
            <select name="difficulty" className={controlClass} value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="ALL">All</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
          {type === "PREVIOUS_YEAR" && years.length > 0 ? (
            <label className="grid gap-1 text-sm">
              Year
              <select name="year" className={controlClass} value={year} onChange={(event) => setYear(event.target.value)}>
                <option value="">All years</option>
                {years.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="grid gap-1 text-sm">
            Number of questions
            <select className={controlClass} value={count} onChange={(event) => setCount(Number(event.target.value))}>
              {counts.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          {available == null ? <p className="text-sm text-muted-foreground">Loading questions…</p> : null}
          {available === 0 ? <p className="text-sm text-muted-foreground">{year ? "No questions are available for this year." : emptyMessage}</p> : null}
          {ready > 0 && ready < count ? <p className="text-sm text-muted-foreground">Only {ready} questions are available.</p> : null}
          <SubmitButton disabled={ready < 1}>
            {ready > 0 && ready < count ? `Start ${ready} questions` : "Start practice"}
          </SubmitButton>
        </BoundForm>
      ) : null}
    </div>
  )
}
