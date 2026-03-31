import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-utils"
import { AdminSidebar } from "@/components/dashboard/admin/sidebar"
import { AdminHeader } from "@/components/dashboard/admin/header"
import { DbErrorPage } from "@/components/ui/db-error-page"

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session
  try {
    session = await getSession()
  } catch {
    return <DbErrorPage />
  }

  if (!session) {
    redirect("/auth/login")
  }

  // Check if user is an admin
  if (session.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const user = {
    id: session.id,
    name: session.name,
    email: session.email,
    image: session.image,
    role: session.role,
    theme: session.theme,
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar user={user} />
      <div className="lg:pl-60">
        <AdminHeader user={user} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
