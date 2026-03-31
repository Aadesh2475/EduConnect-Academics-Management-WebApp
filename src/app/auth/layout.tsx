import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - EduConnect",
  description: "Sign in or create an account to access EduConnect",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen gradient-bg">
      {children}
    </div>
  )
}
