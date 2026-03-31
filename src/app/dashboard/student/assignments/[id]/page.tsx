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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import { Loader2, Calendar, FileText, CheckCircle2, Clock, Upload, ArrowLeft, User, AlertCircle } from "lucide-react"

type Submission = {
    id: string
    content: string
    status: string
    grade: number | null
    feedback: string | null
    submittedAt: string
    gradedAt: string | null
}

type AssignmentDetails = {
    id: string
    title: string
    description: string
    instructions: string | null
    dueDate: string
    totalMarks: number
    isActive: boolean
    className: string
    classCode: string
    teacherName: string
    submission: Submission | null
}

export default function StudentSingleAssignmentPage() {
    const { data: session, isPending } = useSession()
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [assignment, setAssignment] = useState<AssignmentDetails | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [submissionContent, setSubmissionContent] = useState("")
    const [attachments, setAttachments] = useState<string[]>([])
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (params.id) {
            fetchAssignmentDetails()
        }
    }, [params.id])

    const fetchAssignmentDetails = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/student/assignments/${params.id}`)
            const data = await res.json()
            if (data.success) {
                setAssignment(data.data)
                setSubmissionContent(data.data.submission?.content || "")
                if (data.data.submission?.attachments) {
                    try {
                        setAttachments(JSON.parse(data.data.submission.attachments))
                    } catch {
                        setAttachments([])
                    }
                }
            } else {
                setError(data.error || "Failed to load assignment details")
            }
        } catch {
            setError("Failed to connect to server")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!assignment || !submissionContent.trim()) return

        setIsSubmitting(true)
        try {
            let finalAttachments = [...attachments]

            // If a new file is attached, upload it first
            if (selectedFile) {
                setIsUploading(true)
                const formData = new FormData()
                formData.append("file", selectedFile)

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                })

                const uploadData = await uploadRes.json()
                if (uploadData.success) {
                    finalAttachments.push(uploadData.data.url)
                    setAttachments(finalAttachments)
                    setSelectedFile(null)
                } else {
                    toast({ title: "Upload Failed", description: uploadData.error, variant: "destructive" })
                    setIsSubmitting(false)
                    setIsUploading(false)
                    return
                }
                setIsUploading(false)
            }

            const res = await fetch(`/api/student/assignments/${assignment.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: submissionContent, attachments: finalAttachments.length > 0 ? finalAttachments : null })
            })
            const data = await res.json()

            if (data.success) {
                toast({ title: "Success", description: "Assignment submitted successfully." })
                fetchAssignmentDetails() // Refresh assignment
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Submission failed.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
            setIsUploading(false)
        }
    }

    if (loading || isPending) {
        return <SkeletonDashboard />
    }

    if (error || !assignment) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Unavailable</h3>
                <p className="text-slate-500 max-w-sm mb-6">{error || "This assignment could not be loaded."}</p>
                <Button onClick={() => router.push("/dashboard/student/assignments")} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignments
                </Button>
            </div>
        )
    }

    const dueDate = new Date(assignment.dueDate)
    const isOverdue = dueDate < new Date() && !assignment.submission
    const hasGraded = assignment.submission?.status === "GRADED"

    return (
        <div className="flex flex-col flex-1 p-8 bg-slate-50 bg-[#1F1F1F] min-h-[calc(100vh-4rem)]">
            <div className="max-w-4xl w-full mx-auto space-y-6">

                <Button variant="ghost" onClick={() => router.push("/dashboard/student/classes")} className="-ml-4 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Class
                </Button>

                <Card className="border shadow-sm bg-[#090909] border-[#1C1C1C]">
                    <CardHeader className="border-b border-slate-100 border-[#1C1C1C] pb-6 bg-white dark:bg-[#0c0c0c] rounded-t-xl relative overflow-hidden">
                        {hasGraded && <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />}

                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <CardTitle className="text-3xl font-bold dark:text-white">{assignment.title}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-2 text-sm font-medium">
                                    <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 px-2.5 py-0.5 rounded-full">{assignment.className} • {assignment.classCode}</span>
                                    <span className="text-slate-500 dark:text-gray-400 flex items-center"><User className="w-4 h-4 mr-1" /> {assignment.teacherName}</span>
                                </CardDescription>
                            </div>

                            <div className="text-right shrink-0">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">Total Marks</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{assignment.totalMarks}</p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 border-[#1C1C1C] bg-slate-50/50 bg-[#1F1F1F]">
                            <div className="flex items-center text-sm">
                                <Calendar className={`w-5 h-5 mr-3 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Due Date</p>
                                    <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-700 dark:text-slate-300 font-medium'}>
                                        {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {assignment.submission ? (
                                <Badge className="bg-blue-500 hover:bg-blue-600 shadow-sm border-0 gap-1.5 py-1 px-3">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> {assignment.submission.status}
                                </Badge>
                            ) : isOverdue ? (
                                <Badge variant="destructive" className="shadow-sm border-0 gap-1.5 py-1 px-3">
                                    Missing
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-slate-500 border-slate-200 dark:text-slate-400 gap-1.5 py-1 px-3">
                                    <Clock className="w-3.5 h-3.5" /> Pending
                                </Badge>
                            )}
                        </div>

                        <div className="p-6 md:p-8 space-y-8">
                            {/* Instructions Section */}
                            <div className="bg-slate-50 bg-[#1F1F1F] border border-slate-100 border-[#1C1C1C] p-6 rounded-xl">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-lg">
                                    <FileText className="w-5 h-5 text-blue-500" /> Instructions & Details
                                </h4>
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {assignment.instructions || assignment.description || "No specific instructions provided. Check the title."}
                                </p>
                            </div>

                            {/* Display Feedback if Graded */}
                            {hasGraded && assignment.submission && (
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-6 rounded-xl">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                                        <h4 className="font-semibold text-green-900 dark:text-green-400 flex items-center gap-2 text-lg">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" /> Teacher Feedback
                                        </h4>
                                        <div className="bg-white dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 text-center shadow-sm">
                                            <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider mb-0.5">Final Score</p>
                                            <p className="text-2xl font-bold text-green-700 dark:text-green-300 leading-none">
                                                {assignment.submission.grade !== null ? assignment.submission.grade : '-'} <span className="text-sm font-medium text-green-600/70">/ {assignment.totalMarks}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap bg-white/50 dark:bg-white/5 p-4 rounded-lg">
                                        {assignment.submission.feedback || <span className="italic opacity-80">No written feedback provided.</span>}
                                    </p>
                                </div>
                            )}

                            {/* Submission Form area */}
                            {!hasGraded ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end border-b border-slate-100 border-[#1C1C1C] pb-2">
                                            <Label htmlFor="submission" className="font-bold text-slate-900 dark:text-white text-lg">Your Submission</Label>
                                            <span className="text-xs text-slate-400">Write your answers or provide links to your work.</span>
                                        </div>
                                        <Textarea
                                            id="submission"
                                            placeholder="Type your submission here... e.g. Link to my Google Doc: https://..."
                                            className="min-h-[150px] p-4 text-base bg-white bg-[#1F1F1F] border-slate-200 border-[#1C1C1C] focus:bg-white dark:focus:bg-[#0a0a0a] text-slate-900 dark:text-white resize-y shadow-sm"
                                            value={submissionContent}
                                            onChange={(e) => setSubmissionContent(e.target.value)}
                                            required
                                        />
                                        <div className="mt-4 border-t border-slate-100 border-[#1C1C1C] pt-4">
                                            <Label htmlFor="file-upload" className="font-semibold text-slate-900 dark:text-white mb-2 block">Upload File (Optional)</Label>
                                            <Input
                                                id="file-upload"
                                                type="file"
                                                className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border-[#1C1C1C] max-w-sm"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files?.[0] || null)}
                                            />
                                            {attachments.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {attachments.map((url, i) => (
                                                        <Badge key={i} variant="outline" className="bg-slate-50 bg-[#161616] text-slate-600 dark:text-gray-300">
                                                            Attached File {i + 1}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3">
                                        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/student/assignments")} disabled={isSubmitting}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md px-8" disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                            {assignment.submission ? 'Update Submission' : 'Turn In'}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-3">
                                    <Label className="font-bold text-slate-900 dark:text-white text-lg border-b border-slate-100 border-[#1C1C1C] pb-2 block">Your Submitted Work</Label>
                                    <div className="bg-white bg-[#090909] p-5 rounded-xl border border-slate-200 border-[#1C1C1C] min-h-[100px] text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap shadow-sm">
                                        {assignment.submission?.content}
                                    </div>
                                    {attachments.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <Label className="font-bold text-slate-900 dark:text-white text-sm">Attached Files</Label>
                                            <div className="flex flex-col gap-2">
                                                {attachments.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-lg border border-slate-200 border-[#1C1C1C] bg-slate-50 hover:bg-slate-100 bg-[#1F1F1F] dark:hover:bg-white/5 transition-colors w-fit">
                                                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">View Uploaded File {i + 1}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
