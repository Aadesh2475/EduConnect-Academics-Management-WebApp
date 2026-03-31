"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter, useParams } from "next/navigation"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Calendar, FileText, CheckCircle2, Clock, CheckIcon, Sparkles } from "lucide-react"
import Link from "next/link"
import { getInitials } from "@/lib/utils"

type Submission = {
    id: string
    studentId: string
    studentName: string
    studentEmail: string
    studentImage: string | null
    content: string
    attachments: any
    submittedAt: string
    status: string
    grade: number | null
    feedback: string | null
    gradedAt: string | null
}

type SingleAssignment = {
    id: string
    title: string
    description: string
    instructions: string | null
    dueDate: string
    totalMarks: number
    isActive: boolean
    classId: string
    class: { name: string; code: string }
    totalStudents: number
    submissions: Submission[]
}

export default function TeacherAssignmentDetailsPage() {
    const { data: session, isPending } = useSession()
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [assignment, setAssignment] = useState<SingleAssignment | null>(null)

    // Grading State
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
    const [gradeInput, setGradeInput] = useState("")
    const [feedbackInput, setFeedbackInput] = useState("")
    const [isSubmittingGrade, setIsSubmittingGrade] = useState(false)
    const [isAiGrading, setIsAiGrading] = useState(false)
    const [aiConfidence, setAiConfidence] = useState<string | null>(null)

    useEffect(() => {
        if (params.id) {
            fetchAssignmentDetails()
        }
    }, [params.id])

    const fetchAssignmentDetails = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/teacher/assignments/${params.id}`)
            const data = await res.json()
            if (data.success) {
                setAssignment(data.data)
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" })
                router.push("/dashboard/teacher/assignments")
            }
        } catch {
            toast({ title: "Error", description: "Failed to load details.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleGradeSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSubmission || !assignment) return

        const numGrade = parseFloat(gradeInput)
        if (isNaN(numGrade) || numGrade < 0 || numGrade > assignment.totalMarks) {
            toast({ title: "Invalid Grade", description: `Grade must be between 0 and ${assignment.totalMarks}`, variant: "destructive" })
            return
        }

        setIsSubmittingGrade(true)
        try {
            const res = await fetch(`/api/teacher/assignments/${assignment.id}/grade`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionId: selectedSubmission.id,
                    grade: numGrade,
                    feedback: feedbackInput
                })
            })
            const data = await res.json()

            if (data.success) {
                toast({ title: "Success", description: "Grade submitted." })
                setSelectedSubmission(null)
                fetchAssignmentDetails() // Refresh data
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Submission failed.", variant: "destructive" })
        } finally {
            setIsSubmittingGrade(false)
        }
    }

    const handleAiGrade = async () => {
        if (!selectedSubmission || !assignment) return
        setIsAiGrading(true)
        setAiConfidence(null)
        try {
            const res = await fetch(
                `/api/teacher/assignments/${assignment.id}/submissions/${selectedSubmission.id}/ai-grade`,
                { method: "POST" }
            )
            const data = await res.json()
            if (data.success) {
                setGradeInput(String(data.data.suggestedMarks))
                setFeedbackInput(data.data.feedback)
                setAiConfidence(data.data.confidence)
                toast({ title: "🤖 AI Grade Suggestion Ready!", description: `Suggested: ${data.data.suggestedMarks}/${assignment.totalMarks}. Review before saving.` })
            } else {
                toast({ title: "AI Grading Failed", description: data.error, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Could not reach AI grading service.", variant: "destructive" })
        } finally {
            setIsAiGrading(false)
        }
    }

    if (loading || isPending || !assignment) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const dueDateObj = new Date(assignment.dueDate)
    const isOverdue = dueDateObj < new Date() && assignment.isActive

    return (
        <div className="flex-1 space-y-6 p-8 bg-zinc-50 bg-[#090909] min-h-screen">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/teacher/assignments")} className="shrink-0 bg-white bg-[#1F1F1F] border-slate-200 border-[#1C1C1C] dark:text-white">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white border-none">{assignment.title}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">{assignment.class.name} ({assignment.class.code})</Badge>
                        <span>•</span>
                        <span className={`flex items-center ${isOverdue ? 'text-rose-600 font-medium' : ''}`}>
                            <Calendar className="w-3.5 h-3.5 mr-1" /> Due {dueDateObj.toLocaleDateString()} {dueDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>{assignment.totalMarks} Points</span>
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-[#1F1F1F] border-[#1C1C1C]">
                        <CardHeader className="bg-white bg-[#1F1F1F] border-b border-slate-100 border-[#1C1C1C] pb-4">
                            <CardTitle className="text-lg bg-transparent border-none text-slate-900 dark:text-white">Submissions ({assignment.submissions.length}/{assignment.totalStudents})</CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">Review and grade student work.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 bg-white bg-[#1F1F1F]">
                            {assignment.submissions.length === 0 ? (
                                <div className="text-center py-10">
                                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">No submissions yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {assignment.submissions.map((sub) => (
                                        <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#111111] transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={sub.studentImage || undefined} />
                                                    <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{getInitials(sub.studentName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{sub.studentName}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Submitted on {new Date(sub.submittedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {sub.status === "GRADED" ? (
                                                    <div className="text-right">
                                                        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-0 mb-1">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Graded
                                                        </Badge>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{sub.grade} / {assignment.totalMarks}</p>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/10">Needs Grading</Badge>
                                                )}

                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedSubmission(sub)
                                                        setGradeInput(sub.grade !== null ? String(sub.grade) : "")
                                                        setFeedbackInput(sub.feedback || "")
                                                    }}
                                                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                                >
                                                    {sub.status === "GRADED" ? "Edit Grade" : "Review"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-[#1F1F1F] border-[#1C1C1C]">
                        <CardHeader>
                            <CardTitle className="text-lg bg-transparent border-none dark:text-white">Instructions provided</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-700 dark:text-gray-200">
                            {assignment.instructions ? (
                                <div className="whitespace-pre-wrap">{assignment.instructions}</div>
                            ) : (
                                <p className="text-slate-500 dark:text-slate-500 italic">No detailed instructions were provided.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Grade Dialog */}
            <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
                <DialogContent className="sm:max-w-[700px] bg-white bg-[#1F1F1F] border-slate-200 border-[#1C1C1C]">
                    <DialogHeader>
                        <DialogTitle className="text-xl border-none text-slate-900 dark:text-white">Review Submission</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            {selectedSubmission?.studentName}&apos;s work for &quot;{assignment.title}&quot;
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                        {/* Submission Content View */}
                        <div className="bg-slate-50 dark:bg-[#111111] p-5 rounded-xl border border-slate-100 border-[#1C1C1C]">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Student&apos;s Response</h4>
                            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-white bg-[#090909] p-4 rounded-lg border border-slate-200 border-[#1C1C1C] min-h-[80px]">
                                {selectedSubmission?.content || <span className="text-slate-400 dark:text-slate-500 italic">No text provided.</span>}
                            </div>

                            {/* Display Attachments if any */}
                            {selectedSubmission?.attachments && JSON.parse(selectedSubmission.attachments).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-200 border-[#1C1C1C]">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Attached Files</h4>
                                    <div className="flex flex-col gap-2">
                                        {JSON.parse(selectedSubmission.attachments).map((url: string, i: number) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-lg border border-slate-200 border-[#1C1C1C] bg-white hover:bg-slate-50 dark:bg-[#0c0c0c] dark:hover:bg-white/5 transition-colors w-full">
                                                <FileText className="w-4 h-4 mr-3 text-blue-500" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-gray-300 flex-1 truncate">{url.split('/').pop() || `Attachment ${i + 1}`}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Grading Form */}
                        <form onSubmit={handleGradeSubmit} className="space-y-4">
                            {/* AI Auto-Grade Button */}
                            <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
                                <div>
                                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI-Assisted Grading</p>
                                    <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-0.5">Let AI analyze this submission and suggest a grade for you to review.</p>
                                    {aiConfidence && <p className="text-xs text-purple-500 mt-1 font-medium">Confidence: {aiConfidence} — Please review before saving!</p>}
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleAiGrade}
                                    disabled={isAiGrading}
                                    className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                                    size="sm"
                                >
                                    {isAiGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {isAiGrading ? "Analyzing..." : "Auto-Grade"}
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="grade" className="font-semibold text-slate-900 dark:text-white">Points Awarded</Label>
                                    <div className="relative">
                                        <Input
                                            id="grade"
                                            type="number"
                                            min="0"
                                            max={assignment.totalMarks}
                                            step="0.5"
                                            value={gradeInput}
                                            onChange={(e) => setGradeInput(e.target.value)}
                                            className="pr-16 text-lg font-bold bg-white bg-[#090909] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                            required
                                            autoFocus
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium">
                                            / {assignment.totalMarks}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="feedback" className="font-semibold text-slate-900 dark:text-white">Feedback (Optional)</Label>
                                <Textarea
                                    id="feedback"
                                    placeholder="Provide constructive feedback for the student..."
                                    className="min-h-[100px] bg-white bg-[#090909] border-slate-200 border-[#1C1C1C] text-slate-900 dark:text-white"
                                    value={feedbackInput}
                                    onChange={(e) => setFeedbackInput(e.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-4 border-t border-[#1C1C1C]">
                                <Button type="button" variant="outline" onClick={() => setSelectedSubmission(null)} disabled={isSubmittingGrade} className="border-[#1C1C1C] dark:text-white darK:hover:bg-white/5">
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmittingGrade}>
                                    {isSubmittingGrade ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckIcon className="w-4 h-4 mr-2" />}
                                    Save Grade
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
