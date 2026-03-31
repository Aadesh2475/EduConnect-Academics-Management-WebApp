"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Activity,
  FileText,
  Bell,
  Database,
  Cog
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"
import { cn, getInitials } from "@/lib/utils"

interface AdminSidebarProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

const navigation = [
  { name: "Dashboard", href: "/dashboard/admin", icon: Home },
  { name: "Students", href: "/dashboard/admin/students", icon: GraduationCap },
  { name: "Teachers", href: "/dashboard/admin/teachers", icon: Users },
  { name: "Classes", href: "/dashboard/admin/classes", icon: BookOpen },
  { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  { name: "Reports", href: "/dashboard/admin/reports", icon: FileText },
  { name: "Activity Logs", href: "/dashboard/admin/logs", icon: Activity },
  { name: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
  { name: "Database", href: "/dashboard/admin/database", icon: Database },
  { name: "System Settings", href: "/dashboard/admin/settings", icon: Cog },
]

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
      <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-[#1C1C1C] bg-[#121212] px-4 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-1">
          <Link href="/dashboard/admin" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#1C1C1C] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#00E599]" />
            </div>
            <div>
              <span className="text-lg font-bold text-white leading-none">EduConnect</span>
              <p className="text-[10px] text-[#B5B5B5] font-semibold leading-none mt-0.5">Admin Panel</p>
            </div>
          </Link>
        </div>



        {/* Navigation */}
        <nav className="flex flex-1 flex-col px-1">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex h-10 items-center gap-3 rounded-md pl-4 text-[14px] font-medium transition-all duration-200 ease-in border-l-[3px] border-transparent",
                      isActive
                        ? "bg-[rgba(0,229,153,0.12)] text-white shadow-[0_0_8px_rgba(0,229,153,0.45)] !border-[#00e599]"
                        : "text-[#D4D4D4] hover:bg-[rgba(0,229,153,0.08)] hover:text-white hover:shadow-[0_0_6px_rgba(0,229,153,0.35)]"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-[#7A7A7A] group-hover:text-white"
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Logout Button */}
          <div className="mt-auto pt-4 border-t border-[#1C1C1C] mx-1">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#7A7A7A] hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
