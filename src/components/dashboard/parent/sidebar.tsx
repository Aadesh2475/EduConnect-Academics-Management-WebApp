"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Settings, HelpCircleIcon, LogOut, ChevronRight, GraduationCap } from "lucide-react"
import { signOut } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

interface SidebarProps {
    user: {
        id: string
        name: string
        email: string
        image?: string | null
    }
}

const mainNavigation = [
    { name: "Home", href: "/dashboard/parent", icon: Home },
    { name: "Messages", href: "/dashboard/parent/messages", icon: MessageSquare },
]

const settingsNavigation = [
    { name: "Settings", href: "/dashboard/parent/settings", icon: Settings },
    { name: "Help & Support", href: "/dashboard/parent/help", icon: HelpCircleIcon },
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
                        ? "bg-[rgba(0,229,153,0.12)] text-white shadow-[0_0_8px_rgba(0,229,153,0.45)] !border-[#00e599]"
                        : "text-[#D4D4D4] hover:bg-[rgba(0,229,153,0.08)] hover:text-white hover:shadow-[0_0_6px_rgba(0,229,153,0.35)]"
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
                <div className="flex h-16 shrink-0 items-center px-1">
                    <Link href="/dashboard/parent" className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#1C1C1C] flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-[#00E599]" />
                        </div>
                        <div>
                            <span className="text-lg font-bold text-white leading-none">EduConnect</span>
                            <p className="text-[10px] text-[#B5B5B5] font-semibold leading-none mt-0.5">Parent Portal</p>
                        </div>
                    </Link>
                </div>
                <nav className="flex flex-1 flex-col gap-y-5 overflow-y-auto px-1 mt-4">
                    <NavSection title="Main Menu" items={mainNavigation} />
                    <NavSection items={settingsNavigation} />
                </nav>
                <div className="mx-1 border-t border-[#1C1C1C] pt-4 mt-auto">
                    <button
                        onClick={handleLogout}
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
