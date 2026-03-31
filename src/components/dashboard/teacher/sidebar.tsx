"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home, User, BookOpen, BarChart3, MessageSquare, Users,
  GraduationCap, Calendar, CheckSquare, ClipboardList,
  Library, FileText, Settings, HelpCircle, LogOut,
  Megaphone, UserPlus, Inbox, Bot, AlertTriangle
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  { name: "Home", href: "/dashboard/teacher", icon: Home },
  { name: "Profile", href: "/dashboard/teacher/profile", icon: User },
  { name: "Sessions/Classes", href: "/dashboard/teacher/classes", icon: BookOpen },
  { name: "Analytics", href: "/dashboard/teacher/analytics", icon: BarChart3 },
  { name: "Messages", href: "/dashboard/teacher/messages", icon: MessageSquare },
  { name: "AI Assistant", href: "/dashboard/teacher/ai-assistant", icon: Bot },
]

const academicNavigation = [
  { name: "Registrations", href: "/dashboard/teacher/registrations", icon: UserPlus },
  { name: "Classes", href: "/dashboard/teacher/classes/manage", icon: GraduationCap },
  { name: "Students", href: "/dashboard/teacher/students", icon: Users },
  { name: "Calendar", href: "/dashboard/teacher/calendar", icon: Calendar },
  { name: "Attendance", href: "/dashboard/teacher/attendance", icon: CheckSquare },
  { name: "Announcements", href: "/dashboard/teacher/announcements", icon: Megaphone },
  { name: "Task Manager", href: "/dashboard/teacher/tasks", icon: ClipboardList },
  { name: "Library", href: "/dashboard/teacher/library", icon: Library },
  { name: "Assignments", href: "/dashboard/teacher/assignments", icon: Inbox },
  { name: "Examination", href: "/dashboard/teacher/examinations", icon: FileText },
  { name: "Raised Reports", href: "/dashboard/teacher/reports", icon: AlertTriangle },
]

const settingsNavigation = [
  { name: "Settings", href: "/dashboard/teacher/settings", icon: Settings },
  { name: "Help & Support", href: "/dashboard/teacher/help", icon: HelpCircle },
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
          "group relative flex h-10 items-center gap-3 rounded-md pl-4 text-[14px] font-medium transition-all duration-150 border-l-[2px]",
          isActive
            ? "bg-white/8 text-white border-white shadow-[0_0_12px_rgba(255,255,255,0.08)]"
            : "text-[#9A9A9A] border-transparent hover:bg-white/5 hover:text-white"
        )}
      >
        <item.icon
          className={cn(
            "shrink-0 transition-colors",
            isActive ? "text-white" : "text-[#555] group-hover:text-[#D4D4D4]"
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
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-[#444] select-none">
          {title}
        </p>
      )}
      {items.map((item) => <NavItem key={item.href} item={item} />)}
    </div>
  )

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
      <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-[#252525] bg-[#0A0A0A] px-4 pb-4">

        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-1">
          <Link href="/dashboard/teacher" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#252525] flex items-center justify-center transition-colors group-hover:border-white/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white leading-none">EduConnect</span>
              <p className="text-[10px] text-[#555] font-medium leading-none mt-0.5">Teacher Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-y-5 overflow-y-auto px-1">
          <NavSection title="Main Menu" items={mainNavigation} />
          <NavSection title="Academic" items={academicNavigation} />
          <NavSection items={settingsNavigation} />
        </nav>

        {/* User Mini-Card */}
        <div className="mx-1 rounded-xl bg-[#161616] border border-[#252525] p-3 flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-[#252525] shrink-0">
            <AvatarImage src={user.image || ""} alt={user.name} />
            <AvatarFallback className="bg-[#1F1F1F] text-white text-xs font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-[#555] truncate">{user.email}</p>
          </div>
        </div>

        {/* Logout */}
        <div className="mx-1 border-t border-[#252525] pt-2">
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#555] hover:bg-rose-500/8 hover:text-rose-400 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
