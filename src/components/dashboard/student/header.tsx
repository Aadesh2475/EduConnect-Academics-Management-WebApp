"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Menu,
  X,
  Home,
  User,
  BookOpen,
  Users,
  FileText,
  HelpCircle,
  Calendar,
  CalendarDays,
  MessageSquare,
  CheckSquare,
  ClipboardList,
  GraduationCap,
  Settings,
  HelpCircleIcon,
  LogOut,
  Library,
  BarChart3
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { signOut } from "@/lib/auth-client"
import { cn, getInitials } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { NotificationInboxPopover } from "@/components/ui/notification-inbox-popover"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    role: string
  }
}

const navigation = [
  { name: "Home", href: "/dashboard/student", icon: Home },
  { name: "Profile", href: "/dashboard/student/profile", icon: User },
  { name: "Classes", href: "/dashboard/student/classes", icon: BookOpen },
  { name: "Tutors", href: "/dashboard/student/tutors", icon: Users },
  { name: "Assignments", href: "/dashboard/student/assignments", icon: FileText },
  { name: "Quiz", href: "/dashboard/student/quiz", icon: HelpCircle },
  { name: "Library", href: "/dashboard/student/library", icon: Library },
  { name: "Attendance", href: "/dashboard/student/attendance", icon: CheckSquare },
  { name: "Messages", href: "/dashboard/student/messages", icon: MessageSquare },
  { name: "Tasks", href: "/dashboard/student/tasks", icon: ClipboardList },
  { name: "Results", href: "/dashboard/student/results", icon: BarChart3 },
  { name: "Academics", href: "/dashboard/student/academics", icon: GraduationCap },
  { name: "Calendar", href: "/dashboard/student/calendar", icon: Calendar },
  { name: "Events", href: "/dashboard/student/events", icon: CalendarDays },
  { name: "Settings", href: "/dashboard/student/settings", icon: Settings },
  { name: "Help", href: "/dashboard/student/help", icon: HelpCircleIcon },
]

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#00E599]/30 bg-background px-4 sm:px-6 lg:px-8 shadow-[0_1px_10px_rgba(0,229,153,0.1)]">
        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Open navigation menu"
          className="lg:hidden -m-2.5 p-2.5 text-white"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>



        {/* Search */}
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1"></div>

          <div className="flex items-center gap-x-4">
            <ThemeToggle />
            {/* Notifications */}
            <NotificationInboxPopover />

            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-[#181818] border border-[#1C1C1C]">
              <span className="text-[12px] font-medium text-[#B5B5B5]">{user.email}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-white/5">
                  <Avatar className="h-10 w-10 border border-[#1C1C1C]">
                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                    <AvatarFallback className="bg-[#1F1F1F] text-[#00E599] text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#121212] bg-[#00E599]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[280px] bg-[#161616] border-[#1C1C1C] p-0 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-xl" align="end" forceMount>
                <div className="p-4 bg-[#1F1F1F] border-b border-[#1C1C1C] rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-[#1C1C1C]">
                      <AvatarImage src={user.image || ""} alt={user.name || ""} />
                      <AvatarFallback className="bg-[#1F1F1F] text-[#00E599] font-bold text-lg">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[15px] font-bold text-white truncate leading-tight">{user.name}</span>
                      <span className="text-[12px] text-[#B5B5B5] truncate mt-0.5">{user.email}</span>
                      <div className="mt-2">
                        <Badge className="bg-[#00E599]/10 text-[#00E599] border-none text-[10px] font-bold px-2 py-0.5 h-auto">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenuLabel className="px-3 py-3 mb-1 rounded-lg bg-[#1F1F1F] border border-[#1C1C1C]">
                  <div className="flex flex-col space-y-1.5">
                    <p className="text-sm font-bold text-white leading-none">{user.name}</p>
                    <p className="text-[11px] text-[#9A9A9A] font-medium">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="mt-2 bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20 text-[9px] font-bold uppercase tracking-wider px-2 py-0">Student</Badge>
                </DropdownMenuLabel>
                <div className="p-1 space-y-0.5">
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-[#D4D4D4] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white py-2 px-3 transition-colors">
                    <Link href="/dashboard/student/profile" className="flex items-center gap-3 w-full">
                      <User className="h-4 w-4 text-[#9A9A9A]" />
                      <span className="text-sm font-medium">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-[#D4D4D4] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white py-2 px-3 transition-colors">
                    <Link href="/dashboard/student/settings" className="flex items-center gap-3 w-full">
                      <Settings className="h-4 w-4 text-[#9A9A9A]" />
                      <span className="text-sm font-medium">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#1C1C1C] my-1" />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer rounded-lg py-2 px-3 transition-colors"
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
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white lg:hidden overflow-y-auto"
            >
              <div className="flex h-16 items-center justify-between px-6 border-b border-[#1C1C1C]">
                <Link href="/dashboard/student" className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white dark:text-gray-900" />
                  </div>
                  <span className="text-lg font-bold dark:text-white">EduConnect</span>
                </Link>
                <button aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* User Info */}
              <div className="p-4 border-b border-[#1C1C1C]">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-100 bg-[#161616]">
                  <Avatar className="h-10 w-10 border border-gray-200 border-[#1C1C1C]">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="bg-white bg-[#1F1F1F] text-gray-900 dark:text-white">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-4">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg p-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Logout */}
              <div className="p-4 border-t mt-auto">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Log Out
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
