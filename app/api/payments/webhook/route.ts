import { apiError } from "@/lib/errors"
import { activateVerifiedPayment, verifyWebhookSignature } from "@/lib/payments/razorpay"

export async function POST(request: Request) {
  const raw = await request.text()
  const signature = request.headers.get("x-razorpay-signature")
  if (!verifyWebhookSignature(raw, signature)) return apiError("FORBIDDEN", 400)

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } }
  try {
    event = JSON.parse(raw)
  } catch {
    return apiError("INVALID_INPUT", 400)
  }

  const payment = event.payload?.payment?.entity
  if ((event.event === "payment.captured" || event.event === "order.paid") && payment?.id && payment.order_id) {
    try {
      await activateVerifiedPayment({
        orderId: payment.order_id,
        paymentId: payment.id,
        signature: signature ?? "webhook",
        source: "webhook",
      })
    } catch {
      return apiError("PAYMENT_VERIFY_FAILED", 400)
    }
  }

  return Response.json({ success: true, message: "Webhook received.", code: "OK" })
}
