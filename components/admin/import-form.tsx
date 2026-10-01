"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { ImportSummary, ImportTopicPreview } from "@/types/domain"

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [publish, setPublish] = useState(true)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [topics, setTopics] = useState<ImportTopicPreview[]>([])
  const [sheet, setSheet] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function run(commit: boolean) {
    if (!file) {
      setMessage("Choose a CSV or XLSX file.")
      return
    }
    setPending(true)
    const body = new FormData()
    body.set("file", file)
    body.set("commit", String(commit))
    body.set("publish", String(publish))
    const response = await fetch("/api/admin/questions/import", { method: "POST", body })
    const payload = (await response.json()) as {
      success: boolean
      message: string
      summary?: ImportSummary
      topics?: ImportTopicPreview[]
      sheet?: string
    }
    setSummary(payload.summary ?? null)
    setTopics(payload.topics ?? [])
    setSheet(payload.sheet ?? "")
    setMessage(payload.message)
    setPending(false)
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="file">Topic workbook (XLSX or CSV)</Label>
        <input
          id="file"
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="min-h-11 text-sm"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null)
            setSummary(null)
            setTopics([])
            setSheet("")
          }}
        />
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} />
        Publish valid questions on import. This is already ticked, so new questions show in practice. Leave it off only when you want drafts.
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="min-h-11" disabled={pending || !file} onClick={() => void run(false)}>
          Preview
        </Button>
        <Button type="button" className="min-h-11" disabled={pending || !file} onClick={() => void run(true)}>
          Confirm import
        </Button>
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
      {topics.length > 0 ? (
        <ul className="grid gap-2 text-sm">
          {topics.map((topic) => (
            <li key={`${topic.topic}-${topic.paper}`} className="rounded-lg border border-border bg-card px-3 py-2">
              <span className="font-medium">{topic.savedAs && topic.savedAs !== topic.topic ? topic.savedAs : topic.topic}</span>
              {topic.savedAs && topic.savedAs !== topic.topic ? <span className="mt-1 block text-muted-foreground">Sheet topic: {topic.topic}</span> : null}
              <span className="mt-1 block text-muted-foreground">
                {topic.exam} · {topic.paper === "PAPER_I" ? "Paper I" : topic.paper === "PAPER_II" ? "Paper II" : "Paper I & II"}
                {sheet ? ` · sheet ${sheet}` : ""} · {topic.total} questions · PYQ {topic.previousYear} · PYQ based {topic.pyqBased} · practice {topic.practice}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {summary ? (
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-5">
          <Stat label="Total rows" value={summary.total} />
          <Stat label="Valid rows" value={summary.valid} />
          <Stat label="Invalid rows" value={summary.invalid} />
          <Stat label="Duplicate rows" value={summary.duplicate} />
          <Stat label="New rows" value={summary.new_rows} />
        </dl>
      ) : null}
      {summary && summary.errors.length > 0 ? (
        <ul className="grid gap-1 text-sm text-destructive">
          {summary.errors.map((error) => (
            <li key={`${error.row}-${error.message}`}>
              Row {error.row}: {error.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl">{value}</dd>
    </div>
  )
}
