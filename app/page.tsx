import Link from "next/link"
import { CollegeSeal } from "@/components/brand"
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentProfile } from "@/lib/auth"
import { formatInr } from "@/lib/format"
import { planTargetExam } from "@/lib/plans"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"
import type { Plan } from "@/types/domain"
import { cn } from "cn"

export const dynamic = "force-dynamic"

const features = [
  ["2 free mock tests", "Every new student can attempt two free mock tests. The limit is enforced on the server."],
  ["5,000+ questions", "The bank is built for thousands of music questions, loaded page by page rather than all at once."],
  ["Topic-wise practice", "Practise swar, raga, tala, gharana, history, folk, and the other categories your college adds."],
  ["Detailed analytics", "See score, accuracy, time, and a topic breakdown after every completed test."],
  ["Weak topic detection", "Topics with repeated wrong answers are marked for revision."],
  ["Premium test series", "Unlock the full STET and BPSC Music series after the free tests."],
]

const faqs = [
  ["Is this the college website?", "No. This is a separate mock-test platform. The college site remains at anandsangit.com."],
  ["Do I need an OTP?", "No. Register with your name, mobile number, password, and target exam."],
  ["How many free tests do I get?", "Two free mock tests. After that, premium is required for more mock tests. Practice sets are part of premium."],
  ["Are the topic names an official syllabus weightage?", "No. Topics are study categories. They are not a claim about official exam weightage."],
]

export default async function HomePage() {
  const profile = await getCurrentProfile()
  const plans = await getPlans()

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader signedIn={Boolean(profile)} />
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.3fr_0.7fr] md:py-20">
          <div>
            <p className="text-sm font-medium tracking-wide text-primary uppercase">Anand Sangeet Mahavidyalaya</p>
            <h1 className="mt-3 max-w-xl font-heading text-4xl leading-tight text-balance md:text-6xl">
              Prepare for STET & BPSC Music Exams
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Timed mock tests, topic practice, and a clear view of where to revise. Built for students who will mostly open this on a phone.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href={profile ? "/dashboard/tests" : "/register"} className={cn(buttonVariants(), "min-h-12 px-5 text-base")}>
                Start free mock test
              </Link>
              <Link href="/#series" className={cn(buttonVariants({ variant: "outline" }), "min-h-12 px-5 text-base")}>
                Explore test series
              </Link>
            </div>
          </div>
          <aside className="rounded-2xl border border-border bg-card p-6 text-center">
            <CollegeSeal className="mx-auto size-44" />
            <p className="mt-4 font-heading text-2xl text-primary">Music Test Series</p>
            <ul className="mt-4 grid gap-3 text-sm">
              <li>STET Music</li>
              <li>BPSC Music · Coming soon</li>
              <li>Two free mock tests for every new student</li>
              <li>Score, accuracy, and topic-wise results</li>
            </ul>
          </aside>
        </section>

        <section id="series" className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 md:grid-cols-2">
          <ExamCard title="STET Music" href="/stet-music-mock-test" text="Mock tests and practice for the STET music paper." />
          <ExamCard title="BPSC Music" text="Mock tests and practice are coming soon. Students enrolled for both can use the STET series now." comingSoon />
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, text]) => (
            <article key={title} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading text-xl">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>

        <section id="how" className="mx-auto w-full max-w-6xl px-4 py-8">
          <h2 className="font-heading text-3xl">How it works</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-4">
            {["Create an account with your mobile number", "Choose STET, or both exams. BPSC is coming soon. For STET, choose Paper I, Paper II, or both papers", "Attempt the two free mock tests", "Review weak topics and unlock premium"].map((step, index) => (
              <li key={step} className="rounded-xl bg-muted p-4">
                <span className="font-heading text-2xl text-primary">{index + 1}</span>
                <p className="mt-2 text-sm">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="pricing" className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-2xl">Free</h2>
            <p className="mt-2 font-heading text-4xl">2 mock tests</p>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <li>Server-enforced free test limit</li>
              <li>Score and topic breakdown on those attempts</li>
            </ul>
          </article>
          {plans.length === 0 ? (
            <article className="rounded-2xl border border-primary/30 bg-card p-6 sm:col-span-1 xl:col-span-3">
              <h2 className="font-heading text-2xl">Premium</h2>
              <p className="mt-3 text-sm text-muted-foreground">The college has not published a price yet. It will appear here from the subscription plan, not from the page code.</p>
            </article>
          ) : (
            plans.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-primary/30 bg-card p-6">
                <h2 className="font-heading text-2xl">{plan.name}</h2>
                <p className="mt-2 font-heading text-4xl">{formatInr(plan.price, plan.currency)}</p>
                <p className="text-sm text-muted-foreground">{plan.duration_days} days</p>
                {planTargetExam(plan.name) === "BPSC" ? <p className="mt-2 text-sm">Coming soon. STET mock tests and practice are open now.</p> : null}
                {planTargetExam(plan.name) === "BOTH" ? <p className="mt-2 text-sm">STET mock tests and practice are open now. BPSC is coming soon.</p> : null}
                {plan.description ? <p className="mt-2 text-sm">{plan.description}</p> : null}
                <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  {(plan.features ?? ["All mock tests", "Topic practice", "Detailed analytics", "Weak topic recommendations", "Personalized practice", "Test history"]).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </section>

        <section id="faq" className="mx-auto w-full max-w-6xl px-4 py-8">
          <h2 className="font-heading text-3xl">FAQ</h2>
          <div className="mt-4 grid gap-3">
            {faqs.map(([question, answer]) => (
              <details key={question} className="rounded-xl border border-border bg-card p-4">
                <summary className="cursor-pointer font-medium">{question}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="support" className="mx-auto w-full max-w-6xl px-4 py-10">
          <h2 className="font-heading text-3xl">Support</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            After you sign in, raise a query from the dashboard. For account recovery without SMS OTP, contact the college office. Write to{" "}
            <a className="text-primary underline" href="mailto:anandsangitmahavidyalaya@gmail.com">anandsangitmahavidyalaya@gmail.com</a>.
            If you have paid and the course is still locked, call{" "}
            <a className="text-primary underline" href="tel:+91915327692">+91 915327692</a>.
          </p>
          <a className="mt-3 inline-block text-sm text-primary underline" href="https://www.anandsangit.com/" target="_blank" rel="noreferrer">
            Visit www.anandsangit.com
          </a>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}

function ExamCard({ title, href, text, comingSoon = false }: { title: string; href?: string; text: string; comingSoon?: boolean }) {
  return (
    <article className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground">
      <h2 className="font-heading text-3xl">{title}</h2>
      {comingSoon ? <p className="mt-2 text-sm font-medium">Coming soon</p> : null}
      <p className="mt-2 text-sm text-primary-foreground/80">{text}</p>
      {href ? (
        <Link href={href} className="mt-4 inline-block text-sm underline">
          Read more
        </Link>
      ) : null}
    </article>
  )
}

async function getPlans(): Promise<Plan[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("subscription_plans")
      .select("id, name, description, price, currency, duration_days, features")
      .eq("is_active", true)
      .order("price")
    return (data ?? []) as Plan[]
  } catch {
    return []
  }
}
