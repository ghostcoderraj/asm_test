import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { apiError } from "@/lib/errors"
import { planTargetExam } from "@/lib/plans"
import { createRazorpayOrder, razorpayConfigured } from "@/lib/payments/razorpay"
import { clientAddress, rateLimit, sameOrigin } from "@/lib/security/guard"
import { isUuid } from "@/lib/validators"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("FORBIDDEN", 403)
  if (!razorpayConfigured()) return apiError("PAYMENTS_NOT_CONFIGURED", 503)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("FORBIDDEN", 401)
  if (!rateLimit(`order:${user.id}:${clientAddress(request.headers)}`, 10, 60 * 60 * 1000)) return apiError("INVALID_INPUT", 429)

  const body = (await request.json().catch(() => null)) as { planId?: string } | null
  if (!isUuid(body?.planId)) return apiError("INVALID_INPUT")

  const { data: premium } = await supabase.rpc("has_active_premium")
  if (premium) return apiError("ALREADY_PREMIUM")

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id, name, price, currency")
    .eq("id", body.planId)
    .eq("is_active", true)
    .maybeSingle()
  if (!plan) return apiError("TEST_NOT_FOUND", 404)

  const { data: profile } = await supabase.from("profiles").select("target_exam").eq("id", user.id).maybeSingle()
  if (!profile || planTargetExam(plan.name) !== profile.target_exam) return apiError("WRONG_PLAN")

  try {
    const order = await createRazorpayOrder({
      amountPaise: Math.round(Number(plan.price) * 100),
      receipt: `asm${Date.now()}`,
      notes: { user_id: user.id, plan_id: plan.id },
    })
    const admin = createAdminClient()
    const { data: subscription, error: subscriptionError } = await admin
      .from("subscriptions")
      .insert({ user_id: user.id, plan_id: plan.id, status: "PENDING" })
      .select("id")
      .single()
    if (subscriptionError || !subscription) return apiError("UNEXPECTED_ERROR", 500)

    const { error: paymentError } = await admin.from("payments").insert({
      user_id: user.id,
      subscription_id: subscription.id,
      razorpay_order_id: order.id,
      amount: plan.price,
      currency: plan.currency,
      status: "CREATED",
    })
    if (paymentError) {
      await admin.from("subscriptions").delete().eq("id", subscription.id)
      return apiError("UNEXPECTED_ERROR", 500)
    }

    return Response.json({
      success: true,
      message: "Order created.",
      code: "OK",
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      orderId: order.id,
      planName: plan.name,
    })
  } catch {
    return apiError("UNEXPECTED_ERROR", 500)
  }
}
