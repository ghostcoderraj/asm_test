import { requireAdmin } from "@/lib/auth"
import { formatDate, formatInr } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export default async function PaymentsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from("payments").select("id, amount, currency, status, razorpay_order_id, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(100)
  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Payments</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Order</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((payment) => {
              const profile = payment.profiles as { full_name?: string } | { full_name?: string }[] | null
              const name = Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name
              return (
                <tr key={payment.id} className="border-t border-border">
                  <td className="p-3">{name}</td>
                  <td className="p-3">{formatInr(payment.amount, payment.currency)}</td>
                  <td className="p-3">{payment.status}</td>
                  <td className="p-3">{payment.razorpay_order_id}</td>
                  <td className="p-3">{formatDate(payment.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
