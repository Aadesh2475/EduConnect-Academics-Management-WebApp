"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import { Loader2, Calendar, ClipboardList, Clock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"

type ExamStatus = "AVAILABLE" | "UPCOMING" | "MISSED" | "IN_PROGRESS" | "COMPLETED"

type Exam = {
    id: string
    title: string
    description: string | null
    type: string
    className: string
    classCode: string
    duration: number
    totalMarks: number
    passingMarks: number | null
    startTime: string
    endTime: string
    questionsCount: number
    status: ExamStatus
    attempt: {
        startedAt: string
        submittedAt: string | null
        obtainedMarks: number | null
        percentage: number | null
    } | null
}

export default function StudentExamsPage() {
    const { data: session, isPending } = useSession()
    const router = useRouter()
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [exams, setExams] = useState<Exam[]>([])
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        fetchExams()
    }, [])

    const fetchExams = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/student/exams")
            const data = await res.json()
            if (data.success) {
                setExams(data.data)
                setStats(data.stats)
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to load exams.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    if (loading || isPending) {
        return <SkeletonDashboard />
    }

    const liveExams = exams.filter(e => e.status === "AVAILABLE" || e.status === "IN_PROGRESS")
    const upcomingExams = exams.filter(e => e.status === "UPCOMING")
    const pastExams = exams.filter(e => e.status === "COMPLETED" || e.status === "MISSED")

    const renderExamCard = (exam: Exam, isActiveTab: boolean = false) => {
        const isLive = exam.status === "AVAILABLE" || exam.status === "IN_PROGRESS"
        const isCompleted = exam.status === "COMPLETED"
        const isMissed = exam.status === "MISSED"

        return (
            <Card key={exam.id} className={`flex flex-col hover:shadow-lg transition-all duration-300 border-t-4 bg-[#161616] border-[#1C1C1C] ${isLive ? 'border-t-[#00E599]' : isCompleted ? 'border-t-[#00E599]/40' : isMissed ? 'border-t-rose-500' : 'border-t-[#1C1C1C]'}`}>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase border-gray-200">{exam.type}</Badge>
                                {isLive && <Badge className="bg-green-500 hover:bg-green-600 animate-pulse uppercase text-[10px] px-1.5 py-0">LIVE</Badge>}
                                {isMissed && <Badge variant="destructive" className="uppercase text-[10px] px-1.5 py-0 mx-0">MISSED</Badge>}
                            </div>
                            <CardTitle className="text-lg font-bold line-clamp-1 border-none bg-transparent">{exam.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1.5 text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-[#00E599] bg-[#00E599]/10 border border-[#00E599]/20 px-2 py-0.5 rounded-md">{exam.className} • {exam.classCode}</span>
                            </CardDescription>
                        </div>
                        {isCompleted && exam.attempt?.percentage !== null && (
                            <div className="text-right shrink-0 bg-[#00E599]/10 px-3 py-1.5 rounded-lg border border-[#00E599]/20">
                                <p className="text-[10px] text-[#00E599] font-bold mb-0.5 uppercase tracking-widest">Score</p>
                                <p className="text-lg font-bold text-white leading-none">{exam.attempt?.obtainedMarks} <span className="text-sm font-medium text-[#444]">/ {exam.totalMarks}</span></p>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">{exam.description || "No description provided."}</p>

                    <div className="space-y-2 mt-auto">
                        <div className="flex items-center text-sm text-slate-500 bg-slate-50 p-2 rounded-md justify-between">
                            <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                {new Date(exam.startTime).toLocaleDateString()}
                            </span>
                            <span className="flex items-center font-medium">
                                <Clock className="w-4 h-4 mr-1 text-slate-400" />
                                {exam.duration}m
                            </span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-2 pb-4 border-t border-slate-100 bg-slate-50/50">
                    {isLive ? (
                        <Button onClick={() => router.push(`/dashboard/student/exams/${exam.id}`)} className="w-full bg-white hover:bg-white/90 text-black font-semibold text-xs h-10 transition-all active:scale-95 border-none">
                            {exam.status === "IN_PROGRESS" ? 'Resume Exam' : 'Start Exam'} <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : isCompleted ? (
                        <Button onClick={() => router.push(`/dashboard/student/exams/${exam.id}`)} className="w-full bg-white hover:bg-white/90 text-black font-semibold text-xs h-10 transition-all active:scale-95 border-none">
                            View Results
                        </Button>
                    ) : exam.status === "UPCOMING" ? (
                        <Button variant="secondary" className="w-full bg-gray-100 text-gray-400 cursor-not-allowed border outline-none pointer-events-none">
                            Opens {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Button>
                    ) : (
                        <Button className="w-full bg-white hover:bg-white/90 text-black font-semibold text-xs h-10 transition-all active:scale-95 border-none" onClick={() => router.push(`/dashboard/student/exams/${exam.id}`)}>
                            View Missed Exam Details
                        </Button>
                    )}
                </CardFooter>
            </Card>
        )
    }

    return (
        <div className="flex-1 space-y-8 p-8 bg-[#1F1F1F] min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white border-none bg-transparent">Exams & Quizzes</h2>
                    <p className="text-slate-500 dark:text-gray-400 mt-2">View and take your scheduled assessments.</p>
                </div>

                {stats && (
                    <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-[#1C1C1C] shadow-sm">
                        <div className="text-center px-4 border-r border-[#1C1C1C]">
                            <p className="text-2xl font-bold text-[#00E599]">{stats.avgScore}%</p>
                            <p className="text-[10px] text-[#444] uppercase tracking-widest font-bold">Avg Score</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-2xl font-bold text-white">{stats.completed}</p>
                            <p className="text-[10px] text-[#444] uppercase tracking-widest font-bold">Completed</p>
                        </div>
                    </div>
                )}
            </div>

            <Tabs defaultValue="live" className="space-y-6">
                <TabsList className="bg-[#090909] border border-[#1C1C1C] p-1 rounded-xl shadow-sm h-12">
                    <TabsTrigger value="live" className="rounded-lg data-[state=active]:bg-[#00E599]/10 data-[state=active]:text-[#00E599] data-[state=active]:border-[#00E599]/20 border border-transparent transition-all px-6 text-xs font-bold uppercase tracking-wider">
                        Live <Badge className="ml-2 bg-[#00E599] text-black border-0">{liveExams.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:border-[#1C1C1C] border border-transparent transition-all px-6 text-xs font-bold uppercase tracking-wider">
                        Upcoming <Badge className="ml-2 bg-[#1C1C1C] text-[#888] border-0">{upcomingExams.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-[#00E599]/10 data-[state=active]:text-[#00E599] data-[state=active]:border-[#00E599]/20 border border-transparent transition-all px-6 text-xs font-bold uppercase tracking-wider">
                        Completed
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="live" className="m-0">
                    {liveExams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-[#090909] rounded-2xl border border-[#1C1C1C] shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E599]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border border-[#1C1C1C] flex items-center justify-center mb-6 relative z-10">
                                <CheckCircle2 className="w-8 h-8 text-[#444]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 relative z-10">No live exams</h3>
                            <p className="text-[#555] text-xs font-medium max-w-sm mx-auto relative z-10">You don't have any exams that are currently open.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {liveExams.map(e => renderExamCard(e, true))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="upcoming" className="m-0">
                    {upcomingExams.length === 0 ? (
                        <div className="py-20 text-center bg-white bg-[#090909] rounded-2xl border border-slate-100 border-[#1C1C1C] shadow-sm">
                            <p className="text-slate-500">No upcoming exams scheduled.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {upcomingExams.map(e => renderExamCard(e))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="m-0">
                    {pastExams.length === 0 ? (
                        <div className="py-20 text-center bg-white bg-[#090909] rounded-2xl border border-slate-100 border-[#1C1C1C] shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                                <ClipboardList className="w-8 h-8 text-blue-400" />
                            </div>
                            <p className="text-slate-500">You haven't completed any exams yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pastExams.map(e => renderExamCard(e))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
