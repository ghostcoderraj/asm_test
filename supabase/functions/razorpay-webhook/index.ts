import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

Deno.serve(async (request) => {
  const raw = await request.text()
  const signature = request.headers.get("x-razorpay-signature") ?? ""
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? ""
  const expected = await hmac(raw, secret)
  if (!secret || expected !== signature) {
    return Response.json({ success: false, message: "Invalid webhook signature.", code: "FORBIDDEN" }, { status: 400 })
  }

  const event = JSON.parse(raw)
  const payment = event?.payload?.payment?.entity
  if ((event.event === "payment.captured" || event.event === "order.paid") && payment?.id && payment?.order_id) {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? ""
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? ""
    const lookup = await fetch(`https://api.razorpay.com/v1/payments/${payment.id}`, {
      headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
    })
    const remote = await lookup.json()
    if (!lookup.ok || remote.order_id !== payment.order_id) {
      return Response.json({ success: false, message: "The payment could not be verified.", code: "PAYMENT_VERIFY_FAILED" }, { status: 400 })
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")
    const { error } = await admin.rpc("activate_premium_payment", {
      p_order_id: payment.order_id,
      p_payment_id: payment.id,
      p_signature: signature,
    })
    if (error) return Response.json({ success: false, message: "The payment could not be verified.", code: "PAYMENT_VERIFY_FAILED" }, { status: 400 })
  }

  return Response.json({ success: true, message: "Webhook received.", code: "OK" })
})

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))
  return [...new Uint8Array(signed)].map((item) => item.toString(16).padStart(2, "0")).join("")
}
