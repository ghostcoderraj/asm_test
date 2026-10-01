export type ActionResult = {
  success: boolean
  message: string
  code: string
}

const messages: Record<string, string> = {
  FORBIDDEN: "You do not have access to this action.",
  FREE_LIMIT_REACHED: "Your free mock tests are completed. Unlock the complete STET & BPSC Music Test Series.",
  PREMIUM_REQUIRED: "Unlock premium to take this test.",
  NOT_ENOUGH_QUESTIONS: "Not enough published questions are available for this test.",
  NO_WEAK_TOPICS: "Complete a mock test first so weak topics can be identified.",
  ATTEMPT_CLOSED: "This attempt has already been submitted.",
  TEST_NOT_FOUND: "That record could not be found.",
  INVALID_INPUT: "Some details are missing or invalid.",
  TOO_MANY_ROWS: "Import up to 2,000 rows at a time.",
  PAYMENT_NOT_FOUND: "That payment could not be found.",
  PAYMENT_NOT_PENDING: "This payment can no longer be verified.",
  ACCOUNT_EXISTS: "An account with this mobile number already exists.",
  LOGIN_FAILED: "Incorrect mobile number or password.",
  PHONE_PROVIDER_DISABLED:
    "Phone sign-in is turned off in Supabase. In Authentication → Providers, enable Phone and turn Confirm phone off. No SMS provider is required.",
  ACCOUNT_DISABLED: "This account is disabled. Contact the college office.",
  PHONE_CONFIRMATION_ENABLED:
    "The account was created, but Supabase still has phone confirmation turned on. Disable Confirm phone so students can sign in without an OTP.",
  PAYMENTS_NOT_CONFIGURED: "Payments are not configured yet.",
  PAYMENT_VERIFY_FAILED: "The payment could not be verified. Premium access was not activated.",
  ALREADY_PREMIUM: "Premium is already active on this account.",
  WRONG_PLAN: "This plan does not match your target exam.",
  UNEXPECTED_ERROR: "Something went wrong. Please try again.",
}

export function fail(code: string, message?: string): ActionResult {
  return {
    success: false,
    code,
    message: message ?? messages[code] ?? messages.UNEXPECTED_ERROR,
  }
}

export function ok(message = "Saved."): ActionResult {
  return { success: true, message, code: "OK" }
}

export function mapDbError(error: { message?: string } | null): ActionResult {
  const raw = error?.message ?? ""
  const code = Object.keys(messages).find((key) => raw.includes(key)) ?? "UNEXPECTED_ERROR"
  return fail(code)
}

export function apiError(code: string, status = 400) {
  return Response.json(fail(code), { status })
}
