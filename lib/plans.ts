import type { TargetExam } from "@/types/domain"

export function planTargetExam(name: string): TargetExam | null {
  const value = name.toLowerCase()
  const stet = value.includes("stet")
  const bpsc = value.includes("bpsc")
  if (stet && bpsc) return "BOTH"
  if (value.includes("both")) return "BOTH"
  if (bpsc) return "BPSC"
  if (stet) return "STET"
  return null
}
