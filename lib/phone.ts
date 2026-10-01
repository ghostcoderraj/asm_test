const LOCAL_MOBILE = /^[6-9]\d{9}$/

export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, "")
  if (LOCAL_MOBILE.test(digits)) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith("91") && LOCAL_MOBILE.test(digits.slice(2))) {
    return `+${digits}`
  }
  return null
}

export function formatMobile(value: string): string {
  const digits = value.replace(/\D/g, "")
  const local = digits.slice(-10)
  if (local.length !== 10) return value
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
}
