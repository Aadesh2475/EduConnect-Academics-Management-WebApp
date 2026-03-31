import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-utils"
import { Sidebar } from "@/components/dashboard/teacher/sidebar"
import { Header } from "@/components/dashboard/teacher/header"
import { DbErrorPage } from "@/components/ui/db-error-page"
import { FeedbackPrompt } from "@/components/dashboard/FeedbackPrompt"

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session
  try {
    session = await getSession()
  } catch {
    // DB connection error (e.g. Neon cold-start) — show retry page instead of
    // redirecting to /auth/login, which would trigger a middleware bounce loop.
    return <DbErrorPage />
  }

  if (!session) {
    redirect("/auth/login")
  }

  // Check if user is a teacher
  if (session.role !== "TEACHER") {
    redirect("/dashboard")
  }

  // Mandatory Onboarding
  if (!session.onboarded) {
    redirect("/onboarding")
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
      <Sidebar user={user} />
      <div className="lg:pl-60">
        <Header user={user} />
        <main className="p-6">
          {children}
        </main>
        <FeedbackPrompt />
      </div>
    </div>
  )
}
