"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Search,
  Menu,
  X,
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
  Database,
  Cog
} from "lucide-react"
import { NotificationInboxPopover } from "@/components/ui/notification-inbox-popover"
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
import { ThemeToggle } from "@/components/theme-toggle"

interface AdminHeaderProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    role: string
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
  { name: "Settings", href: "/dashboard/admin/settings", icon: Cog },
]

export function AdminHeader({ user }: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#00E599]/30 bg-background px-4 sm:px-6 lg:px-8 shadow-[0_1px_10px_rgba(0,229,153,0.1)]">
        <button
          type="button"
          aria-label="Open navigation menu"
          className="lg:hidden -m-2.5 p-2.5 text-white"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>




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
                    <p className="text-xs text-[#9A9A9A] font-medium">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="mt-2 bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20 text-[9px] font-bold uppercase tracking-wider px-2 py-0">Admin</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#1C1C1C] my-1" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-[#D4D4D4] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white transition-colors py-2">
                  <Link href="/dashboard/admin/settings" className="flex items-center w-full">
                    <Settings className="mr-3 h-4 w-4 text-[#9A9A9A]" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#1F1F1F] my-1" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-red-500 hover:text-red-400 focus:bg-red-500/10 focus:text-red-500 cursor-pointer rounded-lg transition-colors py-2"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-semibold">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

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
              className="fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 lg:hidden overflow-y-auto"
            >
              <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 border-[#1C1C1C]">
                <Link href="/dashboard/admin" className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white dark:text-gray-900" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</span>
                </Link>
                <button aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="p-4 border-b border-gray-200 border-[#1C1C1C]">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-100 bg-[#161616]">
                  <Avatar className="h-10 w-10 border border-gray-200 border-[#1C1C1C]">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="bg-white bg-[#1F1F1F] text-gray-900 dark:text-white">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

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

              <div className="p-4 border-t border-[#1C1C1C] mt-auto">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
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
