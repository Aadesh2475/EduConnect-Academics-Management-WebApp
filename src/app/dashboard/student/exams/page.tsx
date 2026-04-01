"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
import { Loader2, Calendar, ClipboardList, Clock, ArrowRight, CheckCircle2, AlertCircle, BookOpen } from "lucide-react"

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
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        )
    }

    const liveExams = exams.filter(e => e.status === "AVAILABLE" || e.status === "IN_PROGRESS")
    const upcomingExams = exams.filter(e => e.status === "UPCOMING")
    const pastExams = exams.filter(e => e.status === "COMPLETED" || e.status === "MISSED")

    const renderExamCard = (exam: Exam, isActiveTab: boolean = false) => {
        const isLive = exam.status === "AVAILABLE" || exam.status === "IN_PROGRESS"
        const isCompleted = exam.status === "COMPLETED"
        const isMissed = exam.status === "MISSED"

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={exam.id}
            >
                <Card className={`flex flex-col h-full hover:shadow-lg transition-all duration-300 bg-[#161616] border-[#1C1C1C] hover:border-[#444] rounded-2xl overflow-hidden group relative`}>
                    {isLive && (
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-white/50" />
                    )}
                    {isMissed && (
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500/50" />
                    )}
                    <CardHeader className="pb-4 pt-6 px-6">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 uppercase border-white/20 text-white bg-white/5">{exam.type}</Badge>
                                    {isLive && <Badge className="bg-white hover:bg-white animate-pulse uppercase text-[10px] px-2 py-0.5 text-black">LIVE</Badge>}
                                    {isMissed && <Badge variant="destructive" className="uppercase text-[10px] px-2 py-0.5 mx-0 bg-red-500/10 text-red-500 border-0">MISSED</Badge>}
                                </div>
                                <CardTitle className="text-lg font-bold line-clamp-1 border-none bg-transparent text-white group-hover:text-white transition-colors">
                                    {exam.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2 text-[10px] font-bold uppercase tracking-wider">
                                    <span className="text-white bg-white/10 border border-white/20 px-2 py-1 rounded-md">{exam.className} • {exam.classCode}</span>
                                </div>
                            </div>
                            {isCompleted && exam.attempt?.percentage !== null && (
                                <div className="text-right shrink-0 bg-[#111111] px-3 py-2 rounded-xl border border-[#252525]">
                                    <p className="text-[9px] text-[#888] font-bold mb-0.5 uppercase tracking-widest">Score</p>
                                    <p className="text-lg font-bold text-white leading-none">
                                        {exam.attempt?.obtainedMarks} <span className="text-sm font-medium text-[#555]">/ {exam.totalMarks}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4 px-6">
                        <p className="text-sm text-[#9A9A9A] line-clamp-2 mb-6 leading-relaxed">
                            {exam.description || "No description provided."}
                        </p>

                        <div className="space-y-2 mt-auto">
                            <div className="flex items-center text-xs font-medium text-[#888] bg-[#111111] px-3 py-2.5 rounded-lg border border-[#252525] justify-between">
                                <span className="flex items-center">
                                    <Calendar className="w-3.5 h-3.5 mr-2 text-[#555]" />
                                    {new Date(exam.startTime).toLocaleDateString()}
                                </span>
                                <span className="flex items-center text-white">
                                    <Clock className="w-3.5 h-3.5 mr-2 text-[#555]" />
                                    {exam.duration}m
                                </span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-4 pb-5 px-6 border-t border-[#252525] bg-[#1A1A1A] flex flex-col gap-3">
                        {isLive ? (
                            <Button onClick={() => router.push(`/dashboard/student/exams/${exam.id}`)} className="w-full bg-white hover:bg-gray-200 text-black font-bold h-11 rounded-xl transition-all active:scale-95 shadow-none group-hover:bg-white group-hover:text-black">
                                {exam.status === "IN_PROGRESS" ? 'Resume Exam' : 'Start Exam'} <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : isCompleted ? (
                            <Button onClick={() => router.push(`/dashboard/student/exams/${exam.id}`)} variant="outline" className="w-full bg-transparent border-[#333] hover:border-white text-white font-bold h-11 rounded-xl transition-all active:scale-95 shadow-none hover:bg-white/5">
                                View Results
                            </Button>
                        ) : exam.status === "UPCOMING" ? (
                            <Button variant="outline" className="w-full bg-[#111111] border-[#252525] text-[#555] font-bold h-11 rounded-xl cursor-not-allowed pointer-events-none shadow-none">
                                Opens {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Button>
                        ) : (
                            <Button variant="outline" className="w-full bg-red-500/5 hover:bg-red-500/10 border-red-500/20 hover:border-red-500/30 text-red-500 font-bold h-11 rounded-xl transition-all active:scale-95 shadow-none" onClick={() => router.push(`/dashboard/student/exams/${exam.id}`)}>
                                View Missed Exam Details
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </motion.div>
        )
    }

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Exams & Quizzes</h1>
                    <p className="text-[#9A9A9A] text-sm mt-1">View and take your scheduled assessments.</p>
                </div>

                {stats && (
                    <div className="flex items-center gap-4 bg-[#111111] p-3 rounded-xl border border-[#1C1C1C] shadow-none w-full md:w-auto">
                        <div className="text-center px-4 border-r border-[#252525] flex-1 md:flex-none">
                            <p className="text-2xl font-bold text-white">{stats.avgScore}%</p>
                            <p className="text-[9px] text-[#888] uppercase tracking-widest font-bold mt-0.5">Avg Score</p>
                        </div>
                        <div className="text-center px-4 flex-1 md:flex-none">
                            <p className="text-2xl font-bold text-white">{stats.completed}</p>
                            <p className="text-[9px] text-[#888] uppercase tracking-widest font-bold mt-0.5">Completed</p>
                        </div>
                    </div>
                )}
            </div>

            <Tabs defaultValue="live" className="space-y-6">
                <TabsList className="bg-[#161616] border border-[#1C1C1C] p-1.5 rounded-xl h-12 w-full sm:w-auto justify-start overflow-x-auto no-scrollbar">
                    <TabsTrigger value="live" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/10 border border-transparent transition-all px-5 sm:px-6 text-xs font-bold uppercase tracking-wider text-[#888] whitespace-nowrap shrink-0">
                        Live <Badge className="ml-2 bg-white text-black border-0">{liveExams.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/10 border border-transparent transition-all px-5 sm:px-6 text-xs font-bold uppercase tracking-wider text-[#888] whitespace-nowrap shrink-0">
                        Upcoming <Badge className="ml-2 bg-[#1C1C1C] text-[#888] border-0">{upcomingExams.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/10 border border-transparent transition-all px-5 sm:px-6 text-xs font-bold uppercase tracking-wider text-[#888] whitespace-nowrap shrink-0">
                        Completed
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="live" className="m-0 mt-6">
                    {liveExams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-[#161616] rounded-2xl border border-[#1C1C1C] shadow-none overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center mb-6 relative z-10 transition-transform hover:scale-110 duration-500">
                                <CheckCircle2 className="w-8 h-8 text-[#555]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 relative z-10">No live exams</h3>
                            <p className="text-[#888] text-sm font-medium max-w-sm mx-auto relative z-10">You don't have any exams that are currently open.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {liveExams.map(e => renderExamCard(e, true))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="upcoming" className="m-0 mt-6">
                    {upcomingExams.length === 0 ? (
                        <div className="py-24 text-center bg-[#161616] rounded-2xl border border-[#1C1C1C] shadow-none">
                            <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center mx-auto mb-6">
                                <Calendar className="w-8 h-8 text-[#555]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No upcoming exams</h3>
                            <p className="text-[#888] text-sm font-medium">No upcoming exams scheduled.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {upcomingExams.map(e => renderExamCard(e))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="m-0 mt-6">
                    {pastExams.length === 0 ? (
                        <div className="py-24 text-center bg-[#161616] rounded-2xl border border-[#1C1C1C] shadow-none">
                            <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center mx-auto mb-6">
                                <ClipboardList className="w-8 h-8 text-[#555]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No past exams</h3>
                            <p className="text-[#888] text-sm font-medium">You haven't completed any exams yet.</p>
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
