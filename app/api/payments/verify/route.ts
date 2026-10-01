import { createClient } from "@/lib/supabase/server"
import { apiError, ok } from "@/lib/errors"
import { activateVerifiedPayment } from "@/lib/payments/razorpay"
import { clientAddress, rateLimit, sameOrigin } from "@/lib/security/guard"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("FORBIDDEN", 403)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("FORBIDDEN", 401)
  if (!rateLimit(`verify:${user.id}:${clientAddress(request.headers)}`, 20, 60 * 60 * 1000)) return apiError("INVALID_INPUT", 429)

  const body = (await request.json().catch(() => null)) as {
    razorpay_order_id?: string
    razorpay_payment_id?: string
    razorpay_signature?: string
  } | null

  if (!body?.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    return apiError("INVALID_INPUT")
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("razorpay_order_id", body.razorpay_order_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!payment) return apiError("PAYMENT_NOT_FOUND", 404)

  try {
    const result = await activateVerifiedPayment({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
      source: "checkout",
    })
    if (!result.ok) return apiError(result.code, 400)
    return Response.json(ok("Premium access is active."))
  } catch {
    return apiError("PAYMENT_VERIFY_FAILED", 400)
  }
}
