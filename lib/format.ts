export function formatInr(amount: number | string, currency = "INR") {
  const value = typeof amount === "string" ? Number(amount) : amount
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return "—"
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}m ${rest.toString().padStart(2, "0")}s`
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, seconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const rest = safe % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`
  }
  return `${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`
}

export function examLabel(exam: string) {
  if (exam === "STET") return "STET Music"
  if (exam === "BPSC") return "BPSC Music"
  if (exam === "BOTH") return "STET & BPSC"
  return exam
}
