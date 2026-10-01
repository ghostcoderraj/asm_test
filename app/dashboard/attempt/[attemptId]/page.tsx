import { notFound, redirect } from "next/navigation"
import { TestRunner } from "@/components/test/runner"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validators"
import type { Paper } from "@/types/domain"

export default async function AttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params
  if (!isUuid(attemptId)) notFound()
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_attempt_paper", { p_attempt_id: attemptId })
  if (error || !data) notFound()
  const paper = data as Paper
  if (paper.attempt.status !== "IN_PROGRESS") redirect(`/dashboard/results/${attemptId}`)
  return <TestRunner paper={paper} />
}
