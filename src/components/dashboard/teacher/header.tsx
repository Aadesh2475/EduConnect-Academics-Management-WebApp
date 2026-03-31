"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Menu,
  X,
  Home,
  User,
  BookOpen,
  BarChart3,
  MessageSquare,
  Users,
  GraduationCap,
  Calendar,
  CheckSquare,
  ClipboardList,
  Library,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  Megaphone,
  UserPlus,
  Bot,
  AlertTriangle,
  Inbox,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/auth-client"
import { cn, getInitials } from "@/lib/utils"
import { NotificationInboxPopover } from "@/components/ui/notification-inbox-popover"

interface HeaderProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    role: string
  }
}

const allNavigation = [
  { name: "Home", href: "/dashboard/teacher", icon: Home },
  { name: "Profile", href: "/dashboard/teacher/profile", icon: User },
  { name: "Sessions/Classes", href: "/dashboard/teacher/classes", icon: BookOpen },
  { name: "Analytics", href: "/dashboard/teacher/analytics", icon: BarChart3 },
  { name: "Messages", href: "/dashboard/teacher/messages", icon: MessageSquare },
  { name: "AI Assistant", href: "/dashboard/teacher/ai-assistant", icon: Bot },
  { name: "Registrations", href: "/dashboard/teacher/registrations", icon: UserPlus },
  { name: "Students", href: "/dashboard/teacher/students", icon: Users },
  { name: "Calendar", href: "/dashboard/teacher/calendar", icon: Calendar },
  { name: "Attendance", href: "/dashboard/teacher/attendance", icon: CheckSquare },
  { name: "Announcements", href: "/dashboard/teacher/announcements", icon: Megaphone },
  { name: "Tasks", href: "/dashboard/teacher/tasks", icon: ClipboardList },
  { name: "Library", href: "/dashboard/teacher/library", icon: Library },
  { name: "Assignments", href: "/dashboard/teacher/assignments", icon: Inbox },
  { name: "Examinations", href: "/dashboard/teacher/examinations", icon: FileText },
  { name: "Raised Reports", href: "/dashboard/teacher/reports", icon: AlertTriangle },
  { name: "Settings", href: "/dashboard/teacher/settings", icon: Settings },
  { name: "Help & Support", href: "/dashboard/teacher/help", icon: HelpCircle },
]

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#252525] bg-[#0A0A0A] px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Open navigation menu"
          className="lg:hidden -m-2.5 p-2.5 text-[#9A9A9A] hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Search Bar */}
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1 items-center">
            <div className={cn(
              "hidden lg:flex items-center gap-2 w-full max-w-sm h-9 px-3 rounded-lg border transition-all duration-150",
              searchFocused
                ? "bg-[#161616] border-white/25 shadow-[0_0_0_3px_rgba(255,255,255,0.05)]"
                : "bg-[#111111] border-[#252525]"
            )}>
              <Search className="h-4 w-4 text-[#444] shrink-0" />
              <input
                type="text"
                placeholder="Search anything..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#444] outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-[#333] px-1.5 py-0.5 text-[10px] font-mono text-[#444]">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-x-3">
            {/* Notifications */}
            <NotificationInboxPopover />

            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-[#111111] border border-[#252525]">
              <span className="text-[12px] font-medium text-[#555]">{user.email}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-white/5">
                  <Avatar className="h-10 w-10 border border-[#252525] rounded-full">
                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                    <AvatarFallback className="bg-[#1F1F1F] text-white text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator — white dot */}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0A0A0A] bg-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 bg-[#111111] border border-[#252525] shadow-[0_8px_32px_rgba(0,0,0,0.6)] rounded-xl">
                <DropdownMenuLabel className="px-3 py-3 mb-1 rounded-lg bg-[#1A1A1A] border border-[#252525]">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-[#252525]">
                      <AvatarImage src={user.image || ""} alt={user.name} />
                      <AvatarFallback className="bg-[#252525] text-white text-sm font-bold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white leading-none truncate">{user.name}</p>
                      <p className="text-[11px] text-[#555] font-medium mt-1 truncate">{user.email}</p>
                      <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded bg-white/8 border border-white/10 text-[10px] text-[#9A9A9A] font-semibold uppercase tracking-wider">Teacher</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <div className="p-1 space-y-0.5">
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-[#9A9A9A] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white py-2 px-3 transition-colors">
                    <Link href="/dashboard/teacher/profile" className="flex items-center gap-3 w-full">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-[#9A9A9A] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white py-2 px-3 transition-colors">
                    <Link href="/dashboard/teacher/settings" className="flex items-center gap-3 w-full">
                      <Settings className="h-4 w-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#252525] my-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/8 focus:text-rose-300 focus:bg-rose-500/8 cursor-pointer rounded-lg py-2 px-3 transition-colors"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="text-sm font-semibold">Log out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0A0A0A] border-r border-[#252525] lg:hidden overflow-y-auto flex flex-col"
            >
              {/* Logo */}
              <div className="flex h-16 items-center justify-between px-6 border-b border-[#252525] shrink-0">
                <Link href="/dashboard/teacher" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-8 h-8 rounded-lg bg-[#161616] border border-[#252525] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">EduConnect</span>
                </Link>
                <button aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)} className="text-[#555] hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Info */}
              <div className="p-4 border-b border-[#252525] shrink-0">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#111111] border border-[#252525]">
                  <Avatar className="h-10 w-10 border border-[#252525]">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="bg-[#1F1F1F] text-white font-bold">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-[#555] truncate">{user.email}</p>
                  </div>
                  <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/8 border border-white/10 text-[9px] text-[#9A9A9A] font-bold uppercase">T</span>
                </div>
              </div>

              {/* Search */}
              <div className="px-4 pt-4 pb-2 shrink-0">
                <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-[#111111] border border-[#252525]">
                  <Search className="h-4 w-4 text-[#444] shrink-0" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-[#444] outline-none"
                  />
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-0.5">
                  {allNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 border-l-2",
                            isActive
                              ? "bg-white/8 text-white border-white"
                              : "text-[#9A9A9A] border-transparent hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-[#555]")} />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-[#252525] shrink-0">
                <button
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#555] hover:bg-rose-500/8 hover:text-rose-400 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                  Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
