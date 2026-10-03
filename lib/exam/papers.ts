import type { TargetExam } from "@/types/domain"

export type TargetPaper = "PAPER_I" | "PAPER_II" | "BOTH"

export function practicePaper(value: string | undefined, fallback?: string | null): TargetPaper {
  if (value === "PAPER_I" || value === "PAPER_II" || value === "BOTH") return value
  if (fallback === "PAPER_I" || fallback === "PAPER_II") return fallback
  return "BOTH"
}

export function paperLabel(paper: string | null | undefined) {
  if (paper === "PAPER_I") return "Paper I"
  if (paper === "PAPER_II") return "Paper II"
  if (paper === "BOTH") return "Paper I & II"
  return ""
}

export function targetSummary(exam: string, paper?: string | null) {
  if (exam === "BPSC") return "BPSC Music · Coming soon"
  if (exam === "STET") return `STET Music · ${paperLabel(paper) || "Paper I & II"}`
  if (exam === "BOTH") return `STET Music · ${paperLabel(paper) || "Paper I & II"} · BPSC coming soon`
  return exam
}

export function testMatchesTarget(
  profile: { target_exam: TargetExam | string; target_paper?: string | null },
  test: { exam: string; paper?: string | null },
) {
  const examOk = profile.target_exam === "BOTH" || test.exam === "BOTH" || test.exam === profile.target_exam
  if (!examOk) return false
  if (test.exam === "BPSC" || profile.target_exam === "BPSC") return false
  const wanted = profile.target_paper === "PAPER_I" || profile.target_paper === "PAPER_II" ? profile.target_paper : "BOTH"
  if (wanted === "BOTH") return true
  const paper = test.paper === "PAPER_I" || test.paper === "PAPER_II" ? test.paper : "BOTH"
  return paper === "BOTH" || paper === wanted
}
