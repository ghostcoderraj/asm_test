import type { Metadata } from "next"
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome"

export const metadata: Metadata = { title: "Forgot password" }

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <h1 className="font-heading text-3xl">Forgot password?</h1>
        <p className="mt-4 text-muted-foreground">
          If you still know the current password, sign in and change it from Profile. This platform does not send an SMS OTP. If you have forgotten the password, the college office or an administrator can set a new one without viewing the old one.
        </p>
        <p className="mt-3 text-sm">
          Include your registered mobile number when you contact{" "}
          <a className="text-primary underline" href="https://www.anandsangit.com/" target="_blank" rel="noreferrer">
            Anand Sangeet Mahavidyalaya
          </a>
          .
        </p>
      </main>
      <PublicFooter />
    </div>
  )
}
