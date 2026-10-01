import type { Metadata } from "next"
import Link from "next/link"
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome"
import { RegisterForm } from "@/components/auth/forms"

export const metadata: Metadata = { title: "Create your account" }

export default function RegisterPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <h1 className="font-heading text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Full name, mobile number, password, and target exam. Every new account is a student.</p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-4 text-sm">
          Already registered? <Link href="/login" className="text-primary underline">Login</Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  )
}
