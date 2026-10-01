import type { Metadata } from "next"
import Link from "next/link"
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome"

export const metadata: Metadata = {
  title: "STET Music Mock Test",
  description: "STET Music mock tests with a timer, topic analytics, and two free attempts from Anand Sangeet Mahavidyalaya.",
}

export default function Page() {
  return <Landing title="STET Music Mock Test" exam="STET Music" practiceHref="/stet-music-practice" />
}

export function Landing({ title, exam, practiceHref }: { title: string; exam: string; practiceHref: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="text-sm text-primary">Anand Sangeet Music Test Series</p>
        <h1 className="mt-2 font-heading text-4xl">{title}</h1>
        <p className="mt-4 text-muted-foreground">
          Practise {exam} with timed mock tests, four-option questions, and a result page that separates score from accuracy. Topic names are study categories, not an official weightage chart.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-primary-foreground">
            Start free mock test
          </Link>
          <Link href={practiceHref} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4">
            Practice
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
