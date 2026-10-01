"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

export function SubmitButton({ children, variant = "default", disabled = false }: { children: React.ReactNode; variant?: "default" | "outline" | "secondary"; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} className="min-h-11 px-4 text-base" disabled={pending || disabled}>
      {pending ? "Please wait…" : children}
    </Button>
  )
}

export const controlClass =
  "h-11 min-h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
