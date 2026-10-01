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

  const url = Deno.env.get("SUPABASE_URL") ?? ""
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? ""
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? ""
  if (!keyId || !keySecret) return json("PAYMENTS_NOT_CONFIGURED", 503, cors)

  const userClient = createClient(url, anon, { global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } } })
  const { data: auth } = await userClient.auth.getUser()
  if (!auth.user) return json("FORBIDDEN", 401, cors)

  const body = await request.json().catch(() => null)
  const planId = body?.planId
  const { data: plan } = await userClient.from("subscription_plans").select("id, name, price, currency").eq("id", planId).eq("is_active", true).maybeSingle()
  if (!plan) return json("TEST_NOT_FOUND", 404, cors)
  const { data: profile } = await userClient.from("profiles").select("target_exam").eq("id", auth.user.id).maybeSingle()
  if (!profile || planTargetExam(plan.name) !== profile.target_exam) return json("WRONG_PLAN", 400, cors)

  const amount = Math.round(Number(plan.price) * 100)
  const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency: "INR", receipt: `asm${Date.now()}`.slice(0, 40), notes: { user_id: auth.user.id, plan_id: plan.id } }),
  })
  if (!orderResponse.ok) return json("UNEXPECTED_ERROR", 500, cors)
  const order = await orderResponse.json()

  const admin = createClient(url, service)
  const { data: subscription } = await admin.from("subscriptions").insert({ user_id: auth.user.id, plan_id: plan.id, status: "PENDING" }).select("id").single()
  if (!subscription) return json("UNEXPECTED_ERROR", 500, cors)
  await admin.from("payments").insert({
    user_id: auth.user.id,
    subscription_id: subscription.id,
    razorpay_order_id: order.id,
    amount: plan.price,
    currency: plan.currency,
    status: "CREATED",
  })

  return Response.json({ success: true, message: "Order created.", code: "OK", keyId, amount: order.amount, currency: order.currency, orderId: order.id, planName: plan.name }, { headers: cors })
})

function planTargetExam(name: string) {
  const value = name.toLowerCase()
  const stet = value.includes("stet")
  const bpsc = value.includes("bpsc")
  if (stet && bpsc) return "BOTH"
  if (value.includes("both")) return "BOTH"
  if (bpsc) return "BPSC"
  if (stet) return "STET"
  return null
}

function json(code: string, status: number, cors: Record<string, string>) {
  return Response.json({ success: false, message: "Unable to create the order.", code }, { status, headers: cors })
}
