"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth"
import { fail, mapDbError, ok, type ActionResult } from "@/lib/errors"
import { createClient } from "@/lib/supabase/server"
import { testMatchesTarget } from "@/lib/exam/papers"
import { isUuid, ticketSchema } from "@/lib/validators"

export async function startTestAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await requireUser()
  const testId = String(formData.get("testId") ?? "")
  if (!isUuid(testId)) return fail("INVALID_INPUT")

  const supabase = await createClient()
  const loaded = await supabase.from("tests").select("id, exam, paper, status").eq("id", testId).maybeSingle()
  const test = loaded.error?.message?.toLowerCase().includes("paper")
    ? (await supabase.from("tests").select("id, exam, status").eq("id", testId).maybeSingle()).data
    : loaded.data
  if (!test || test.status !== "PUBLISHED") return fail("TEST_NOT_FOUND")
  if (profile.role === "STUDENT" && !testMatchesTarget(profile, test)) return fail("FORBIDDEN", "This test is not for your target exam or paper.")

  const { data, error } = await supabase.rpc("start_test", { p_test_id: testId })
  if (error) return mapDbError(error)
  redirect(`/dashboard/attempt/${data}`)
}

export async function startWeakPracticeAction(_prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("start_weak_practice", { p_limit: 20 })
  if (error) return mapDbError(error)
  redirect(`/dashboard/attempt/${data}`)
}

export async function startTopicPracticeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireUser()
  const topicId = String(formData.get("topicId") ?? "")
  if (!isUuid(topicId)) return fail("INVALID_INPUT")
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("start_topic_practice", { p_topic_id: topicId, p_limit: 10 })
  if (error) return mapDbError(error)
  redirect(`/dashboard/attempt/${data}`)
}

export async function saveResponseAction(input: {
  attemptId: string
  questionId: string
  selected: string | null
  marked: boolean
  timeTaken: number
}) {
  const profile = await requireUser()
  if (!isUuid(input.attemptId) || !isUuid(input.questionId)) return fail("INVALID_INPUT")
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("save_response", {
    p_attempt_id: input.attemptId,
    p_question_id: input.questionId,
    p_selected: input.selected ?? "",
    p_marked: input.marked,
    p_time_taken: input.timeTaken,
  })
  if (error) return mapDbError(error)
  return { success: true, message: "Saved.", code: "OK", status: (data as { status?: string } | null)?.status, userId: profile.id }
}

export async function submitAttemptAction(attemptId: string, auto = false) {
  await requireUser()
  if (!isUuid(attemptId)) return fail("INVALID_INPUT")
  const supabase = await createClient()
  const { error } = await supabase.rpc("submit_attempt", { p_attempt_id: attemptId, p_auto: auto })
  if (error) return mapDbError(error)
  redirect(`/dashboard/results/${attemptId}`)
}

export async function reportQuestionAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await requireUser()
  const questionId = String(formData.get("questionId") ?? "")
  const attemptId = String(formData.get("attemptId") ?? "")
  const reason = String(formData.get("reason") ?? "")
  const description = String(formData.get("description") ?? "").trim()
  if (!isUuid(questionId)) return fail("INVALID_INPUT")
  if (!["WRONG_ANSWER", "INCORRECT_QUESTION", "TYPO", "DUPLICATE", "OTHER"].includes(reason)) {
    return fail("INVALID_INPUT", "Choose a reason.")
  }

  const supabase = await createClient()
  const { error } = await supabase.from("question_reports").insert({
    user_id: profile.id,
    question_id: questionId,
    attempt_id: isUuid(attemptId) ? attemptId : null,
    reason,
    description: description || null,
    status: "OPEN",
  })
  if (error) return mapDbError(error)
  return ok("Report submitted. The academic team will review it.")
}

export async function createTicketAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await requireUser()
  const parsed = ticketSchema.safeParse({
    category: formData.get("category"),
    subject: formData.get("subject"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    test_id: formData.get("testId"),
    question_id: formData.get("questionId"),
    payment_id: formData.get("paymentId"),
  })
  if (!parsed.success) return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the form.")

  const optional = (value: string | undefined) => (value && isUuid(value) ? value : null)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: profile.id,
      category: parsed.data.category,
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: "OPEN",
      test_id: optional(parsed.data.test_id),
      question_id: optional(parsed.data.question_id),
      payment_id: optional(parsed.data.payment_id),
    })
    .select("id")
    .single()

  if (error || !data) return mapDbError(error)
  redirect(`/dashboard/support/${data.id}`)
}

export async function replyTicketAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await requireUser()
  const ticketId = String(formData.get("ticketId") ?? "")
  const message = String(formData.get("message") ?? "").trim()
  const internal = formData.get("internal") === "on"
  if (!isUuid(ticketId) || message.length < 1) return fail("INVALID_INPUT", "Write a message.")

  const isStaff = profile.role === "ADMIN" || profile.role === "SUPER_ADMIN"
  const supabase = await createClient()
  const { error } = await supabase.from("support_messages").insert({
    ticket_id: ticketId,
    sender_id: profile.id,
    message,
    is_internal: isStaff && internal,
  })
  if (error) return mapDbError(error)

  if (isStaff && !internal) {
    const { data: ticket } = await supabase.from("support_tickets").select("user_id, ticket_number").eq("id", ticketId).maybeSingle()
    if (ticket) {
      await supabase.from("notifications").insert({
        user_id: ticket.user_id,
        title: "Support reply",
        message: `There is a new reply on ${ticket.ticket_number}.`,
        type: "SUPPORT_REPLY",
      })
    }
  }

  revalidatePath(`/dashboard/support/${ticketId}`)
  revalidatePath(`/admin/support/${ticketId}`)
  return ok("Reply sent.")
}

export async function updateTicketAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const profile = await requireUser()
  if (profile.role !== "ADMIN" && profile.role !== "SUPER_ADMIN") return fail("FORBIDDEN")
  const ticketId = String(formData.get("ticketId") ?? "")
  if (!isUuid(ticketId)) return fail("INVALID_INPUT")

  const status = String(formData.get("status") ?? "")
  const priority = String(formData.get("priority") ?? "")
  const supabase = await createClient()
  const { data: before } = await supabase.from("support_tickets").select("user_id, status, ticket_number").eq("id", ticketId).maybeSingle()
  const { error } = await supabase.from("support_tickets").update({ status, priority }).eq("id", ticketId)
  if (error) return mapDbError(error)

  if (before && status === "RESOLVED" && before.status !== "RESOLVED") {
    await supabase.from("notifications").insert({
      user_id: before.user_id,
      title: "Support resolved",
      message: `${before.ticket_number} has been marked resolved.`,
      type: "SUPPORT_RESOLVED",
    })
  }

  revalidatePath(`/admin/support/${ticketId}`)
  return ok("Ticket updated.")
}

export async function markNotificationReadAction(formData: FormData) {
  const profile = await requireUser()
  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  if (id === "all") {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false)
  } else if (isUuid(id)) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", profile.id)
  }
  revalidatePath("/dashboard")
}
