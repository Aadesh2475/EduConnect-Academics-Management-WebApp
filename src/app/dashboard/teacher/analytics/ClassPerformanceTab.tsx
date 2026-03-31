"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, MoreVertical, Activity, Eye, Shield, MessageSquare, Wifi, WifiOff, Loader2, Star, BookOpen, CheckCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface ClassStudent {
    studentId: string; userId: string; name: string; email: string; image?: string | null
    classId: string; className: string; classCode: string
    examAvg: number; attendanceRate: number; assignmentCompletion: number; performanceRate: number
    isOnline: boolean; lastActivity: string | null; remark: string
    teacherRating: { rating: number; feedback: string | null } | null
}

interface ClassOption { id: string; name: string; code: string }

interface DetailData {
    view: string; student: { id: string; userId: string; name: string; email: string; image?: string | null }
    isOnline?: boolean; lastActivity?: string | null; assignmentsSubmitted?: number; tasksSubmitted?: number
    examsSubmitted?: number; monthlyAttendance?: { classId: string; className: string; rate: number }[]
    recentActivities?: { type: string; description: string | null; createdAt: string }[]
    subjectPerformance?: { classId: string; className: string; subject: string; examAvg: number; attendance: number; assignmentsSubmitted: number; assignmentsTotal: number; teacherRating: { rating: number; feedback: string | null } | null; remark: string; email: string }[]
    loginCount?: number; loginThisMonth?: number; teacherInteractions?: number; libraryAccess?: number
    complaintsRaised?: number; activityBreakdown?: Record<string, number>; complaints?: { title: string; category: string; status: string; priority: string; createdAt: string }[]
}

function StarDisplay({ value }: { value: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= value ? "fill-[#FACC15] text-[#FACC15] shadow-[0_0_8px_rgba(250,204,21,0.4)]" : "text-[#333]"}`} />
            ))}
        </div>
    )
}

function ActivityView({ data }: { data: DetailData }) {
    const router = useRouter()
    if (!data) return null
    return (
        <div className="space-y-5">
            <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all",
                data.isOnline 
                  ? "bg-white/5 border-white/10" 
                  : "bg-[#000] border-white/5"
            )}>
                {data.isOnline ? <Wifi className="w-5 h-5 text-[#9A9A9A]" /> : <WifiOff className="w-5 h-5 text-[#444]" />}
                <div className="flex-1">
                    <p className={cn(
                        "font-bold text-sm uppercase tracking-tight",
                        data.isOnline ? "text-white" : "text-[#8A8A8A]"
                    )}>
                        {data.isOnline ? "Currently Online" : "Offline"}
                    </p>
                    {data.lastActivity && <p className="text-[11px] text-[#666] mt-0.5">Last seen {formatDistanceToNow(new Date(data.lastActivity), { addSuffix: true })}</p>}
                </div>
                {data.isOnline && (
                    <Button size="sm" className="gap-2 text-[10px] font-bold uppercase bg-white text-black hover:bg-white/90" onClick={() => router.push(`/dashboard/teacher/messages?userId=${data.student.userId}`)}>
                        <MessageSquare className="w-3.5 h-3.5" /> Message
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Assignments", value: data.assignmentsSubmitted, icon: BookOpen, color: "text-[#3b82f6]" },
                    { label: "Exams", value: data.examsSubmitted, icon: CheckCircle, color: "text-white" },
                    { label: "Tasks", value: data.tasksSubmitted, icon: Clock, color: "text-[#A855F7]" },
                ].map(item => (
                    <div key={item.label} className="p-4 rounded-xl bg-[#000] border border-white/5 text-center group hover:border-white/10 transition-colors">
                        <item.icon className={cn("w-5 h-5 mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity", item.color)} />
                        <p className="text-2xl font-bold text-white">{item.value ?? 0}</p>
                        <p className="text-[10px] text-[#666] uppercase font-bold tracking-wider mt-1">{item.label}</p>
                    </div>
                ))}
            </div>
            {data.monthlyAttendance && data.monthlyAttendance.length > 0 && (
                <div className="bg-[#000] p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-4 px-1">Monthly Attendance (This Month)</p>
                    <div className="space-y-4">
                        {data.monthlyAttendance.map(att => (
                            <div key={att.classId} className="space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-[11px] font-medium text-white max-w-[150px] truncate">{att.className}</p>
                                    <p className="text-[11px] font-bold text-[#00E599]">{att.rate}%</p>
                                </div>
                                <Progress value={att.rate} className="h-1.5 bg-white/5 transition-all" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {data.recentActivities && data.recentActivities.length > 0 && (
                <div className="bg-[#000] p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-4 px-1">Recent Activity</p>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {data.recentActivities.map((act, i) => (
                            <div key={i} className="flex items-start gap-3 text-[11px] border-b border-white/5 pb-2 last:border-0 hover:bg-white/[0.02] p-1 rounded transition-colors">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight bg-white/10 text-white shrink-0">{act.type}</span>
                                <div className="flex-1">
                                    <p className="text-[#CCC] leading-relaxed">{act.description || "No detail provided"}</p>
                                    <p className="text-[9px] text-[#555] mt-1 font-medium">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function OverviewView({ data }: { data: DetailData }) {
    if (!data?.subjectPerformance) return null
    return (
        <div className="space-y-4">
            {data.subjectPerformance.map(sub => (
                <div key={sub.classId} className="p-5 rounded-xl border border-white/5 bg-[#161616] group hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between mb-4">
                        <div className="space-y-0.5">
                            <p className="font-bold text-white text-sm group-hover:text-[#A855F7] transition-colors">{sub.className}</p>
                            <p className="text-[11px] text-[#666] font-medium uppercase tracking-wider">{sub.subject}</p>
                            <p className="text-[10px] text-[#444]">{sub.email}</p>
                        </div>
                        <Badge className={cn(
                            "px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-0",
                            sub.remark === "Excellent" 
                              ? "bg-white/8 text-[#D4D4D4]" 
                              : sub.remark === "Needs Attention" 
                                ? "bg-[#F87171]/10 text-[#F87171]" 
                                : "bg-[#3b82f6]/10 text-[#3b82f6]"
                        )}>
                            {sub.remark}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-[#000] border border-white/5 text-center">
                            <p className="text-[9px] text-[#555] font-bold uppercase mb-1">Exam</p>
                            <p className="text-sm font-bold text-white">{sub.examAvg}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#000] border border-white/5 text-center">
                            <p className="text-[9px] text-[#555] font-bold uppercase mb-1">Attend</p>
                            <p className="text-sm font-bold text-white">{sub.attendance}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#000] border border-white/5 text-center">
                            <p className="text-[9px] text-[#555] font-bold uppercase mb-1">Tasks</p>
                            <p className="text-sm font-bold text-white">{sub.assignmentsSubmitted}/{sub.assignmentsTotal}</p>
                        </div>
                    </div>
                    {sub.teacherRating ? (
                        <div className="flex items-center gap-3 bg-[#000] p-2.5 rounded-lg border border-white/5">
                            <StarDisplay value={sub.teacherRating.rating} />
                            <span className="text-[11px] text-[#8A8A8A] italic leading-tight">{sub.teacherRating.feedback || "No feedback provided"}</span>
                        </div>
                    ) : <p className="text-[10px] text-[#444] italic px-1">Performance feedback pending...</p>}
                </div>
            ))}
        </div>
    )
}

function MonitoringView({ data }: { data: DetailData }) {
    if (!data) return null
    const stats = [
        { label: "Total Logins", value: data.loginCount, color: "text-[#3b82f6]" },
        { label: "Logins This Month", value: data.loginThisMonth, color: "text-[#A855F7]" },
        { label: "Teacher Messages", value: data.teacherInteractions, color: "text-white" },
        { label: "Library Access", value: data.libraryAccess, color: "text-[#FB923C]" },
        { label: "Assignments Submitted", value: data.assignmentsSubmitted, color: "text-[#3b82f6]" },
        { label: "Tasks Submitted", value: data.activityBreakdown?.TASK_SUBMIT, color: "text-cyan-600" },
        { label: "Complaints Raised", value: data.complaintsRaised, color: "text-[#F87171]" },
    ]
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                {stats.map(s => (
                    <div key={s.label} className="p-4 rounded-xl bg-[#000] border border-white/5 relative overflow-hidden group">
                        <div className={cn("absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-10", s.color.replace('text-', 'bg-'))} />
                        <p className={cn("text-2xl font-bold mb-0.5", s.color)}>{s.value ?? 0}</p>
                        <p className="text-[10px] text-[#666] font-bold uppercase tracking-wider">{s.label}</p>
                    </div>
                ))}
            </div>
            {data.complaints && data.complaints.length > 0 && (
                <div className="bg-[#000] p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-4 px-1">Issues & Resolved Complaints</p>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {data.complaints.map((c, i) => (
                            <div key={i} className="p-4 rounded-xl border border-[#F87171]/20 bg-[#F87171]/5 group hover:border-[#F87171]/40 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="text-[9px] font-black tracking-widest bg-black border-white/10 text-white uppercase">{c.category}</Badge>
                                    <Badge className={cn(
                                        "text-[9px] font-black tracking-tighter uppercase px-2 py-0.5",
                                        c.priority === 'HIGH' ? 'bg-[#F87171] text-black shadow-[0_0_10px_rgba(248,113,113,0.3)]' : 'bg-[#FB923C] text-black'
                                    )}>
                                        {c.priority} Priority
                                    </Badge>
                                </div>
                                <p className="text-sm font-bold text-white group-hover:text-[#F87171] transition-colors">{c.title}</p>
                                <div className="flex items-center justify-between mt-4 text-[10px] font-medium text-[#666]">
                                    <span>{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <span className="uppercase tracking-widest border border-white/5 px-1.5 py-0.5 rounded bg-black text-white">{c.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function ClassPerformanceTab() {
    const [students, setStudents] = useState<ClassStudent[]>([])
    const [classes, setClasses] = useState<ClassOption[]>([])
    const [loading, setLoading] = useState(true)
    const [classFilter, setClassFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [selectedStudent, setSelectedStudent] = useState<ClassStudent | null>(null)
    const [dialogView, setDialogView] = useState<"activity" | "overview" | "monitoring" | null>(null)
    const [detailData, setDetailData] = useState<DetailData | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)

    const fetchStudents = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (classFilter !== "all") params.set("classId", classFilter)
            if (search) params.set("search", search)
            const res = await fetch(`/api/teacher/analytics/class-performance?${params}`)
            const data = await res.json()
            if (data.success) { setStudents(data.data.students); setClasses(data.data.classes) }
        } finally { setLoading(false) }
    }, [classFilter, search])

    useEffect(() => { fetchStudents() }, [fetchStudents])

    const openDetail = async (student: ClassStudent, view: "activity" | "overview" | "monitoring") => {
        setSelectedStudent(student)
        setDialogView(view)
        setDetailData(null)
        setDetailLoading(true)
        try {
            const res = await fetch(`/api/teacher/analytics/student-detail/${student.studentId}?view=${view}`)
            const data = await res.json()
            if (data.success) setDetailData(data.data)
        } finally { setDetailLoading(false) }
    }

    const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

    const getRemarkColor = (remark: string) => {
        if (remark === "Excellent") return "bg-white/8 text-[#D4D4D4] border-0"
        if (remark === "Needs Attention") return "bg-[#F87171]/10 text-[#F87171] border-0"
        if (remark === "Good") return "bg-[#3b82f6]/10 text-[#3b82f6] border-0"
        return "bg-white/5 text-[#8A8A8A] border-0"
    }

    return (
        <>
            <Card className="bg-[#161616] border-[#1C1C1C] rounded-[2rem] overflow-hidden relative z-10">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-12 -mt-12 pointer-events-none" />
                <CardHeader className="p-8 border-b border-[#1C1C1C]">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-2">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-white text-sm font-bold uppercase tracking-widest">
                                <Users className="w-4 h-4 text-[#A855F7]" /> Student Performance
                            </CardTitle>
                            <CardDescription className="text-[11px] text-[#555] font-medium uppercase tracking-tighter mt-1">Student metrics and engagement</CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] group-focus-within:text-[#A855F7] transition-all duration-300" />
                            <Input 
                                placeholder="Search students by name or email..." 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                className="pl-10 h-11 bg-[#000]/50 border-white/5 focus:border-[#A855F7]/30 focus:ring-1 focus:ring-[#A855F7]/20 transition-all rounded-xl text-sm placeholder:text-[#333]" 
                            />
                        </div>
                        <Select value={classFilter} onValueChange={setClassFilter}>
                            <SelectTrigger className="w-full md:w-64 h-11 bg-[#000]/50 border-white/5 focus:border-[#A855F7]/30 rounded-xl text-sm text-[#8A8A8A]">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0A0A0A] border-white/10 shadow-2xl rounded-xl">
                                <SelectItem value="all" className="hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider py-2.5">All Active Classes</SelectItem>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id} className="hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider py-2.5">
                                        {c.name} <span className="text-[#444] ml-2 font-medium">({c.code})</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-[#A855F7]" />
                            <p className="text-[10px] text-[#444] font-black uppercase tracking-widest">Loading performance data...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-24 bg-[#000]/30">
                            <Users className="w-12 h-12 mx-auto text-[#222] mb-3" />
                            <p className="text-[#666] font-medium">No students found for this selection</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#1C1C1C] bg-[#000]/50">
                                        {["Student Information", "Class Details", "Academic Avg", "Attendance", "Progress", "Status", "Performance", ""].map(h => (
                                            <th key={h} className="py-4 px-6 text-left text-[10px] font-bold uppercase tracking-widest text-[#555] whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1C1C1C] bg-[#000]/20">
                                    {students.map((s, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10 border border-[#1C1C1C] group-hover:border-[#A855F7]/40 transition-all rounded-xl">
                                                            <AvatarImage src={s.image || undefined} />
                                                            <AvatarFallback className="text-xs font-bold bg-[#111] text-[#A855F7]">{getInitials(s.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black", s.isOnline ? "bg-[#00E599]" : "bg-[#222]")} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-white group-hover:text-[#A855F7] transition-colors truncate tracking-tight">{s.name}</p>
                                                        <p className="text-[11px] text-[#555] font-medium tracking-tight truncate">{s.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight bg-white/5 border-white/10 text-[#CCC] w-fit">{s.classCode}</Badge>
                                                    <span className="text-[9px] text-[#666] font-medium italic truncate max-w-[100px]">{s.className}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={cn(
                                                        "font-black text-sm",
                                                        s.examAvg >= 80 ? "text-white" : s.examAvg >= 60 ? "text-[#3b82f6]" : s.examAvg >= 40 ? "text-[#FACC15]" : "text-[#F87171]"
                                                    )}>
                                                        {s.examAvg > 0 ? `${s.examAvg}%` : <span className="text-[#333] font-normal text-xs">—</span>}
                                                    </span>
                                                    <span className="text-[9px] text-[#444] font-bold uppercase tracking-tighter">Avg Score</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between text-[9px] font-bold mb-1">
                                                        <span className={cn(s.attendanceRate >= 85 ? "text-white" : "text-[#FACC15]")}>{s.attendanceRate}%</span>
                                                    </div>
                                                    <div className="w-16 bg-white/5 rounded-full h-1 overflow-hidden">
                                                        <div 
                                                            className={cn("h-full transition-all", s.attendanceRate >= 85 ? "bg-[#00E599]" : "bg-[#FACC15]")} 
                                                            style={{ "--attendance-width": `${s.attendanceRate}%` } as React.CSSProperties}
                                                        >
                                                            <div className="h-full w-[var(--attendance-width)] bg-inherit" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 w-24">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-black text-white">{s.performanceRate}%</span>
                                                        </div>
                                                        <Progress value={s.performanceRate} className="h-1 bg-white/5" indicatorClassName="bg-[#A855F7] shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-0.5 text-left">
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-tight", s.isOnline ? "text-white" : "text-[#555]")}>{s.isOnline ? "Active Now" : "Logged Out"}</span>
                                                    <span className="text-[9px] text-[#444] font-medium">{s.lastActivity ? formatDistanceToNow(new Date(s.lastActivity), { addSuffix: true }) : "Never seen"}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge className={cn("text-[9px] font-black uppercase tracking-widest", getRemarkColor(s.remark))}>{s.remark}</Badge>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#444] hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#161616] border-white/10 shadow-2xl min-w-[140px]">
                                                        <DropdownMenuItem onClick={() => openDetail(s, "activity")} className="gap-3 cursor-pointer py-2 px-3 text-xs font-bold uppercase tracking-wider text-[#8A8A8A] hover:bg-white/5 hover:text-white transition-colors">
                                                            <Activity className="w-3.5 h-3.5 text-[#3b82f6]" /> Activity
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openDetail(s, "overview")} className="gap-3 cursor-pointer py-2 px-3 text-xs font-bold uppercase tracking-wider text-[#8A8A8A] hover:bg-white/5 hover:text-white transition-colors">
                                                            <Eye className="w-3.5 h-3.5 text-white" /> Overview
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openDetail(s, "monitoring")} className="gap-3 cursor-pointer py-2 px-3 text-xs font-bold uppercase tracking-wider text-[#8A8A8A] hover:bg-white/5 hover:text-white transition-colors">
                                                            <Shield className="w-3.5 h-3.5 text-[#A855F7]" /> Tracking
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!dialogView} onOpenChange={open => !open && setDialogView(null)}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden bg-[#161616] border-white/10 p-0 flex flex-col shadow-2xl">
                    <DialogHeader className="p-6 border-b border-white/5 bg-[#000]/50">
                        {selectedStudent && (
                            <div className="flex items-center gap-4 mb-6">
                                <Avatar className="h-14 w-14 border-2 border-white/10 shadow-xl">
                                    <AvatarImage src={selectedStudent.image || undefined} />
                                    <AvatarFallback className="text-lg font-black bg-[#111] text-[#A855F7]">{getInitials(selectedStudent.name)}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-0.5">
                                    <DialogTitle className="text-xl font-bold text-white tracking-tight leading-none">{selectedStudent.name}</DialogTitle>
                                    <p className="text-[11px] font-bold text-[#555] uppercase tracking-widest mt-1">{selectedStudent.email} · {selectedStudent.className}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-1.5 bg-[#000] p-1 rounded-xl border border-white/5 w-fit">
                            {(["activity", "overview", "monitoring"] as const).map(v => (
                                <Button 
                                    key={v} 
                                    size="sm" 
                                    variant="ghost" 
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-6 h-9 transition-all",
                                        dialogView === v 
                                          ? "bg-white/10 text-white shadow-inner" 
                                          : "text-[#444] hover:text-[#888] hover:bg-white/5"
                                    )} 
                                    onClick={() => { setDialogView(v); if (selectedStudent) openDetail(selectedStudent, v) }}
                                >
                                    {v === "monitoring" ? "tracking" : v}
                                </Button>
                            ))}
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gradient-to-b from-[#161616] to-[#000]">
                        {detailLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-[#A855F7]" />
                                <p className="text-[9px] text-[#444] font-black uppercase tracking-widest">Loading student analysis...</p>
                            </div>
                        ) : detailData ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {dialogView === "activity" && <ActivityView data={detailData} />}
                                {dialogView === "overview" && <OverviewView data={detailData} />}
                                {dialogView === "monitoring" && <MonitoringView data={detailData} />}
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
