"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    BookOpen,
    FileText,
    Calendar,
    Clock,
    ArrowLeft,
    Video,
    Link as LinkIcon,
    File,
    ClipboardList,
    CheckCircle2,
    AlertCircle,
    User,
    Users,
    FolderOpen,
    MessageSquare
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import { getInitials, formatDate, cn } from "@/lib/utils"

// Match exactly what the API returns
interface ClassDetails {
    id: string
    name: string
    code: string
    description: string | null
    subject: string
    department: string
    semester: number
    teacher: {
        name: string
        email: string
        image: string | null
    }
    materials: Array<{
        id: string
        title: string
        description: string | null
        type: string
        url: string | null
        createdAt: string
    }>
    assignments: Array<{
        id: string
        title: string
        description: string | null
        dueDate: string
        totalMarks: number
        isActive: boolean
        submission: {
            status: string
            marks: number | null
            submittedAt: string | null
            feedback: string | null
        } | null
    }>
    exams: Array<{
        id: string
        title: string
        description: string | null
        type: string
        duration: number
        totalMarks: number
        startTime: string
        endTime: string
        isActive: boolean
        attempt: {
            status: string
            obtainedMarks: number | null
            percentage: number | null
            startedAt: string
            submittedAt: string | null
        } | null
    }>
    stats: {
        enrollments: number
        materials: number
        assignments: number
        exams: number
    }
}

function getMaterialIcon(type: string) {
    switch (type.toLowerCase()) {
        case "pdf":
        case "document":
            return <FileText className="w-5 h-5 text-red-500" />
        case "video":
            return <Video className="w-5 h-5 text-blue-500" />
        case "link":
            return <LinkIcon className="w-5 h-5 text-emerald-500" />
        default:
            return <File className="w-5 h-5 text-gray-500" />
    }
}

export default function StudentClassDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ClassDetails | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchClassDetails = async () => {
            try {
                const res = await fetch(`/api/student/classes/${params.id}`)
                const result = await res.json()

                if (result.success) {
                    setData(result.data)
                } else {
                    setError(result.error || "Failed to load class details")
                }
            } catch {
                setError("Failed to connect to server")
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchClassDetails()
        }
    }, [params.id])

    if (loading) return <SkeletonDashboard />

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-center bg-[#161616] rounded-2xl border border-[#1C1C1C] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <AlertCircle className="w-12 h-12 text-rose-500/40 mb-6 relative z-10" />
                <h2 className="text-xl font-bold text-white mb-2 relative z-10">Access Denied</h2>
                <p className="text-[#555] text-xs font-medium max-w-sm mx-auto mb-8 relative z-10">{error || "The requested academic channel is unavailable or access has been restricted."}</p>
                <Button onClick={() => router.push("/dashboard/student/classes")} className="bg-white hover:bg-white/90 text-black font-semibold h-11 px-8 rounded-xl relative z-10 transition-all active:scale-95 border-none">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Classes
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-8 bg-[#090909] min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/student/classes")} className="border-[#1C1C1C] text-[#888] hover:text-white hover:bg-white/5 rounded-xl h-11 w-11 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white tracking-tight border-none bg-transparent">{data.name}</h1>
                            <Badge className="bg-[#1F1F1F] text-[#888] border-[#1C1C1C] font-bold text-[10px] tracking-wider">{data.code}</Badge>
                        </div>
                        <p className="text-[#888] text-sm font-medium mt-1">
                            {data.department} • Semester {data.semester} • {data.subject}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-white hover:bg-white/90 text-black font-semibold h-11 px-6 rounded-xl shadow-lg transition-all active:scale-95 border-none">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Teacher
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full space-y-8">
                <TabsList className="bg-[#161616] border border-[#1C1C1C] p-1 rounded-xl shadow-sm h-12">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:border-[#1C1C1C] border border-transparent transition-all px-8 text-xs font-bold uppercase tracking-wider">Overview</TabsTrigger>
                    <TabsTrigger value="materials" className="rounded-lg data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:border-[#1C1C1C] border border-transparent transition-all px-8 text-xs font-bold uppercase tracking-wider">Materials <Badge className="ml-2 bg-[#1C1C1C] text-[#888] border-0 text-[10px]">{data.stats.materials}</Badge></TabsTrigger>
                    <TabsTrigger value="assignments" className="rounded-lg data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:border-[#1C1C1C] border border-transparent transition-all px-8 text-xs font-bold uppercase tracking-wider">Tasks <Badge className="ml-2 bg-[#1C1C1C] text-[#888] border-0 text-[10px]">{data.stats.assignments}</Badge></TabsTrigger>
                    <TabsTrigger value="exams" className="rounded-lg data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:border-[#1C1C1C] border border-transparent transition-all px-8 text-xs font-bold uppercase tracking-wider">Exams <Badge className="ml-2 bg-[#1C1C1C] text-[#888] border-0 text-[10px]">{data.stats.exams}</Badge></TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                <CardHeader className="border-b border-[#1C1C1C]/50 px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        <CardTitle className="text-white text-xs font-bold uppercase tracking-widest leading-none">COURSE DESCRIPTION</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <p className="text-[#888] text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                        {data.description || "No curriculum description has been provided for this period."}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-[#1C1C1C]/50 px-8 py-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            <CardTitle className="text-white text-xs font-bold uppercase tracking-widest leading-none">RECENT ACTIVITY</CardTitle>
                                        </div>
                                        <CardDescription className="text-[#444] text-[10px] font-bold uppercase tracking-widest">Latest Updates</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="space-y-4">
                                        {data.assignments.slice(0, 2).map(a => (
                                            <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl border border-[#1C1C1C] bg-black/20 hover:bg-[#1F1F1F]/40 transition-all group cursor-pointer">
                                                <div className="w-10 h-10 rounded-lg bg-[#161616] border border-[#1C1C1C] flex items-center justify-center shrink-0 group-hover:border-white/30 transition-all text-white">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white group-hover:text-white transition-colors truncate">New Task: {a.title}</p>
                                                    <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mt-1">Due {formatDate(a.dueDate)}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {data.materials.slice(0, 2).map(m => (
                                            <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-[#1C1C1C] bg-black/20 hover:bg-[#1F1F1F]/40 transition-all group cursor-pointer">
                                                <div className="w-10 h-10 rounded-lg bg-[#161616] border border-[#1C1C1C] flex items-center justify-center shrink-0 group-hover:border-white/30 transition-all text-white">
                                                    {getMaterialIcon(m.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white group-hover:text-white transition-colors truncate">New Resource: {m.title}</p>
                                                    <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mt-1">{formatDate(m.createdAt)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-8">
                            <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-[#1C1C1C]/50 px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        <CardTitle className="text-white text-xs font-bold uppercase tracking-widest leading-none">INSTRUCTOR</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="flex flex-col items-center text-center">
                                        <Avatar className="h-24 w-24 border-2 border-[#1C1C1C] shadow-2xl mb-4">
                                            <AvatarImage src={data.teacher.image || undefined} alt={data.teacher.name} />
                                            <AvatarFallback className="bg-white text-black text-2xl font-bold">
                                                {getInitials(data.teacher.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className="text-lg font-bold text-white leading-tight">{data.teacher.name}</p>
                                        <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mt-2">{data.teacher.email}</p>
                                        <Button variant="outline" className="mt-6 w-full border-[#1C1C1C] text-[#888] hover:text-white hover:bg-white/5 font-bold h-11 transition-all" onClick={() => router.push(`/dashboard/student/messages?teacherId=${data.teacher.email}`)}>
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Send Message
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-[#1C1C1C]/50 px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        <CardTitle className="text-white text-xs font-bold uppercase tracking-widest leading-none">CLASS ANALYTICS</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    {[
                                        { label: "Enrolled Students", value: data.stats.enrollments, icon: Users },
                                        { label: "Total Materials", value: data.stats.materials, icon: FolderOpen },
                                        { label: "Total Assignments", value: data.stats.assignments, icon: FileText },
                                        { label: "Total Exams", value: data.stats.exams, icon: ClipboardList },
                                    ].map((stat, i) => (
                                        <div key={i} className="flex items-center justify-between border-b border-[#1C1C1C] pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <stat.icon className="w-4 h-4 text-[#444]" />
                                                <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest">{stat.label}</span>
                                            </div>
                                            <span className="text-sm font-bold text-white">{stat.value}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="materials" className="outline-none">
                    <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <CardHeader className="border-b border-[#1C1C1C]/50 px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    <CardTitle className="text-white text-xs font-bold uppercase tracking-widest leading-none">ACADEMIC RESOURCES</CardTitle>
                                </div>
                                <CardDescription className="text-[#444] text-[10px] font-bold uppercase tracking-widest">Provided Materials</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {data.materials.length === 0 ? (
                                <div className="text-center py-20 bg-black/20 rounded-2xl border border-[#1C1C1C] border-dashed">
                                    <FolderOpen className="w-12 h-12 text-[#1C1C1C] mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-[#444]">No resources found</h3>
                                    <p className="text-[10px] font-medium text-[#222] uppercase tracking-widest mt-1">Check back later for uploaded materials</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {data.materials.map(material => (
                                        <div key={material.id} className="p-5 rounded-2xl border border-[#1C1C1C] bg-black/20 hover:bg-[#1F1F1F]/40 hover:border-white/30 transition-all group flex flex-col h-full">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-[#161616] border border-[#1C1C1C] flex items-center justify-center shrink-0 group-hover:border-white/30 transition-all text-white">
                                                    {getMaterialIcon(material.type)}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <h4 className="font-bold text-white group-hover:text-white transition-colors truncate leading-tight">{material.title}</h4>
                                                    <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mt-1.5">{formatDate(material.createdAt)}</p>
                                                </div>
                                            </div>
                                            {material.description && (
                                                <p className="text-[#888] text-xs font-medium leading-relaxed line-clamp-2 mb-6 flex-1">{material.description}</p>
                                            )}
                                            {material.url && (
                                                <Button className="w-full bg-white hover:bg-white/90 text-black font-semibold text-[10px] uppercase tracking-widest h-10 transition-all active:scale-95 border-none" asChild>
                                                    <a href={material.url} target="_blank" rel="noopener noreferrer">Access Material</a>
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assignments" className="outline-none">
                    <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <CardHeader className="border-b border-[#1C1C1C]/50 px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    <CardTitle className="text-white text-xs font-bold uppercase tracking-widest leading-none">TASKS & ASSIGNMENTS</CardTitle>
                                </div>
                                <CardDescription className="text-[#444] text-[10px] font-bold uppercase tracking-widest">Enrollment Deliverables</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {data.assignments.length === 0 ? (
                                <div className="text-center py-20 bg-black/20 rounded-2xl border border-[#1C1C1C] border-dashed">
                                    <FileText className="w-12 h-12 text-[#1C1C1C] mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-[#444]">No pending tasks</h3>
                                    <p className="text-[10px] font-medium text-[#222] uppercase tracking-widest mt-1">Academic objectives are current</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {data.assignments.map(assignment => {
                                        const status = assignment.submission?.status || "PENDING"
                                        const isOverdue = new Date(assignment.dueDate) < new Date() && status === "PENDING"

                                        return (
                                            <div key={assignment.id} className="p-5 rounded-2xl border border-[#1C1C1C] bg-black/20 hover:bg-[#1F1F1F]/40 transition-all flex flex-col sm:flex-row gap-6 sm:items-center justify-between group">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl border border-[#1C1C1C] flex items-center justify-center shrink-0 transition-all",
                                                        status === "GRADED" ? "text-white bg-white/10 border-white/20" :
                                                            status === "SUBMITTED" ? "text-amber-500 bg-amber-500/5 border-amber-500/20" :
                                                                isOverdue ? "text-rose-500 bg-rose-500/5 border-rose-500/20" :
                                                                    "text-[#444] bg-[#161616] group-hover:border-white/30"
                                                    )}>
                                                        {status === "GRADED" ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-white leading-tight group-hover:text-white transition-colors">{assignment.title}</h4>
                                                        <div className="flex items-center gap-6 mt-2 text-[10px] font-bold uppercase tracking-widest text-[#444]">
                                                            <span className="flex items-center gap-2">
                                                                <Calendar className="w-3.5 h-3.5 text-white/40" />
                                                                DUE: {formatDate(assignment.dueDate)}
                                                            </span>
                                                            <span className="flex items-center gap-2">
                                                                <div className="w-1 h-1 rounded-full bg-[#1C1C1C]" />
                                                                {assignment.totalMarks} METRICS
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 sm:ml-auto">
                                                    <div className="text-right">
                                                        <Badge className={cn(
                                                            "rounded-md px-3 py-1 text-[10px] font-bold border-0 uppercase tracking-wider",
                                                            status === "GRADED" ? "bg-white/10 text-white" :
                                                                status === "SUBMITTED" ? "bg-amber-500/10 text-amber-500" :
                                                                    isOverdue ? "bg-rose-500/10 text-rose-500" :
                                                                        "bg-[#1F1F1F] text-[#888]"
                                                        )}>
                                                            {status === "PENDING" ? (isOverdue ? "OVERDUE" : "TODO") : status}
                                                        </Badge>
                                                        {status === "GRADED" && (
                                                            <p className="text-xs font-bold text-white mt-2 tracking-widest">
                                                                {assignment.submission?.marks} <span className="text-[10px] opacity-40">/ {assignment.totalMarks}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button onClick={() => router.push(`/dashboard/student/assignments`)} className="bg-white hover:bg-white/90 text-black font-semibold text-[10px] uppercase tracking-widest h-10 px-6 transition-all active:scale-95 border-none">
                                                        View Task
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="exams" className="outline-none">
                    <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <CardHeader className="border-b border-[#1C1C1C]/50 px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    <CardTitle className="text-white text-xs font-bold uppercase tracking-widest leading-none">EXAMINATIONS</CardTitle>
                                </div>
                                <CardDescription className="text-[#444] text-[10px] font-bold uppercase tracking-widest">Academic Assessments</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {data.exams.length === 0 ? (
                                <div className="text-center py-20 bg-black/20 rounded-2xl border border-[#1C1C1C] border-dashed">
                                    <ClipboardList className="w-12 h-12 text-[#1C1C1C] mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-[#444]">No exams listed</h3>
                                    <p className="text-[10px] font-medium text-[#222] uppercase tracking-widest mt-1">Curriculum schedule is clear</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {data.exams.map(exam => {
                                        const now = new Date()
                                        const startTime = new Date(exam.startTime)
                                        const endTime = new Date(exam.endTime)
                                        const isUpcoming = now < startTime
                                        const isLive = now >= startTime && now <= endTime
                                        const isPast = now > endTime
                                        const attempt = exam.attempt

                                        return (
                                            <div key={exam.id} className={cn(
                                                "p-5 rounded-2xl border transition-all flex flex-col sm:flex-row gap-6 sm:items-center justify-between group",
                                                isLive ? "bg-white/5 border-white/20" : "bg-black/20 border-[#1C1C1C] hover:bg-[#1F1F1F]/40"
                                            )}>
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all",
                                                        isLive ? "text-white bg-white/10 border-white/30" : "text-[#444] bg-[#161616] group-hover:border-white/30"
                                                    )}>
                                                        <ClipboardList className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-lg font-bold text-white group-hover:text-white transition-colors leading-tight">{exam.title}</h4>
                                                            {isLive && <Badge className="bg-rose-500 text-white border-0 uppercase text-[9px] font-bold px-2 py-0.5 animate-pulse tracking-widest h-5">LIVE</Badge>}
                                                            {isUpcoming && <Badge className="bg-[#1F1F1F] text-white border border-white/20 uppercase text-[9px] font-bold px-2 py-0.5 tracking-widest h-5">UPCOMING</Badge>}
                                                            {isPast && !attempt && <Badge className="bg-[#1F1F1F] text-rose-500 border border-rose-500/20 uppercase text-[9px] font-bold px-2 py-0.5 tracking-widest h-5">MISSED</Badge>}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-[10px] font-bold uppercase tracking-widest text-[#444]">
                                                            <span className="flex items-center gap-2">
                                                                <Calendar className="w-3.5 h-3.5 text-white/40" />
                                                                {formatDate(exam.startTime)}
                                                            </span>
                                                            <span className="flex items-center gap-2">
                                                                <Clock className="w-3.5 h-3.5 text-white/40" />
                                                                {exam.duration} MINS
                                                            </span>
                                                            <span className="flex items-center gap-2">
                                                                <div className="w-1 h-1 rounded-full bg-[#1C1C1C]" />
                                                                {exam.totalMarks} METRICS
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:items-end gap-3 sm:ml-auto">
                                                    {attempt ? (
                                                        <div className="flex flex-col sm:items-end gap-2">
                                                            {attempt.status === "GRADED" ? (
                                                                <div className="text-right">
                                                                    <p className="text-sm font-bold text-white tracking-tight">SCORE: {attempt.obtainedMarks} <span className="text-[10px] text-[#444]">/ {exam.totalMarks}</span></p>
                                                                    <p className="text-[10px] font-bold text-white uppercase tracking-widest mt-1">{attempt.percentage}% ACHIEVEMENT</p>
                                                                </div>
                                                            ) : (
                                                                <Badge className="bg-amber-500/10 text-amber-500 border-0 uppercase text-[9px] font-bold px-2 py-1 tracking-widest">SUBMITTED</Badge>
                                                            )}
                                                            <Button onClick={() => router.push(`/dashboard/student/exams`)} variant="outline" className="border-[#1C1C1C] text-[#888] hover:text-white hover:bg-white/5 font-bold text-[10px] uppercase tracking-widest h-9 px-4 transition-all">
                                                                View Result
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        isLive ? (
                                                            <Button onClick={() => router.push(`/dashboard/student/exams`)} className="bg-white hover:bg-white/90 text-black font-semibold text-[10px] uppercase tracking-widest h-10 px-8 rounded-xl shadow-lg transition-all active:scale-95 border-none">
                                                                Access Exam
                                                            </Button>
                                                        ) : isUpcoming ? (
                                                            <Button disabled className="bg-[#1F1F1F] text-[#444] border border-[#1C1C1C] font-bold text-[10px] uppercase tracking-widest h-10 px-8 rounded-xl opacity-50">
                                                                Opens Soon
                                                            </Button>
                                                        ) : (
                                                            <Button disabled className="bg-[#1F1F1F] text-[#444] border border-[#1C1C1C] font-bold text-[10px] uppercase tracking-widest h-10 px-8 rounded-xl opacity-50">
                                                                Closed
                                                            </Button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
