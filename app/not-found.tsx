import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4">
      <h1 className="font-heading text-3xl">Page not found</h1>
      <Link href="/" className="mt-4 text-primary underline">
        Back to the test series
      </Link>
    </main>
  )
}
