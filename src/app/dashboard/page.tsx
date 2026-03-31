import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-utils"
import { DbErrorPage } from "@/components/ui/db-error-page"

export default async function DashboardPage() {
  let session
  try {
    session = await getSession()
  } catch {
    // DB is temporarily unreachable. Show a retry page instead of redirecting
    // to /auth/login — that would cause middleware to bounce back here (loop).
    return <DbErrorPage />
  }

  if (!session) {
    redirect("/auth/login")
  }

  // Redirect based on user role
  switch (session.role) {
    case "ADMIN":
      redirect("/dashboard/admin")
    case "TEACHER":
      redirect("/dashboard/teacher")
    case "STUDENT":
    default:
      redirect("/dashboard/student")
  }
}
