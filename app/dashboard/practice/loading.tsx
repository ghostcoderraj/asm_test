export default function PracticeLoading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading questions">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
