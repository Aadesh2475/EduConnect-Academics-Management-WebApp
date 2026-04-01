"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home, User, BookOpen, Users, FileText, HelpCircle,
  Calendar, CalendarDays, MessageSquare, CheckSquare,
  ClipboardList, GraduationCap, Settings, HelpCircleIcon,
  LogOut, Library, BarChart3, ChevronRight, Bot, AlertTriangle, Award
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { signOut } from "@/lib/auth-client"
import { cn, getInitials } from "@/lib/utils"

interface SidebarProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

const mainNavigation = [
  { name: "Home", href: "/dashboard/student", icon: Home },
  { name: "Profile", href: "/dashboard/student/profile", icon: User },
  { name: "Enrolled Classes", href: "/dashboard/student/classes", icon: BookOpen },
  { name: "Tutors", href: "/dashboard/student/tutors", icon: Users },
  { name: "Messages", href: "/dashboard/student/messages", icon: MessageSquare },
  { name: "AI Assistant", href: "/dashboard/student/ai-assistant", icon: Bot },
]

const academicNavigation = [
  { name: "Assignments", href: "/dashboard/student/assignments", icon: FileText },
  { name: "Attendance", href: "/dashboard/student/attendance", icon: CheckSquare },
  { name: "Exams", href: "/dashboard/student/exams", icon: BarChart3 },
  { name: "Academic Details", href: "/dashboard/student/academics", icon: GraduationCap },
  { name: "Library", href: "/dashboard/student/library", icon: Library },
  { name: "Task Lists", href: "/dashboard/student/tasks", icon: ClipboardList },
  { name: "Certificates", href: "/dashboard/student/certificates", icon: Award },
  { name: "Calendar", href: "/dashboard/student/calendar", icon: Calendar },
  { name: "My Reports", href: "/dashboard/student/issues", icon: AlertTriangle },
]

const settingsNavigation = [
  { name: "Settings", href: "/dashboard/student/settings", icon: Settings },
  { name: "Help & Support", href: "/dashboard/student/help", icon: HelpCircleIcon },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/"
  }

  const NavItem = ({ item }: { item: { name: string; href: string; icon: React.ElementType } }) => {
    const isActive = pathname === item.href
    return (
      <Link
        href={item.href}
        className={cn(
          "group relative flex h-10 items-center gap-3 rounded-md pl-4 text-[14px] font-medium transition-all duration-200 ease-in border-l-[3px] border-transparent",
          isActive
            ? "bg-white/8 text-white border-white"
            : "text-[#D4D4D4] hover:bg-white/5 hover:text-white"
        )}
      >
        <item.icon
          className={cn(
            "shrink-0 transition-colors",
            isActive ? "text-white" : "text-[#7A7A7A] group-hover:text-white"
          )}
          size={16}
        />
        <span className="flex-1 truncate">{item.name}</span>
      </Link>
    )
  }

  const NavSection = ({ title, items }: { title?: string; items: typeof mainNavigation }) => (
    <div className="space-y-0.5">
      {title && (
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 select-none">
          {title}
        </p>
      )}
      {items.map((item) => <NavItem key={item.href} item={item} />)}
    </div>
  )

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
      <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-[#1C1C1C] bg-[#121212] px-4 pb-4">

        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-1">
          <Link href="/dashboard/student" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#1C1C1C] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white leading-none">EduConnect</span>
              <p className="text-[10px] text-[#B5B5B5] font-semibold leading-none mt-0.5">Student Portal</p>
            </div>
          </Link>
        </div>



        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-y-5 overflow-y-auto px-1">
          <NavSection title="Main Menu" items={mainNavigation} />
          <NavSection title="Academics" items={academicNavigation} />
          <NavSection items={settingsNavigation} />
        </nav>

        {/* Logout */}
        <div className="mx-1 border-t border-[#1C1C1C] pt-4 mt-auto">
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#7A7A7A] hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200"
          >
            <LogOut size={20} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
