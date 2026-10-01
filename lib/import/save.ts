import type { SupabaseClient } from "@supabase/supabase-js"
import type { ImportRow } from "@/lib/import/headers"
import { matchImportTopic, normTopic, paperFromFileName, topicOrderFromFileName } from "@/lib/import/match-topic"
import type { ImportTopicPreview } from "@/types/domain"

type TopicRow = { id: string; name: string; exam: string; slug: string | null; display_order: number; paper?: string | null }
type SubtopicRow = { id: string; topic_id: string; name: string }

export type SavedImport = {
  total: number
  valid: number
  invalid: number
  duplicate: number
  new_rows: number
  errors: { row: number; message: string }[]
  topics: ImportTopicPreview[]
}

function norm(value: string) {
  return normTopic(value)
}

function letter(row: ImportRow) {
  const answer = row.correct_answer.trim().toUpperCase()
  if (["A", "B", "C", "D"].includes(answer)) return answer
  const options = [row.option_a, row.option_b, row.option_c, row.option_d]
  const index = options.findIndex((option) => option.trim().toLowerCase() === answer.toLowerCase())
  return index >= 0 ? "ABCD"[index] : answer
}

function yearOf(value: string) {
  if (!value) return null
  if (!/^\d{4}$/.test(value)) return -1
  return Number(value)
}

export async function saveImportedQuestions(
  supabase: SupabaseClient,
  rows: ImportRow[],
  options: { commit: boolean; publish: boolean; fileName?: string; sheet?: string },
): Promise<SavedImport> {
  const topicsResult = await supabase.from("topics").select("id, name, exam, slug, display_order, paper")
  if (topicsResult.error) throw new Error(topicsResult.error.message)
  const topics = (topicsResult.data ?? []) as TopicRow[]
  const subtopicsResult = await supabase.from("subtopics").select("id, topic_id, name")
  if (subtopicsResult.error) throw new Error(subtopicsResult.error.message)
  const subtopics = (subtopicsResult.data ?? []) as SubtopicRow[]

  const exams = [...new Set(rows.map((row) => row.exam.trim().toUpperCase()).filter(Boolean))]
  const existing = new Set<string>()
  if (exams.length) {
    const pageSize = 1000
    for (let from = 0; ; from += pageSize) {
      const existingResult = await supabase.from("questions").select("question_text, exam").in("exam", exams).range(from, from + pageSize - 1)
      if (existingResult.error) throw new Error(existingResult.error.message)
      const page = (existingResult.data ?? []) as { question_text: string; exam: string }[]
      for (const row of page) existing.add(`${row.exam}:${norm(row.question_text)}`)
      if (page.length < pageSize) break
    }
  }

  const topicOrder = topicOrderFromFileName(options.fileName ?? "") ?? topicOrderFromFileName(options.sheet ?? "")
  const filePaper = paperFromFileName(options.fileName ?? "") || paperFromFileName(options.sheet ?? "")
  const prepared: { row: number; message: string | null; payload?: Record<string, unknown>; topicId?: string; subtopicName?: string }[] = []
  const seen = new Set<string>()
  const subtopicsByLabel = new Map<string, string[]>()
  for (const row of rows) {
    const label = `${norm(row.topic)}|${row.paper || filePaper || "BOTH"}`
    const names = subtopicsByLabel.get(label) ?? []
    if (row.subtopic.trim()) names.push(row.subtopic)
    subtopicsByLabel.set(label, names)
  }

  rows.forEach((row, index) => {
    const exam = row.exam.trim().toUpperCase()
    const paper = row.paper || filePaper || "BOTH"
    const questionType = row.question_type || "PRACTICE"
    const year = yearOf(row.year)
    const topic = matchImportTopic(topics, subtopics, row.topic, exam, {
      paper,
      topicOrder,
      subtopicNames: subtopicsByLabel.get(`${norm(row.topic)}|${row.paper || filePaper || "BOTH"}`) ?? [],
    })
    const correct = letter(row)
    const key = `${exam}:${norm(row.question)}`
    let message: string | null = null
    if (!row.question.trim()) message = "Question text is required"
    else if (!row.option_a || !row.option_b || !row.option_c || !row.option_d) message = "All four options are required"
    else if (!["A", "B", "C", "D"].includes(correct)) message = "Correct answer must be A, B, C, or D"
    else if (!["STET", "BPSC", "BOTH"].includes(exam)) message = "Exam must be STET, BPSC, or BOTH"
    else if ((row.subject || "MUSIC").toUpperCase() !== "MUSIC") message = "Subject must be MUSIC"
    else if (!["EASY", "MEDIUM", "HARD"].includes(row.difficulty.trim().toUpperCase())) message = "Difficulty must be EASY, MEDIUM, or HARD"
    else if (!row.topic.trim()) message = "Topic is required"
    else if (!topic) message = "Unknown topic"
    else if (!["PAPER_I", "PAPER_II", "BOTH"].includes(paper)) message = "Paper must be PAPER_I, PAPER_II, or BOTH"
    else if (!["PREVIOUS_YEAR", "PYQ_BASED", "PRACTICE"].includes(questionType)) message = "Question type must be PREVIOUS_YEAR, PYQ_BASED, or PRACTICE"
    else if (questionType === "PREVIOUS_YEAR" && year == null) message = "Previous-year questions need a real year"
    else if (year != null && (year < 1900 || year > 2100)) message = "Year is invalid"
    else if (existing.has(key) || seen.has(key)) message = "Duplicate question"
    else seen.add(key)

    const subtopic = topic && row.subtopic
      ? subtopics.find((item) => item.topic_id === topic.id && norm(item.name) === norm(row.subtopic))
      : undefined
    prepared.push({
      row: index + 1,
      message,
      topicId: topic?.id,
      subtopicName: row.subtopic.trim() || undefined,
      payload: message
        ? undefined
        : {
            question_text: row.question.trim(),
            option_a: row.option_a.trim(),
            option_b: row.option_b.trim(),
            option_c: row.option_c.trim(),
            option_d: row.option_d.trim(),
            correct_option: correct,
            explanation: row.explanation.trim() || null,
            exam,
            subject: "MUSIC",
            topic_id: topic?.id,
            subtopic: row.subtopic.trim() || null,
            subtopic_id: subtopic?.id ?? null,
            difficulty: row.difficulty.trim().toUpperCase(),
            source: row.source.trim() || null,
            year,
            paper,
            question_type: questionType,
            status: options.publish ? "PUBLISHED" : row.status || "DRAFT",
          },
    })
  })

  const errors = prepared.filter((item) => item.message).slice(0, 50).map((item) => ({ row: item.row, message: item.message as string }))
  const invalid = prepared.filter((item) => item.message && item.message !== "Duplicate question").length
  const duplicate = prepared.filter((item) => item.message === "Duplicate question").length
  const valid = prepared.length - invalid
  let inserted = prepared.filter((item) => !item.message).length

  if (options.commit) {
    const freshSubtopics = new Map<string, { topic_id: string; name: string; display_order: number }>()
    for (const item of prepared) {
      if (item.message || !item.topicId || !item.subtopicName || item.payload?.subtopic_id) continue
      freshSubtopics.set(`${item.topicId}:${norm(item.subtopicName)}`, {
        topic_id: item.topicId,
        name: item.subtopicName,
        display_order: 1000 + freshSubtopics.size,
      })
    }
    if (freshSubtopics.size > 0) {
      const created = await supabase.from("subtopics").insert([...freshSubtopics.values()]).select("id, topic_id, name")
      if (created.error) throw new Error(created.error.message)
      for (const subtopic of (created.data ?? []) as SubtopicRow[]) {
        subtopics.push(subtopic)
      }
      for (const item of prepared) {
        const subtopicName = item.subtopicName
        if (!item.payload || !item.topicId || !subtopicName) continue
        const match = subtopics.find((subtopic) => subtopic.topic_id === item.topicId && norm(subtopic.name) === norm(subtopicName))
        if (match) item.payload.subtopic_id = match.id
      }
    }

    const payloads = prepared.flatMap((item) => (item.payload ? [item.payload] : []))
    inserted = 0
    for (let index = 0; index < payloads.length; index += 200) {
      const batch = await supabase.from("questions").insert(payloads.slice(index, index + 200))
      if (batch.error) throw new Error(batch.error.message)
      inserted += payloads.slice(index, index + 200).length
    }
  }

  return {
    total: prepared.length,
    valid,
    invalid,
    duplicate,
    new_rows: inserted,
    errors,
    topics: previewTopics(rows, prepared, topics),
  }
}

function previewTopics(
  rows: ImportRow[],
  prepared: { topicId?: string }[],
  topics: TopicRow[],
): ImportTopicPreview[] {
  const groups = new Map<string, ImportTopicPreview>()
  rows.forEach((row, index) => {
    const savedAs = topics.find((topic) => topic.id === prepared[index]?.topicId)?.name
    const key = `${row.topic}\n${savedAs ?? ""}\n${row.exam}\n${row.paper}`
    const group = groups.get(key) ?? {
      topic: row.topic || "Unknown topic",
      savedAs,
      exam: row.exam || "STET",
      paper: row.paper || "BOTH",
      total: 0,
      previousYear: 0,
      pyqBased: 0,
      practice: 0,
    }
    group.total += 1
    if (row.question_type === "PREVIOUS_YEAR") group.previousYear += 1
    else if (row.question_type === "PYQ_BASED") group.pyqBased += 1
    else group.practice += 1
    groups.set(key, group)
  })
  return [...groups.values()]
}
