"use client"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4">
      <h1 className="font-heading text-3xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">Please try again. If this keeps happening, raise a query after you sign in.</p>
      <button type="button" className="mt-6 min-h-11 rounded-lg bg-primary px-4 text-primary-foreground" onClick={() => reset()}>
        Try again
      </button>
    </main>
  )
}
