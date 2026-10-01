import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

function corsFor(request: Request) {
  const allowed = (Deno.env.get("APP_ORIGIN") ?? "").split(",").map((item) => item.trim()).filter(Boolean)
  const origin = request.headers.get("origin") ?? ""
  const allow = allowed.includes(origin) ? origin : "null"
  return {
    "Access-Control-Allow-Origin": allow,
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
}

Deno.serve(async (request) => {
  const cors = corsFor(request)
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  const body = await request.json().catch(() => null)
  const orderId = body?.razorpay_order_id
  const paymentId = body?.razorpay_payment_id
  const signature = body?.razorpay_signature
  if (!orderId || !paymentId || !signature) {
    return Response.json({ success: false, message: "Payment details are missing.", code: "INVALID_INPUT" }, { status: 400, headers: cors })
  }

  const secret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? ""
  const expected = await hmac(`${orderId}|${paymentId}`, secret)
  if (expected !== signature) {
    return Response.json({ success: false, message: "The payment could not be verified.", code: "PAYMENT_VERIFY_FAILED" }, { status: 400, headers: cors })
  }

  const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? ""
  const lookup = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${btoa(`${keyId}:${secret}`)}` },
  })
  if (!lookup.ok) {
    return Response.json({ success: false, message: "The payment could not be verified.", code: "PAYMENT_VERIFY_FAILED" }, { status: 400, headers: cors })
  }
  const payment = await lookup.json()
  if (payment.order_id !== orderId || !["captured", "authorized"].includes(payment.status)) {
    return Response.json({ success: false, message: "The payment could not be verified.", code: "PAYMENT_VERIFY_FAILED" }, { status: 400, headers: cors })
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")
  const { error } = await admin.rpc("activate_premium_payment", {
    p_order_id: orderId,
    p_payment_id: paymentId,
    p_signature: signature,
  })
  if (error) {
    return Response.json({ success: false, message: "The payment could not be verified.", code: "PAYMENT_VERIFY_FAILED" }, { status: 400, headers: cors })
  }
  return Response.json({ success: true, message: "Premium access is active.", code: "OK" }, { headers: cors })
})

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))
  return [...new Uint8Array(signed)].map((item) => item.toString(16).padStart(2, "0")).join("")
}
