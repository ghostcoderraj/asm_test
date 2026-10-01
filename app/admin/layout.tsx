import { AppShell } from "@/components/layout/app-shell"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/questions/import", label: "Import" },
  { href: "/admin/topics", label: "Topics" },
  { href: "/admin/tests", label: "Tests" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/dashboard", label: "Student view" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin()
  return (
    <AppShell title={profile.role === "SUPER_ADMIN" ? "Super admin" : "Admin"} links={links}>
      {children}
    </AppShell>
  )
}
