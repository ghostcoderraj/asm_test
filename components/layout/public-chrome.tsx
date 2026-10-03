import Link from "next/link"
import { BrandMark, CollegeSeal } from "@/components/brand"
import { logoutAction } from "@/lib/actions/auth"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

const links = [
  ["Tests", "/#series"],
  ["How it works", "/#how"],
  ["Pricing", "/#pricing"],
  ["FAQ", "/#faq"],
]

export function PublicHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="border-b border-border/80 bg-card/90 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <BrandMark sealClassName="size-12" />
        <nav className="hidden items-center gap-5 text-sm md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-muted-foreground hover:text-foreground">
              {label}
            </Link>
          ))}
        </nav>
        <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
          {signedIn ? (
            <Link href="/dashboard" className={cn(buttonVariants(), "col-span-2 min-h-11 w-full justify-center px-4 md:col-span-1 md:w-auto")}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 w-full justify-center px-3")}>
                Login
              </Link>
              <Link href="/register" className={cn(buttonVariants(), "min-h-11 w-full justify-center px-4")}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border px-3 text-sm">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <CollegeSeal className="size-14" />
            <p className="font-heading text-lg text-primary">Anand Sangeet Mahavidyalaya</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            A separate preparation platform for STET Music and BPSC Music. The college website stays at its own address.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Exams</p>
          <div className="mt-2 grid gap-1 text-muted-foreground">
            <Link href="/stet-music-mock-test">STET Music mock test</Link>
            <span>BPSC Music mock test · Coming soon</span>
            <Link href="/stet-music-practice">STET Music practice</Link>
            <span>BPSC Music practice · Coming soon</span>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-medium">Support</p>
          <div className="mt-2 grid gap-1 text-muted-foreground">
            <Link href="/register">Create an account</Link>
            <Link href="/forgot-password">Forgot password</Link>
            <a href="https://www.anandsangit.com/" target="_blank" rel="noreferrer">
              College website
            </a>
            <a href="mailto:anandsangitmahavidyalaya@gmail.com">anandsangitmahavidyalaya@gmail.com</a>
            <a href="tel:+91915327692">Payment not unlocked: +91 915327692</a>
          </div>
        </div>
      </div>
      <SiteCredit />
    </footer>
  )
}

export function SiteCredit() {
  return (
    <div className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-1 px-4 py-4 text-center text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
        <p>
          © {new Date().getFullYear()}{" "}
          <a href="https://www.upgradexagency.in" target="_blank" rel="noreferrer" className="underline">
            Upgradex Agency
          </a>
        </p>
        <p>
          Built by{" "}
          <a href="https://www.rajaditya.online" target="_blank" rel="noreferrer" className="underline">
            Aditya Raj
          </a>
        </p>
      </div>
    </div>
  )
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" className="min-h-11 w-full">
        Logout
      </Button>
    </form>
  )
}
