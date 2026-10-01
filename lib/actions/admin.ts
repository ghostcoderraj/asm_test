"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin, requireSuperAdmin } from "@/lib/auth"
import { fail, mapDbError, ok, type ActionResult } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"
import { isUuid, questionSchema, testSchema } from "@/lib/validators"

function yearValue(value: string | undefined) {
  if (!value) return null
  const year = Number(value)
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return Number.NaN
  return year
}

export async function saveQuestionAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = questionSchema.safeParse({
    question_text: formData.get("question_text"),
    option_a: formData.get("option_a"),
    option_b: formData.get("option_b"),
    option_c: formData.get("option_c"),
    option_d: formData.get("option_d"),
    correct_option: formData.get("correct_option"),
    explanation: formData.get("explanation"),
    exam: formData.get("exam"),
    topic_id: formData.get("topic_id"),
    subtopic: formData.get("subtopic"),
    difficulty: formData.get("difficulty"),
    source: formData.get("source"),
    year: formData.get("year"),
    paper: formData.get("paper"),
    question_type: formData.get("question_type"),
    status: formData.get("status"),
  })
  if (!parsed.success) return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the question.")

  const year = yearValue(parsed.data.year)
  if (Number.isNaN(year)) return fail("INVALID_INPUT", "Year must be between 1900 and 2100.")
  const questionType = parsed.data.question_type ?? "PRACTICE"
  if (questionType === "PREVIOUS_YEAR" && year == null) {
    return fail("INVALID_INPUT", "Previous-year questions need a real year.")
  }

  const payload = {
    question_text: parsed.data.question_text,
    option_a: parsed.data.option_a,
    option_b: parsed.data.option_b,
    option_c: parsed.data.option_c,
    option_d: parsed.data.option_d,
    correct_option: parsed.data.correct_option,
    explanation: parsed.data.explanation || null,
    exam: parsed.data.exam,
    subject: "MUSIC",
    topic_id: parsed.data.topic_id,
    subtopic: parsed.data.subtopic || null,
    difficulty: parsed.data.difficulty,
    source: parsed.data.source || null,
    year,
    paper: parsed.data.paper ?? "BOTH",
    question_type: questionType,
    status: parsed.data.status,
  }

  const supabase = await createClient()
  const id = String(formData.get("id") ?? "")
  const write = async (row: Record<string, unknown>) =>
    isUuid(id) ? supabase.from("questions").update(row).eq("id", id) : supabase.from("questions").insert(row)
  let { error } = await write(payload)
  if (error?.message?.toLowerCase().includes("paper") || error?.message?.toLowerCase().includes("question_type")) {
    const { paper: _paper, question_type: _type, ...legacy } = payload
    ;({ error } = await write(legacy))
  }
  if (error) return mapDbError(error)
  revalidatePath("/admin/questions")
  redirect("/admin/questions")
}

export async function setQuestionStatusAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  if (!isUuid(id) || !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) return
  const supabase = await createClient()
  await supabase.from("questions").update({ status }).eq("id", id)
  revalidatePath("/admin/questions")
  revalidatePath("/dashboard/practice")
}

export async function publishDraftQuestionsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const topicId = String(formData.get("topicId") ?? "")
  const supabase = await createClient()
  let total = 0
  for (;;) {
    let pending = supabase.from("questions").select("id").eq("status", "DRAFT").limit(200)
    if (isUuid(topicId)) pending = pending.eq("topic_id", topicId)
    const { data, error } = await pending
    if (error) return mapDbError(error)
    const ids = (data ?? []).map((row) => row.id)
    if (ids.length === 0) break
    const updated = await supabase.from("questions").update({ status: "PUBLISHED" }).in("id", ids).eq("status", "DRAFT")
    if (updated.error) return mapDbError(updated.error)
    total += ids.length
    if (ids.length < 200) break
  }
  revalidatePath("/admin/questions")
  revalidatePath("/admin/questions/import")
  revalidatePath("/dashboard/practice")
  if (total === 0) return ok("No draft questions to publish.")
  return ok(`${total} draft questions are now published and will show in practice.`)
}

export async function saveTopicAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const name = String(formData.get("name") ?? "").trim()
  const exam = String(formData.get("exam") ?? "BOTH")
  const description = String(formData.get("description") ?? "").trim()
  if (name.length < 2) return fail("INVALID_INPUT", "Enter a topic name.")
  if (!["STET", "BPSC", "BOTH"].includes(exam)) return fail("INVALID_INPUT")

  const supabase = await createClient()
  const id = String(formData.get("id") ?? "")
  const payload = { name, exam, description: description || null, is_active: formData.get("is_active") !== "off" }
  const { error } = isUuid(id)
    ? await supabase.from("topics").update(payload).eq("id", id)
    : await supabase.from("topics").insert(payload)
  if (error) return mapDbError(error)
  revalidatePath("/admin/topics")
  return ok("Topic saved.")
}

export async function saveTestAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = testSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    exam: formData.get("exam"),
    paper: formData.get("paper"),
    duration_minutes: formData.get("duration_minutes"),
    total_questions: formData.get("total_questions"),
    is_free: formData.get("is_free") === "on",
    status: formData.get("status"),
    selection_mode: formData.get("selection_mode"),
  })
  if (!parsed.success) return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the test.")

  const supabase = await createClient()
  const id = String(formData.get("id") ?? "")
  const payload = {
    title: parsed.data.title,
    description: parsed.data.description || null,
    exam: parsed.data.exam,
    paper: parsed.data.exam === "BPSC" ? "BOTH" : parsed.data.paper,
    duration_minutes: parsed.data.duration_minutes,
    total_questions: parsed.data.total_questions,
    is_free: parsed.data.is_free,
    status: parsed.data.status,
    selection_mode: parsed.data.selection_mode,
  }

  const query = isUuid(id)
    ? await supabase.from("tests").update(payload).eq("id", id).select("id").single()
    : await supabase.from("tests").insert(payload).select("id").single()
  if (query.error || !query.data) return mapDbError(query.error)

  if (parsed.data.selection_mode === "FIXED") {
    const ids = String(formData.get("question_ids") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(isUuid)
    const { error } = await supabase.rpc("set_test_questions", { p_test_id: query.data.id, p_question_ids: ids })
    if (error) return mapDbError(error)
  }

  revalidatePath("/admin/tests")
  redirect("/admin/tests")
}

export async function savePlanAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const price = Number(formData.get("price"))
  const duration = Number(formData.get("duration_days"))
  if (!isUuid(id) || name.length < 2 || !Number.isFinite(price) || price < 0 || !Number.isInteger(duration) || duration < 1) {
    return fail("INVALID_INPUT", "Check the plan details.")
  }
  const features = String(formData.get("features") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const supabase = await createClient()
  const { error } = await supabase
    .from("subscription_plans")
    .update({
      name,
      description: description || null,
      price,
      duration_days: duration,
      features,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id)
  if (error) return mapDbError(error)
  revalidatePath("/admin/plans")
  revalidatePath("/")
  return ok("Plan updated. The public price comes from this record.")
}

export async function updateReportAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  if (!isUuid(id) || !["OPEN", "REVIEWING", "RESOLVED", "REJECTED"].includes(status)) return
  const supabase = await createClient()
  await supabase.from("question_reports").update({ status }).eq("id", id)
  revalidatePath("/admin/reports")
}

export async function setStudentActiveAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const active = formData.get("active") === "true"
  if (!isUuid(id)) return
  const supabase = await createClient()
  const { error } = await supabase.rpc("set_user_active", { p_user: id, p_active: active })
  if (error) return
  revalidatePath(`/admin/students/${id}`)
}

export async function setStudentRoleAction(formData: FormData) {
  await requireSuperAdmin()
  const id = String(formData.get("id") ?? "")
  const role = String(formData.get("role") ?? "")
  if (!isUuid(id) || !["STUDENT", "ADMIN", "SUPER_ADMIN"].includes(role)) return
  const supabase = await createClient()
  await supabase.rpc("set_user_role", { p_user: id, p_role: role })
  revalidatePath(`/admin/students/${id}`)
}

export async function saveSettingsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireSuperAdmin()
  const limit = Number(formData.get("free_mock_limit"))
  const strongMax = Number(formData.get("strong_max"))
  const needsPracticeMax = Number(formData.get("needs_practice_max"))
  const weakMax = Number(formData.get("weak_max"))
  if (![limit, strongMax, needsPracticeMax, weakMax].every((value) => Number.isInteger(value) && value >= 0)) {
    return fail("INVALID_INPUT", "Thresholds must be whole numbers.")
  }
  const supabase = await createClient()
  const first = await supabase.rpc("update_platform_setting", { p_key: "free_mock_limit", p_value: limit })
  if (first.error) return mapDbError(first.error)
  const second = await supabase.rpc("update_platform_setting", {
    p_key: "weak_thresholds",
    p_value: { strong_max: strongMax, needs_practice_max: needsPracticeMax, weak_max: weakMax },
  })
  if (second.error) return mapDbError(second.error)
  return ok("Platform settings saved.")
}

export async function announceAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const title = String(formData.get("title") ?? "").trim()
  const message = String(formData.get("message") ?? "").trim()
  const supabase = await createClient()
  const { error } = await supabase.rpc("broadcast_announcement", { p_title: title, p_message: message })
  if (error) return mapDbError(error)
  return ok("Announcement sent to active students.")
}

export async function searchQuestionsAction(query: string, exam: string) {
  await requireAdmin()
  const supabase = await createClient()
  let request = supabase
    .from("questions")
    .select("id, question_text, exam, difficulty, status")
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false })
    .limit(20)
  if (query.trim()) request = request.ilike("question_text", `%${query.trim()}%`)
  if (exam === "STET" || exam === "BPSC") request = request.in("exam", [exam, "BOTH"])
  const { data } = await request
  return data ?? []
}
