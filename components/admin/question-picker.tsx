"use client"

import { useState } from "react"
import { searchQuestionsAction } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Item = { id: string; question_text: string; exam?: string; difficulty?: string }

export function QuestionPicker({ exam, initial }: { exam: string; initial: Item[] }) {
  const [selected, setSelected] = useState<Item[]>(initial)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Item[]>([])

  async function search() {
    const rows = await searchQuestionsAction(query, exam)
    setResults(rows)
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name="question_ids" value={selected.map((item) => item.id).join(",")} />
      <div className="flex gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search published questions" className="h-11 text-base" />
        <Button type="button" variant="outline" className="min-h-11" onClick={() => void search()}>
          Search
        </Button>
      </div>
      <ul className="grid gap-2">
        {results.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm">
            <span>{item.question_text}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelected((current) => (current.some((row) => row.id === item.id) ? current : [...current, item]))}
            >
              Add
            </Button>
          </li>
        ))}
      </ul>
      <ol className="grid gap-2">
        {selected.map((item, index) => (
          <li key={item.id} className="flex items-start justify-between gap-2 rounded-lg bg-muted p-3 text-sm">
            <span>
              {index + 1}. {item.question_text}
            </span>
            <span className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" disabled={index === 0} onClick={() => move(index, -1)}>
                Up
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={index === selected.length - 1} onClick={() => move(index, 1)}>
                Down
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelected((current) => current.filter((row) => row.id !== item.id))}>
                Remove
              </Button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )

  function move(index: number, direction: number) {
    setSelected((current) => {
      const next = [...current]
      const target = index + direction
      const [item] = next.splice(index, 1)
      if (!item) return current
      next.splice(target, 0, item)
      return next
    })
  }
}
