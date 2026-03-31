import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-utils"
import { Sidebar } from "@/components/dashboard/parent/sidebar"
import { Header } from "@/components/dashboard/parent/header"
import { DbErrorPage } from "@/components/ui/db-error-page"

export default async function ParentDashboardLayout({
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

    if (session.role !== "PARENT") {
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
            <Sidebar user={user} />
            <div className="lg:pl-60">
                <Header user={user} />
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
