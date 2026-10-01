import { AppShell } from "@/components/layout/app-shell"
import { requireUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/tests", label: "Tests" },
  { href: "/dashboard/practice", label: "Practice" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/premium", label: "Premium" },
  { href: "/dashboard/support", label: "Support" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/profile", label: "Profile" },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser()
  const nav = profile.role === "STUDENT" ? links : [...links, { href: "/admin/dashboard", label: "Admin" }]
  return (
    <AppShell title={profile.full_name} links={nav}>
      {children}
    </AppShell>
  )
}
