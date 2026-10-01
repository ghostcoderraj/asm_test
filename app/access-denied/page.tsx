import Link from "next/link"

export default function AccessDeniedPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4">
      <p className="text-sm text-primary">403</p>
      <h1 className="mt-2 font-heading text-4xl">Access denied</h1>
      <p className="mt-3 text-muted-foreground">This area is only for college staff. Students can continue from the dashboard.</p>
      <Link href="/dashboard" className="mt-6 text-primary underline">
        Go to dashboard
      </Link>
    </main>
  )
}
