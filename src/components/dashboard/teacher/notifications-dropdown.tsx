"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, Check, Trash2, CheckCheck, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Notification {
    id: string
    title: string
    message: string
    type: "info" | "success" | "warning" | "error"
    link?: string | null
    read: boolean
    createdAt: string
}

const TYPE_CONFIG = {
    success: {
        dot: "bg-emerald-500",
        bar: "bg-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    warning: {
        dot: "bg-amber-500",
        bar: "bg-amber-500",
        bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    error: {
        dot: "bg-rose-500",
        bar: "bg-rose-500",
        bg: "bg-rose-50 dark:bg-rose-900/20",
    },
    info: {
        dot: "bg-blue-500",
        bar: "bg-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20",
    },
} as const

// ── Skeleton rows shown while loading ─────────────────────────────────────────
function NotificationSkeleton() {
    return (
        <div className="flex gap-3 px-4 py-3 animate-pulse">
            <div className="mt-1 h-2 w-2 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-gray-200" />
                <div className="h-2.5 w-full rounded bg-gray-100" />
                <div className="h-2.5 w-1/3 rounded bg-gray-100" />
            </div>
        </div>
    )
}

export function NotificationsDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // ── Fetch from the proper /api/notifications endpoint ─────────────────────
    const fetchNotifications = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true)
        try {
            const res = await fetch("/api/notifications", { cache: "no-store" })
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications ?? [])
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial load + 30-second polling interval
    useEffect(() => {
        fetchNotifications(true)
        intervalRef.current = setInterval(() => fetchNotifications(), 30_000)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [fetchNotifications])

    // Re-fetch when dropdown opens
    useEffect(() => {
        if (open) fetchNotifications()
    }, [open, fetchNotifications])

    // ── Mark single as read ───────────────────────────────────────────────────
    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId: id }),
        }).catch(() => {/* silently revert would go here */ })
    }

    // ── Mark all as read ──────────────────────────────────────────────────────
    const handleMarkAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAll: true }),
        }).catch(() => { })
    }

    // ── Delete single notification ────────────────────────────────────────────
    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation() // Don't trigger mark-as-read
        setDeletingId(id)
        // Optimistic removal
        setNotifications(prev => prev.filter(n => n.id !== id))
        const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" })
        if (!res.ok) {
            // Revert on failure
            fetchNotifications()
        }
        setDeletingId(null)
    }

    // ── Delete all read notifications ─────────────────────────────────────────
    const handleDeleteAllRead = async () => {
        setNotifications(prev => prev.filter(n => !n.read))
        await fetch("/api/notifications?all=true", { method: "DELETE" }).catch(() => fetchNotifications())
    }

    const unreadCount = notifications.filter(n => !n.read).length
    const readCount = notifications.filter(n => n.read).length

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    aria-label="Notifications"
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 outline-none hover:bg-gray-100 dark:hover:bg-white/5"
                >
                    <Bell className="h-[18px] w-[18px] text-gray-600 dark:text-gray-400" />
                    {unreadCount > 0 && (
                        <>
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
                className="w-80 sm:w-96 p-0 overflow-hidden rounded-xl bg-[#161616] border border-[#1C1C1C] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
                {/* ── Header ────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#1C1C1C]">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-[#9A9A9A]" />
                        <span className="font-bold text-sm text-white">Notifications</span>
                        {unreadCount > 0 && (
                            <Badge className="bg-rose-500 hover:bg-rose-500 text-white text-[10px] h-4 px-1.5 rounded-full">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-0.5">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1 text-xs text-[#9A9A9A] hover:text-white font-semibold px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                                title="Mark all as read"
                            >
                                <CheckCheck className="h-3 w-3" /> All read
                            </button>
                        )}
                        {readCount > 0 && (
                            <button
                                onClick={handleDeleteAllRead}
                                className="flex items-center gap-1 text-xs text-[#9A9A9A] hover:text-rose-400 hover:bg-rose-500/10 font-semibold px-2 py-1 rounded-lg transition-colors"
                                title="Delete all read notifications"
                            >
                                <Trash2 className="h-3 w-3" /> Clear read
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Notification list ──────────────────────────────────── */}
                <ScrollArea className="h-[360px]">
                    {loading ? (
                        <div className="divide-y divide-[#1C1C1C]">
                            {[...Array(4)].map((_, i) => <NotificationSkeleton key={i} />)}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                            <Bell className="h-10 w-10 text-gray-200 dark:text-gray-700" />
                            <p className="text-sm">You&apos;re all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#1C1C1C]">
                            {notifications.map((n) => {
                                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info
                                return (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "relative flex gap-3 px-4 py-3 transition-colors hover:bg-white/5 group cursor-pointer",
                                            !n.read && "bg-white/5"
                                        )}
                                        onClick={() => !n.read && handleMarkAsRead(n.id)}
                                    >
                                        {/* Left color bar for unread */}
                                        {!n.read && (
                                            <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 rounded-r", cfg.bar)} />
                                        )}

                                        {/* Status dot */}
                                        <div className={cn(
                                            "mt-1.5 h-2 w-2 rounded-full shrink-0",
                                            n.read ? "bg-[#1F1F1F]" : cfg.dot
                                        )} />

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm font-bold leading-snug truncate",
                                                    !n.read ? "text-white" : "text-[#D4D4D4]"
                                                )}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-[#9A9A9A] whitespace-nowrap shrink-0 mt-0.5 font-medium">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-[#9A9A9A] line-clamp-2 leading-relaxed font-medium">
                                                {n.message}
                                            </p>
                                            {n.link && (
                                                <Link
                                                    href={n.link}
                                                    className="inline-flex items-center gap-1 text-xs text-white hover:underline mt-0.5 font-medium"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (!n.read) handleMarkAsRead(n.id)
                                                        setOpen(false)
                                                    }}
                                                >
                                                    View <ExternalLink className="h-2.5 w-2.5" />
                                                </Link>
                                            )}
                                        </div>

                                        {/* Action buttons — visible on hover */}
                                        <div className="flex flex-col items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!n.read && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id) }}
                                                    className="p-1 rounded-full text-[#9A9A9A] hover:text-white hover:bg-white/5 transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-3 w-3" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => handleDelete(e, n.id)}
                                                disabled={deletingId === n.id}
                                                className="p-1 rounded-full text-[#9A9A9A] hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                                                title="Delete notification"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* ── Footer ────────────────────────────────────────────── */}
                <DropdownMenuSeparator className="bg-[#1F1F1F]" />
                <div className="px-3 py-2 bg-[#161616]">
                    <Button
                        variant="ghost"
                        className="w-full text-xs text-[#9A9A9A] hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                        onClick={() => fetchNotifications(true)}
                    >
                        Refresh
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
