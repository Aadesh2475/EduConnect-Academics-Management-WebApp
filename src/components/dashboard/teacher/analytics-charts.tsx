"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    AreaChart, Area
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DatetimePicker as DateTimePicker } from "@/components/ui/datetime-picker"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { format, subDays, startOfToday, eachDayOfInterval, isSameDay } from "date-fns"
import { Badge } from "@/components/ui/badge"

// MUI X-Charts Premium Dark Theme Colors
const BG_DARK = "#000000" // Pure black
const BORDER_DARK = "rgba(255, 255, 255, 0.05)" // Thin white border
const TEXT_MUTED = "#ffffff" // Bright white text

// Glowing Chart Colors (Unique colors for 8 categories)
const GAUGE_COLORS = [
    "#00E599", // Neon Green
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#ec4899", // Pink
    "#8b5cf6", // Violet
    "#ef4444", // Red
    "#f97316", // Orange
    "#06b6d4"  // Cyan
]
const AREA_COLORS = ["#00E599", "#f59e0b", "#ec4899", "#10b981"] // Neon Green, Yellow, Pink, Emerald

interface AnalyticsData {
    attendanceTrend: Array<{ day: string; value: number; details: Array<{ name: string; present: number; absent: number }> }>
    activityDistribution: Array<{ name: string; value: number }>
    heatmapData: Record<string, { count: number; activities: Array<{ type: string; title: string, time: string }> }>
    performanceTimeSeries: Array<{ date: string; classAverage: number | null }>
    totalStudents: number
    performanceTrend: {
        todayAvg: number | null
        yesterdayAvg: number | null
    }
}

const CustomAttendanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#161616] border border-white/5 p-3 rounded-lg shadow-lg text-sm text-white min-w-[150px] z-50">
                <p className="font-semibold mb-2 pb-1 border-b border-white/5">{label}</p>
                {data.details && data.details.length > 0 ? (
                    <div className="space-y-2">
                        {data.details.map((c: any, i: number) => (
                            <div key={i}>
                                <p className="text-blue-400 font-medium text-xs mb-0.5">{c.name}:</p>
                                <div className="flex flex-col text-xs pl-2 gap-0.5">
                                    <span className="text-emerald-400 flex items-center justify-between gap-4">
                                        <span>Present ({c.present})</span>
                                    </span>
                                    <span className="text-rose-400 flex items-center justify-between gap-4">
                                        <span>Absent ({c.absent})</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[#9ba1ad] text-xs">No attendance marked</p>
                )}
            </div>
        );
    }
    return null;
};

export function AnalyticsCharts() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Date Range State (Default: Current Month)
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
    })

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true)
            try {
                let url = "/api/teacher/dashboard/analytics"
                if (date?.from && date?.to) {
                    url += `?from=${date.from.toISOString()}&to=${date.to.toISOString()}`
                }

                const res = await fetch(url)
                const result = await res.json()

                if (result.success) {
                    setData(result.data)
                } else {
                    setError(result.error || "Failed to load analytics")
                }
            } catch (e) {
                setError("Failed to connect to analytics server")
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [date])

    if (loading && !data) {
        return (
            <div className="space-y-6 animate-pulse mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-[300px] w-full rounded-xl bg-[#161616]" />
                <Skeleton className="h-[300px] w-full rounded-xl bg-[#161616]" />
                <Skeleton className="h-[300px] w-full rounded-xl bg-[#161616]" />
            </div>
            <Skeleton className="h-[450px] w-full rounded-xl bg-[#161616]" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <Card className="border-destructive/50 bg-destructive/5 mt-8">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <AlertCircle className="w-10 h-10 text-destructive mb-3 opacity-80" />
                    <p className="text-sm font-medium text-destructive">{error || "Analytics unavailable"}</p>
                </CardContent>
            </Card>
        )
    }

    const getCellColorClass = (value: number) => {
        if (value === 0) return "bg-white/[0.03]"
        if (value <= 2) return "bg-[#00E599]/20"
        if (value <= 5) return "bg-[#00E599]/40"
        if (value <= 8) return "bg-[#00E599]/60"
        return "bg-[#00E599]/85"
    }

    // Safe fallbacks to prevent undefined errors from cached payloads
    const attendanceTrend = data.attendanceTrend || []
    const activityDistribution = data.activityDistribution || (data as any).teacherActivities || []
    const heatmapData = data.heatmapData || {}
    const performanceTimeSeries = data.performanceTimeSeries || []
    const totalStudents = data.totalStudents || 0
    const performanceTrend = data.performanceTrend || { todayAvg: null, yesterdayAvg: null }

    // Formatter to create semi-circle Gauge
    const gaugeTotal = activityDistribution.reduce((sum, item) => sum + item.value, 0)

    // 24x7 Heatmap logic
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hoursArr = Array.from({ length: 24 }, (_, i) => i);

    const calculateTrend = () => {
        if (performanceTrend.todayAvg === null || performanceTrend.yesterdayAvg === null) return null;
        if (performanceTrend.yesterdayAvg === 0) return performanceTrend.todayAvg > 0 ? 100 : 0;
        const diff = performanceTrend.todayAvg - performanceTrend.yesterdayAvg;
        return Math.round((diff / performanceTrend.yesterdayAvg) * 100);
    }

    const trendValue = calculateTrend();

    return (
        <div className="space-y-6 mt-8 dark">

            {/* Header & Date Picker */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-white">Analytics</h2>
                <div className="flex items-center gap-2">
                    <DateTimePicker
                        date={date?.from}
                        setDate={(newDate) => setDate(prev => ({ from: newDate, to: prev?.to }))}
                        placeholder="Start Date"
                    />
                    <span className="text-[#9ba1ad]">-</span>
                    <DateTimePicker
                        date={date?.to}
                        setDate={(newDate) => setDate(prev => ({ from: prev?.from, to: newDate }))}
                        placeholder="End Date"
                    />
                </div>
            </div>

            {/* SVG Definitions for Gradients */}
            <svg width="0" height="0">
                <defs>
                    <linearGradient id="areaGradient0" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={AREA_COLORS[0]} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={AREA_COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaGradient1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={AREA_COLORS[1]} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={AREA_COLORS[1]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={AREA_COLORS[2]} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={AREA_COLORS[2]} stopOpacity={0} />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
            </svg>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Total Stats Mini Header block */}
                <div className="col-span-1 lg:col-span-3 grid grid-cols-3 gap-4">
                    <div className="bg-[#161616] border border-[#1C1C1C] rounded-xl p-4 flex flex-col justify-center relative shadow-none h-[100px]">
                        <p className="text-[#B5B5B5] text-[13px] font-medium mb-1 z-10">Total Sessions</p>
                        <h3 className="text-white text-3xl font-bold z-10">{attendanceTrend.reduce((a, b) => a + b.value, 0)}</h3>
                    </div>
                    <div className="bg-[#161616] border border-[#1C1C1C] rounded-xl p-4 flex flex-col justify-center relative shadow-none h-[100px]">
                        <p className="text-[#B5B5B5] text-[13px] font-medium mb-1 z-10">Resources Created</p>
                        <h3 className="text-white text-3xl font-bold z-10">{gaugeTotal}</h3>
                    </div>
                    <div className="bg-[#161616] border border-[#1C1C1C] rounded-xl p-4 flex flex-col justify-center relative shadow-none h-[100px]">
                        <p className="text-[#B5B5B5] text-[13px] font-medium mb-1 z-10">Students Tracked</p>
                        <h3 className="text-white text-3xl font-bold z-10">{totalStudents}</h3>
                    </div>
                </div>

                {/* 1. Gauge Chart (Teacher Activities) */}
                <Card className="bg-[#161616] border-[#1C1C1C] shadow-none col-span-1 flex flex-col h-full">
                    <CardHeader className="pb-0 border-b-0 space-y-0 text-left">
                        <CardTitle className="text-sm font-bold text-white tracking-tight">Activity Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col items-center justify-center min-h-[340px]">
                        <div className="w-full h-[200px] flex justify-center z-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={activityDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {activityDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={GAUGE_COLORS[index % GAUGE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#161616', borderColor: '#1C1C1C', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Custom Legend */}
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-8 z-10 text-[10px] text-white">
                            {activityDistribution.map((entry, idx) => (
                                <div key={entry.name} className="flex items-center gap-1">
                                    <div 
                                        className={cn(
                                            "w-2 h-2 rounded-full",
                                            idx % 8 === 0 ? "bg-[#00E599]" :
                                            idx % 8 === 1 ? "bg-[#f59e0b]" :
                                            idx % 8 === 2 ? "bg-[#10b981]" :
                                            idx % 8 === 3 ? "bg-[#ec4899]" :
                                            idx % 8 === 4 ? "bg-[#8b5cf6]" :
                                            idx % 8 === 5 ? "bg-[#ef4444]" :
                                            idx % 8 === 6 ? "bg-[#f97316]" : "bg-[#06b6d4]"
                                        )}
                                    />
                                    <span className="opacity-80 font-medium">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Attendance Bar Chart */}
                <Card className="bg-[#161616] border-[#1C1C1C] shadow-none col-span-1 flex flex-col h-full">
                    <CardHeader className="pb-2 border-b-0 space-y-0 text-left">
                        <CardTitle className="text-sm font-bold text-white tracking-tight">Attendance Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col justify-center">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={attendanceTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <XAxis
                                        dataKey="day"
                                        tickLine={false}
                                        axisLine={{ stroke: '#1C1C1C' }}
                                        tick={{ fontSize: 10, fill: '#8A8A8A', fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        content={<CustomAttendanceTooltip />}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#00E599"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={16}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. 24x7 Activity Heatmap Grid */}
                <Card className="bg-[#161616] border-[#1C1C1C] shadow-none col-span-1 flex flex-col h-full">
                    <CardHeader className="pb-2 border-b-0 space-y-0 text-left">
                        <CardTitle className="text-sm font-bold text-white tracking-tight">Activity Heatmap</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 flex-1 overflow-hidden">
                        <div className="flex flex-col h-full">
                            {/* Days Label Header */}
                            <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-1 mb-2">
                                <div />
                                {weekdays.map(day => (
                                    <div key={day} className="text-[10px] text-[#7A7A7A] text-center font-medium">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="relative flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px] max-h-[360px]">
                                <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-1.5">
                                    {hoursArr.map(hour => (
                                        <div key={`hour-row-${hour}`} className="contents">
                                            {/* Time label */}
                                            <div key={`time-${hour}`} className="text-[9px] text-[#555] flex items-center justify-end pr-2 h-5">
                                                {hour % 6 === 0 ? (hour === 0 ? '12 AM' : hour > 12 ? `${hour-12} PM` : hour === 12 ? '12 PM' : `${hour} AM`) : ''}
                                            </div>
                                            {/* Data cells for each day */}
                                            {Array.from({ length: 7 }, (_, dayIdx) => {
                                                const slotKey = `${hour}-${dayIdx}`;
                                                const slotData = heatmapData[slotKey] || { count: 0, activities: [] };
                                                return (
                                                    <Popover key={slotKey}>
                                                        <PopoverTrigger asChild>
                                                            <div 
                                                                className={cn(
                                                                    "w-full h-5 rounded-[3px] cursor-pointer hover:ring-2 hover:ring-white/30 transition-all relative group",
                                                                    getCellColorClass(slotData.count)
                                                                )}
                                                            >
                                                                {slotData.count > 0 && (
                                                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-[3px]" />
                                                                )}
                                                            </div>
                                                        </PopoverTrigger>
                                                        {slotData.count > 0 && (
                                                            <PopoverContent className="w-72 bg-[#0A0A0A] border-white/10 text-[#B5B5B5] shadow-2xl z-[100]" side="right" align="start">
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                                        <h4 className="font-black text-[10px] text-white uppercase tracking-widest">
                                                                            {weekdays[dayIdx]} @ {hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'} Slot
                                                                        </h4>
                                                                        <Badge className="text-[9px] h-5 bg-white/8 text-[#9A9A9A] border-white/10 font-black">
                                                                            {slotData.count} ACTIONS
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                                                        {slotData.activities.map((act: any, i: number) => (
                                                                            <div key={i} className="flex flex-col text-[11px] border border-white/5 bg-[#111] p-2.5 rounded-xl hover:border-[#00E599]/30 transition-all group/item">
                                                                                <div className="flex items-center justify-between mb-1">
                                                                                    <span className="text-[#555] font-black uppercase text-[9px] tracking-tighter">{act.type}</span>
                                                                                    <span className="text-[9px] text-[#555] font-bold">{act.time}</span>
                                                                                </div>
                                                                                <span className="text-white font-bold leading-tight line-clamp-2 group-hover/item:text-white transition-colors">{act.title}</span>
                                                                                <span className="text-[#7A7A7A] mt-1.5 text-[9px] italic border-t border-white/5 pt-1">{act.date}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        )}
                                                    </Popover>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                                <span className="text-[11px] font-bold text-[#555] uppercase tracking-widest">Intensity</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-[#7A7A7A]">Low Intensity</span>
                                    <div className="flex gap-1">
                                        {[0, 2, 5, 8, 10].map(v => (
                                            <div key={v} className={cn("w-3 h-3 rounded-[2px]", getCellColorClass(v))} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-[#7A7A7A]">High Pulse</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

                {/* 4. Massive Area Chart */}
            <Card className="bg-[#161616] border-[#1C1C1C] shadow-none mt-4">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#1C1C1C] gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-sm font-bold text-white tracking-tight">Performance Analytics</CardTitle>
                            {trendValue !== null && (
                                <Badge className={cn(
                                    "px-3 py-1 rounded-full flex items-center gap-1.5 border-0 h-7",
                                    trendValue > 0 ? "bg-[#00E599]/10 text-[#00E599] shadow-[0_0_12px_rgba(0,229,153,0.1)]" : trendValue < 0 ? "bg-rose-500/10 text-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.1)]" : "bg-[#1F1F1F] text-[#B5B5B5]"
                                )}>
                                    {trendValue > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : trendValue < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                    <span className="text-[11px] font-bold">{Math.abs(trendValue)}% Delta</span>
                                </Badge>
                            )}
                        </div>
                        <p className="text-[13px] text-[#B5B5B5] mt-2">Activity audit updated live</p>
                    </div>
                    <div className="flex items-center gap-4 bg-[#000] px-4 py-2 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-[#555] font-black uppercase">Yesterday</span>
                            <span className="text-xs font-bold text-white">{performanceTrend.yesterdayAvg || 0}%</span>
                        </div>
                        <div className="h-6 w-[1px] bg-white/5" />
                        <div className="flex flex-col">
                            <span className="text-[8px] text-[#00E599] font-black uppercase">Today</span>
                            <span className="text-xs font-black text-[#00E599]">{performanceTrend.todayAvg || 0}%</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="h-[380px] w-full mt-2 relative">
                        {/* Overlay trend lines if necessary, but AreaChart is cleaner */}
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceTimeSeries} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00E599" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00E599" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#1C1C1C" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={{ stroke: '#1C1C1C' }}
                                    tick={{ fontSize: 9, fill: '#444', fontWeight: 700 }}
                                    dy={15}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 9, fill: '#444', fontWeight: 700 }}
                                    tickFormatter={val => `${val}%`}
                                    domain={[0, 100]}
                                />
                                <RechartsTooltip
                                    cursor={{ stroke: '#333', strokeWidth: 1 }}
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                                    labelStyle={{ color: '#FFF', fontWeight: 900, fontSize: '12px', marginBottom: '8px' }}
                                    formatter={(value: any) => [`${Math.round(value)}%`, "CLASS AVG"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="classAverage"
                                    stroke="#00E599"
                                    fill="url(#perfGradient)"
                                    strokeWidth={3}
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#000', fill: "#00E599" }}
                                    filter="url(#glow)"
                                    animationDuration={1500}
                                />
                                {/* Trend Reference Line for Yesterday */}
                                {performanceTrend.yesterdayAvg && (
                                    <Area
                                        type="monotone"
                                        dataKey={() => performanceTrend.yesterdayAvg}
                                        stroke="#555"
                                        fill="transparent"
                                        strokeWidth={1}
                                        strokeDasharray="10 10"
                                        isAnimationActive={false}
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
