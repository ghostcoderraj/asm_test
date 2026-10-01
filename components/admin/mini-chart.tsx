"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function MiniChart({
  data,
  xKey,
  yKey,
}: {
  data: Record<string, string | number>[]
  xKey: string
  yKey: string
}) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No data yet.</p>
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} interval={0} angle={-25} height={48} />
          <YAxis allowDecimals={false} width={36} />
          <Tooltip />
          <Bar dataKey={yKey} fill="var(--color-primary)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
