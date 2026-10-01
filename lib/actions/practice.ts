"use server"

import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth"
import { fail, mapDbError, type ActionResult } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validators"

function textOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim()
  return text && text !== "ALL" ? text : null
}

export async function practiceAvailableAction(input: {
  mode: string
  exam: string
  paper: string
  topicId?: string | null
  subtopicId?: string | null
  type?: string | null
  difficulty?: string | null
  year?: number | null
}) {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("practice_available", {
    p_mode: input.mode,
    p_exam: input.exam,
    p_paper: input.paper,
    p_topic: input.topicId && isUuid(input.topicId) ? input.topicId : null,
    p_subtopic: input.subtopicId && isUuid(input.subtopicId) ? input.subtopicId : null,
    p_type: input.type && input.type !== "ALL" ? input.type : null,
    p_difficulty: input.difficulty && input.difficulty !== "ALL" ? input.difficulty : null,
    p_year: input.year ?? null,
  })
  if (error) return 0
  return Number(data ?? 0)
}

export async function startSyllabusPracticeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireUser()
  const mode = String(formData.get("mode") ?? "")
  const exam = String(formData.get("exam") ?? "STET")
  const paper = String(formData.get("paper") ?? "BOTH")
  const topicId = String(formData.get("topicId") ?? "")
  const subtopicId = String(formData.get("subtopicId") ?? "")
  const yearText = String(formData.get("year") ?? "")
  const limit = Number(formData.get("limit") ?? 10)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return fail("INVALID_INPUT")

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("start_syllabus_practice", {
    p_mode: mode,
    p_exam: exam,
    p_paper: paper,
    p_topic: isUuid(topicId) ? topicId : null,
    p_subtopic: isUuid(subtopicId) ? subtopicId : null,
    p_type: textOrNull(formData.get("type")),
    p_difficulty: textOrNull(formData.get("difficulty")),
    p_year: /^[0-9]{4}$/.test(yearText) ? Number(yearText) : null,
    p_limit: limit,
  })
  if (error) {
    if (error.message.includes("NOT_ENOUGH_QUESTIONS")) return fail("NOT_ENOUGH_QUESTIONS", "No questions available.")
    if (error.message.includes("PREMIUM_REQUIRED")) return fail("PREMIUM_REQUIRED")
    return mapDbError(error)
  }
  redirect(`/dashboard/attempt/${data}`)
}

export async function toggleSavedQuestionAction(questionId: string) {
  await requireUser()
  if (!isUuid(questionId)) return null
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("toggle_saved_question", { p_question_id: questionId })
  if (error) return null
  return Boolean(data)
}
