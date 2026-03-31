"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Notification {
    id: string
    title: string
    message: string
    type: "info" | "success" | "warning" | "error"
    link?: string
    read: boolean
    createdAt: string
}

const TYPE_STYLES: Record<string, { dot: string; bg: string; bar: string }> = {
    success: { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", bar: "bg-emerald-500" },
    warning: { dot: "bg-amber-500", bg: "bg-amber-50  dark:bg-amber-900/20", bar: "bg-amber-500" },
    error: { dot: "bg-rose-500", bg: "bg-rose-50   dark:bg-rose-900/20", bar: "bg-rose-500" },
    info: { dot: "bg-blue-500", bg: "bg-blue-50   dark:bg-blue-900/20", bar: "bg-blue-500" },
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    // Re-fetch when dropdown opens
    useEffect(() => { if (isOpen) fetchNotifications() }, [isOpen])

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId: id }),
        }).catch(() => { })
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAll: true }),
        }).catch(() => { })
    }

    const deleteOld = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/notifications/cleanup", { method: "DELETE" })
            if (res.ok) {
                const data = await res.json()
                toast({
                    title: "Success",
                    description: data.message || "Old notifications cleared."
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to clear notifications.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to clear notifications.",
                variant: "destructive"
            })
        }
        await fetchNotifications()
        setLoading(false)
    }

    const hasUnread = unreadCount > 0

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                {/* ── Highlighted Bell Button ── */}
                <button
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 outline-none hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Notifications"
                >
                    <Bell className="h-[18px] w-[18px] text-gray-600 dark:text-gray-400" />
                    {hasUnread && (
                        <>
                            {/* Animated pulse ring */}
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60 animate-ping" />
                                <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white leading-none">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            </span>
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-80 sm:w-96 p-0 overflow-hidden rounded-xl shadow-xl border border-gray-200/80 dark:border-gray-700/80"
            >
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notifications</span>
                        {hasUnread && (
                            <Badge className="bg-rose-500 hover:bg-rose-500 text-white text-[10px] h-4 px-1.5 rounded-full">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-0.5">
                        {hasUnread && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                title="Mark all as read"
                            >
                                <Check className="h-3 w-3" /> All read
                            </button>
                        )}
                        <button
                            onClick={deleteOld}
                            disabled={loading}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                            title="Clear old notifications"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Notification list */}
                <ScrollArea className="h-[360px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                            <Bell className="h-10 w-10 text-gray-200 dark:text-gray-700" />
                            <p className="text-sm">You&apos;re all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {notifications.map((n) => {
                                const s = TYPE_STYLES[n.type] || TYPE_STYLES.info
                                return (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "relative flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 group",
                                            !n.read && s.bg
                                        )}
                                    >
                                        {/* Color bar */}
                                        {!n.read && <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 rounded-r", s.bar)} />}

                                        {/* Dot */}
                                        <div className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", n.read ? "bg-gray-200 dark:bg-gray-700" : s.dot)} />

                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn("text-sm font-medium leading-snug truncate", !n.read ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300")}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                            {n.link && (
                                                <Link
                                                    href={n.link}
                                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 font-medium"
                                                    onClick={() => { if (!n.read) markAsRead(n.id); setIsOpen(false) }}
                                                >
                                                    View <ExternalLink className="h-2.5 w-2.5" />
                                                </Link>
                                            )}
                                        </div>

                                        {!n.read && (
                                            <button
                                                onClick={() => markAsRead(n.id)}
                                                className="mt-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                title="Mark as read"
                                            >
                                                <Check className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
