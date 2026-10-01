import type { Metadata } from "next"
import Link from "next/link"
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome"
import { LoginForm } from "@/components/auth/forms"
import { safeNext } from "@/lib/validators"

export const metadata: Metadata = { title: "Login" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams
  const next = safeNext(params.next)
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <h1 className="font-heading text-3xl">Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use the mobile number and password from registration. No OTP is sent.</p>
        {params.error === "config" ? <p className="mt-3 text-sm text-destructive">Add the Supabase URL and anon key to .env.local.</p> : null}
        {params.error === "disabled" ? <p className="mt-3 text-sm text-destructive">This account is disabled. Contact the college office.</p> : null}
        <div className="mt-6">
          <LoginForm next={next ?? undefined} />
        </div>
        <p className="mt-4 text-sm">
          New student? <Link href="/register" className="text-primary underline">Create an account</Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  )
}
