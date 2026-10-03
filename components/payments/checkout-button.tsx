"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type CheckoutResponse = {
  success: boolean
  message?: string
  keyId?: string
  amount?: number
  currency?: string
  orderId?: string
  planName?: string
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export function CheckoutButton({ planId, label }: { planId: string; label: string }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function pay() {
    setPending(true)
    setMessage(null)
    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const payload = (await response.json().catch(() => null)) as CheckoutResponse | null
      if (!response.ok || !payload?.success || !payload.keyId || !payload.orderId) {
        setMessage(payload?.message ?? "Unable to start the payment.")
        setPending(false)
        return
      }

      await loadCheckout()
      if (!window.Razorpay) {
        setMessage("Razorpay checkout could not be loaded.")
        setPending(false)
        return
      }

      const checkout = new window.Razorpay({
        key: payload.keyId,
        amount: payload.amount,
        currency: payload.currency,
        order_id: payload.orderId,
        name: "Anand Sangeet Mahavidyalaya",
        description: payload.planName,
        theme: { color: "#6E1E2A" },
        modal: { ondismiss: () => setPending(false) },
        handler: async (result: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verified = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(result),
            })
            const outcome = (await verified.json().catch(() => null)) as CheckoutResponse | null
            if (verified.ok && outcome?.success) {
              // Full navigation so the server reads the new subscription.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign("/dashboard/premium?paid=1")
              return
            }
            setMessage(outcome?.message ?? "Payment was not verified. Premium access was not activated.")
          } catch {
            setMessage("Payment was received, but confirmation did not finish. If mock tests stay locked, contact support.")
          }
          setPending(false)
        },
      })
      checkout.open()
    } catch {
      setMessage("The payment could not be started. Check your connection and try again.")
      setPending(false)
    }
  }

  return (
    <div className="grid gap-2">
      <Button type="button" className="min-h-11 text-base" onClick={() => void pay()} disabled={pending}>
        {pending ? "Opening checkout…" : label}
      </Button>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  )
}

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("checkout"))
    document.body.appendChild(script)
  })
}
