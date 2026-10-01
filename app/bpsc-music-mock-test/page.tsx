import type { Metadata } from "next"
import Link from "next/link"
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome"

export const metadata: Metadata = {
  title: "BPSC Music Mock Test",
  description: "BPSC Music mock tests are coming soon from Anand Sangeet Mahavidyalaya.",
}

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="text-sm font-medium text-primary">Coming soon</p>
        <h1 className="mt-2 font-heading text-4xl">BPSC Music Mock Test</h1>
        <p className="mt-4 text-muted-foreground">
          BPSC Music mock tests are not open yet. The current series is STET Music. Students enrolled for both exams can take the STET mock tests and practice now.
        </p>
        <Link href="/stet-music-mock-test" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-primary-foreground">
          Open STET Music
        </Link>
      </main>
      <PublicFooter />
    </div>
  )
}
