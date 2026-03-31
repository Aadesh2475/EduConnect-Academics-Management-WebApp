import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-utils"
import { Sidebar } from "@/components/dashboard/student/sidebar"
import { Header } from "@/components/dashboard/student/header"
import { DbErrorPage } from "@/components/ui/db-error-page"
import { FeedbackPrompt } from "@/components/dashboard/FeedbackPrompt"

export default async function StudentDashboardLayout({
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

  // Check if user is a student
  if (session.role !== "STUDENT") {
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
