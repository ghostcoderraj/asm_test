import "server-only"
import { createHmac, timingSafeEqual } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { isRazorpayId } from "@/lib/security/guard"

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

function authHeader() {
  const token = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")
  return `Basic ${token}`
}

export async function createRazorpayOrder(input: { amountPaise: number; receipt: string; notes: Record<string, string> }) {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    }),
  })
  if (!response.ok) throw new Error("ORDER_FAILED")
  return (await response.json()) as { id: string; amount: number; currency: string }
}

export async function fetchRazorpayPayment(paymentId: string) {
  if (!isRazorpayId(paymentId, "pay")) throw new Error("PAYMENT_LOOKUP_FAILED")
  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  })
  if (!response.ok) throw new Error("PAYMENT_LOOKUP_FAILED")
  return (await response.json()) as { id: string; order_id: string; status: string; amount: number; currency: string }
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return false
  return safeEqual(createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"), signature)
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  return safeEqual(createHmac("sha256", secret).update(rawBody).digest("hex"), signature)
}

function safeEqual(expected: string, actual: string) {
  const left = Buffer.from(expected)
  const right = Buffer.from(actual)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export async function activateVerifiedPayment(input: {
  orderId: string
  paymentId: string
  signature: string
  source: "checkout" | "webhook"
}) {
  if (!isRazorpayId(input.orderId, "order") || !isRazorpayId(input.paymentId, "pay")) {
    return { ok: false as const, code: "PAYMENT_VERIFY_FAILED" }
  }
  const payment = await fetchRazorpayPayment(input.paymentId)
  if (payment.order_id !== input.orderId) return { ok: false as const, code: "PAYMENT_VERIFY_FAILED" }
  if (!["captured", "authorized"].includes(payment.status)) return { ok: false as const, code: "PAYMENT_VERIFY_FAILED" }

  const admin = createAdminClient()
  const { data: row } = await admin
    .from("payments")
    .select("amount, currency, status")
    .eq("razorpay_order_id", input.orderId)
    .maybeSingle()
  if (!row) return { ok: false as const, code: "PAYMENT_NOT_FOUND" }
  if (Math.round(Number(row.amount) * 100) !== payment.amount || row.currency !== payment.currency) {
    return { ok: false as const, code: "PAYMENT_VERIFY_FAILED" }
  }
  if (input.source === "checkout" && !verifyPaymentSignature(input.orderId, input.paymentId, input.signature)) {
    return { ok: false as const, code: "PAYMENT_VERIFY_FAILED" }
  }
  if (payment.status === "authorized") {
    const captured = await fetch(`https://api.razorpay.com/v1/payments/${payment.id}/capture`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ amount: payment.amount, currency: payment.currency }),
    })
    if (!captured.ok) return { ok: false as const, code: "PAYMENT_VERIFY_FAILED" }
  }

  const { error } = await admin.rpc("activate_premium_payment", {
    p_order_id: input.orderId,
    p_payment_id: input.paymentId,
    p_signature: input.signature,
  })
  if (error) return { ok: false as const, code: "PAYMENT_VERIFY_FAILED" }
  return { ok: true as const }
}
