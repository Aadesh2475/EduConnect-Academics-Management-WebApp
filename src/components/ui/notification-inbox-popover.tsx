"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    link?: string | null;
    read: boolean;
    createdAt: string;
}

// ─── Type styling ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    success: { dot: "bg-[#00E599]", bar: "bg-[#00E599]", bg: "bg-[#00E599]/10" },
    warning: { dot: "bg-amber-500", bar: "bg-amber-500", bg: "bg-amber-500/10" },
    error: { dot: "bg-rose-500", bar: "bg-rose-500", bg: "bg-rose-500/10" },
    info: { dot: "bg-blue-500", bar: "bg-blue-500", bg: "bg-blue-500/10" },
} as const;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function NotificationSkeleton() {
    return (
        <div className="flex gap-3 px-3 py-3 animate-pulse">
            <div className="mt-1.5 h-2 w-2 rounded-full bg-border shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-border" />
                <div className="h-2.5 w-full rounded bg-muted" />
                <div className="h-2 w-1/4 rounded bg-muted" />
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

function NotificationInboxPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState("all");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Fetch real notifications from API ───────────────────────────────────────
    const fetchNotifications = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const res = await fetch("/api/notifications", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications ?? []);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load + 30-second polling
    useEffect(() => {
        fetchNotifications(true);
        intervalRef.current = setInterval(() => fetchNotifications(), 30_000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [fetchNotifications]);

    // Re-fetch when popover opens
    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    // ── Mark single as read ─────────────────────────────────────────────────────
    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId: id }),
        }).catch(() => { });
    };

    // ── Mark all as read ────────────────────────────────────────────────────────
    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAll: true }),
        }).catch(() => { });
    };

    // ── Delete single ───────────────────────────────────────────────────────────
    const deleteOne = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeletingId(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
        if (!res.ok) fetchNotifications(); // revert on failure
        setDeletingId(null);
    };

    // ── Delete all read ─────────────────────────────────────────────────────────
    const deleteAllRead = async () => {
        setNotifications(prev => prev.filter(n => !n.read));
        await fetch("/api/notifications?all=true", { method: "DELETE" }).catch(() => fetchNotifications());
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const readCount = notifications.filter(n => n.read).length;
    const filtered = tab === "unread" ? notifications.filter(n => !n.read) : notifications;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    aria-label="Open notifications"
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl outline-none transition-all duration-200 hover:bg-secondary"
                >
                    <Bell className="h-[18px] w-[18px] text-muted-foreground hover:text-foreground transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60 animate-ping" />
                            <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white leading-none">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        </span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent 
                className="w-[380px] p-0 bg-[#161616] border border-[#1C1C1C] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden" 
                align="end" 
                sideOffset={8}
            >
                <Tabs value={tab} onValueChange={setTab}>

                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className="flex items-center justify-between border-b border-[#1C1C1C] px-3 py-2.5 bg-[#1F1F1F]">
                        <div className="flex items-center gap-2">
                            <TabsList className="bg-transparent gap-0.5">
                                <TabsTrigger value="all" className="text-sm h-7 px-3">All</TabsTrigger>
                                <TabsTrigger value="unread" className="text-sm h-7 px-3 flex items-center gap-1.5">
                                    Unread
                                    {unreadCount > 0 && (
                                        <Badge className="h-4 min-w-4 px-1 text-[10px] rounded-full bg-rose-500 hover:bg-rose-500 text-white">
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex items-center gap-0.5">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#9A9A9A] hover:bg-white/5 hover:text-white transition-colors"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="h-3 w-3" /> All read
                                </button>
                            )}
                            {readCount > 0 && (
                                <button
                                    onClick={deleteAllRead}
                                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#9A9A9A] hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                                    title="Delete all read"
                                >
                                    <Trash2 className="h-3 w-3" /> Clear read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Notification list ───────────────────────────────── */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="divide-y divide-[#1C1C1C]">
                                {[...Array(4)].map((_, i) => <NotificationSkeleton key={i} />)}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                                <Bell className="h-8 w-8 text-muted/50" />
                                <p className="text-sm">
                                    {tab === "unread" ? "No unread notifications" : "You're all caught up!"}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filtered.map(n => {
                                    const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => !n.read && markAsRead(n.id)}
                                            className={cn(
                                                "relative flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-white/5 group cursor-pointer",
                                                !n.read && "bg-white/5"
                                            )}
                                        >
                                            {/* Left color bar */}
                                            {!n.read && <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 rounded-r", cfg.bar)} />}

                                            {/* Status dot */}
                                            <div className={cn(
                                                "mt-1.5 h-2 w-2 rounded-full shrink-0",
                                                n.read ? "bg-[#1F1F1F]" : cfg.dot
                                            )} />

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 space-y-0.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={cn(
                                                        "text-xs leading-snug",
                                                        !n.read ? "font-semibold text-white" : "font-normal text-[#D4D4D4]"
                                                    )}>
                                                        {n.title}
                                                    </p>
                                                    <span className="text-[10px] text-[#9A9A9A] whitespace-nowrap shrink-0 mt-0.5">
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[#9A9A9A] line-clamp-2 leading-relaxed font-medium">
                                                    {n.message}
                                                </p>
                                                {n.link && (
                                                    <Link
                                                        href={n.link}
                                                        className="inline-flex items-center gap-1 text-xs text-white dark:text-white hover:underline mt-0.5 font-medium"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            if (!n.read) markAsRead(n.id);
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        View <ExternalLink className="h-2.5 w-2.5" />
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Hover actions */}
                                            <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!n.read && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); markAsRead(n.id); }}
                                                        className="p-1 rounded-full text-[#9A9A9A] hover:text-[#00E599] hover:bg-[#00E599]/10 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={e => deleteOne(e, n.id)}
                                                    disabled={deletingId === n.id}
                                                    className="p-1 rounded-full text-[#9A9A9A] hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Tabs>

                {/* ── Footer ──────────────────────────────────────────── */}
                <div className="border-t border-[#1C1C1C] px-3 py-2">
                    <Button
                        variant="ghost"
                        className="w-full text-xs text-[#9A9A9A] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => fetchNotifications(true)}
                    >
                        Refresh
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export { NotificationInboxPopover };
