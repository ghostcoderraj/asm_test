"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { BrandMark } from "@/components/brand"
import { LogoutButton, SiteCredit } from "@/components/layout/public-chrome"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "cn"

export function AppShell({
  title,
  links,
  children,
}: {
  title: string
  links: { href: string; label: string }[]
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const nav = (
    <nav className="grid gap-1">
      {links.map((link) => {
        const active = pathname === link.href || (link.href !== "/dashboard" && link.href !== "/admin/dashboard" && pathname.startsWith(link.href))
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "min-h-11 rounded-lg px-3 py-2 text-sm",
              active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid w-full max-w-7xl md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-border bg-card px-4 py-5 md:block">
          <BrandMark compact />
          <p className="mt-6 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
          {nav}
          <div className="mt-6">
            <LogoutButton />
          </div>
        </aside>
        <div>
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-3 md:hidden">
            <BrandMark compact sealClassName="size-11" />
            <Sheet>
              <SheetTrigger render={<Button variant="outline" size="icon" className="size-11" aria-label="Open menu" />}>
                <Menu />
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100%,20rem)]">
                <SheetHeader>
                  <SheetTitle>{title}</SheetTitle>
                </SheetHeader>
                {nav}
                <div className="mt-4 px-4">
                  <LogoutButton />
                </div>
              </SheetContent>
            </Sheet>
          </header>
          <main className="px-4 py-6 md:px-8">{children}</main>
          <SiteCredit />
        </div>
      </div>
    </div>
  )
}
