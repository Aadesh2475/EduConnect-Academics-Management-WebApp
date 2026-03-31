"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useParams, useRouter } from "next/navigation"
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
import { useToast } from "@/hooks/use-toast"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import { Loader2, Calendar, Clock, ArrowLeft, AlertCircle, FileText, CheckCircle2, User } from "lucide-react"

type ExamDetails = {
    id: string
    title: string
    description: string | null
    type: string
    duration: number
    totalMarks: number
    passingMarks: number | null
    startTime: string
    endTime: string
    className: string
    classCode: string
    subject: string
    teacher: {
        name: string
        image: string | null
    }
    questionsCount: number
    status: "AVAILABLE" | "UPCOMING" | "MISSED" | "IN_PROGRESS" | "COMPLETED"
    attempt: {
        id: string
        status: string
        startedAt: string
        submittedAt: string | null
        obtainedMarks: number | null
        percentage: number | null
    } | null
}

export default function StudentSingleExamPage() {
    const { data: session, isPending } = useSession()
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [exam, setExam] = useState<ExamDetails | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)

    useEffect(() => {
        if (params.id) {
            fetchExamDetails()
        }
    }, [params.id])

    const fetchExamDetails = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/student/exams/${params.id}`)
            const data = await res.json()
            if (data.success) {
                setExam(data.data)
            } else {
                setError(data.error || "Failed to load exam details")
            }
        } catch {
            setError("Failed to connect to server")
        } finally {
            setLoading(false)
        }
    }

    const handleStartExam = async () => {
        if (!exam) return

        setIsStarting(true)
        try {
            // Typically, there's a start-exam API. If the student already started it, we just redirect.
            // E.g., const res = await fetch(`/api/student/exams/${exam.id}/start`, { method: "POST" })
            // Since the actual taking of the exam isn't fully scoped here for the instructions, going to the quiz view:
            router.push(`/dashboard/student/quiz?id=${exam.id}`)
        } catch {
            toast({ title: "Error", description: "Could not start exam.", variant: "destructive" })
            setIsStarting(false)
        }
    }

    if (loading || isPending) {
        return <SkeletonDashboard />
    }

    if (error || !exam) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Unavailable</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">{error || "This exam could not be loaded."}</p>
                <Button onClick={() => router.push("/dashboard/student/exams")} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Exams
                </Button>
            </div>
        )
    }

    const isLive = exam.status === "AVAILABLE" || exam.status === "IN_PROGRESS"
    const isCompleted = exam.status === "COMPLETED"
    const isMissed = exam.status === "MISSED"
    const isUpcoming = exam.status === "UPCOMING"

    return (
        <div className="flex flex-col flex-1 p-8 bg-slate-50 bg-[#1F1F1F] min-h-[calc(100vh-4rem)]">
            <div className="max-w-4xl w-full mx-auto space-y-6">

                <Button variant="ghost" onClick={() => router.push("/dashboard/student/exams")} className="-ml-4 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Exams
                </Button>

                <Card className="border shadow-sm bg-[#090909] border-[#1C1C1C]">
                    <CardHeader className="border-b border-slate-100 border-[#1C1C1C] pb-6 bg-white dark:bg-[#0c0c0c] rounded-t-xl relative overflow-hidden">
                        {isLive && <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />}
                        {isCompleted && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />}

                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">{exam.type}</Badge>
                                    {isLive && <Badge className="bg-green-500 hover:bg-green-600 animate-pulse uppercase text-xs">LIVE</Badge>}
                                    {isCompleted && <Badge className="bg-blue-500 hover:bg-blue-600 uppercase text-xs">COMPLETED</Badge>}
                                    {isMissed && <Badge variant="destructive" className="uppercase text-xs">MISSED</Badge>}
                                    {isUpcoming && <Badge variant="secondary" className="uppercase text-xs">UPCOMING</Badge>}
                                </div>
                                <CardTitle className="text-3xl font-bold dark:text-white">{exam.title}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-2 text-sm font-medium">
                                    <span className="text-slate-600 dark:text-gray-300 bg-slate-100 bg-[#161616] px-2.5 py-0.5 rounded-full">{exam.className} • {exam.classCode}</span>
                                    <span className="text-slate-500 flex items-center"><User className="w-4 h-4 mr-1" /> {exam.teacher.name}</span>
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-slate-100 border-[#1C1C1C] divide-slate-100 dark:divide-gray-800 bg-slate-50/50 bg-[#1F1F1F]">
                            <div className="p-6">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4" /> Start Time</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-lg">{new Date(exam.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                            </div>
                            <div className="p-6">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Time Limit</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-lg">{exam.duration} Minutes</p>
                            </div>
                            <div className="p-6">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2"><FileText className="w-4 h-4" /> Assessment</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-lg">{exam.questionsCount} Questions <span className="text-slate-400 text-sm font-normal ml-1">({exam.totalMarks} Marks)</span></p>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 space-y-6">
                            {isCompleted ? (
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Assessment Completed</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mb-6">You submitted this exam on {exam.attempt?.submittedAt ? new Date(exam.attempt.submittedAt).toLocaleString() : 'N/A'}</p>

                                    {exam.attempt?.percentage !== null && (
                                        <div className="flex gap-8 border-t border-blue-200 dark:border-blue-900/30 w-full pt-6 justify-center">
                                            <div>
                                                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">Score</p>
                                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{exam.attempt?.obtainedMarks} <span className="text-lg text-slate-500 font-medium">/ {exam.totalMarks}</span></p>
                                            </div>
                                            <div className="w-px bg-blue-200 dark:bg-blue-900/30" />
                                            <div>
                                                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">Percentage</p>
                                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{exam.attempt?.percentage}%</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Instructions</h3>
                                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {exam.description || "The instructor has not provided specific instructions for this assessment."}
                                        </p>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-5">
                                        <h4 className="font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-2 mb-2">
                                            <AlertCircle className="w-4 h-4" /> Before you begin
                                        </h4>
                                        <ul className="list-disc pl-5 text-sm text-orange-700 dark:text-orange-300 space-y-1">
                                            <li>Ensure you have a stable internet connection.</li>
                                            <li>Once started, the timer cannot be paused.</li>
                                            <li>The exam will auto-submit when the time limit ({exam.duration}m) is reached.</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="p-6 bg-slate-50 bg-[#1F1F1F] border-t border-slate-100 border-[#1C1C1C] rounded-b-xl flex justify-end">
                        {isLive ? (
                            <Button size="lg" onClick={handleStartExam} disabled={isStarting} className="bg-green-600 hover:bg-green-700 text-white shadow-md text-base px-8">
                                {isStarting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                {exam.status === "IN_PROGRESS" ? 'Resume Assessment' : 'Start Assessment'}
                            </Button>
                        ) : isUpcoming ? (
                            <Button size="lg" variant="secondary" disabled className="text-base px-8 cursor-not-allowed border outline-none pointer-events-none">
                                Opens at {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Button>
                        ) : null}
                    </CardFooter>
                </Card>

            </div>
        </div>
    )
}
