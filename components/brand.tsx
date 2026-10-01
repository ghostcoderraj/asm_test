import Link from "next/link"
import { cn } from "cn"

export function CollegeSeal({ className }: { className?: string }) {
  return (
    <img
      src="/brand-seal.png"
      alt=""
      width={249}
      height={249}
      className={cn("block shrink-0 object-contain", className)}
    />
  )
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      <CollegeSeal className="size-16" />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-heading text-sm font-semibold tracking-wide text-primary">
          Anand Sangeet Mahavidyalaya
        </span>
        {compact ? null : (
          <span className="block truncate text-xs text-muted-foreground">Music Test Series</span>
        )}
      </span>
    </Link>
  )
}
