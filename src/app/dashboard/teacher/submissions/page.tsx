"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    FileText,
    Search,
    Filter,
    CheckCircle,
    Clock,
    Download,
    MoreHorizontal,
    Eye,
    CheckSquare,
    XCircle,
    AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SkeletonTable } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatDate, getInitials, cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Submission {
    id: string
    status: "PENDING" | "SUBMITTED" | "GRADED" | "LATE" | "MISSING"
    submittedAt: string | null
    marks: number | null
    feedback: string | null
    assignment: {
        id: string
        title: string
        totalMarks: number
        className: string
        classCode: string
    }
    student: {
        id: string
        name: string
        email: string
        image: string | null
    }
}

export default function SubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
    const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
    const [gradeMarks, setGradeMarks] = useState("")
    const [gradeFeedback, setGradeFeedback] = useState("")
    const [isSubmittingGrade, setIsSubmittingGrade] = useState(false)
    const { toast } = useToast()

    const fetchSubmissions = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/teacher/submissions")
            const result = await res.json()

            if (result.success) {
                setSubmissions(result.data)
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to fetch submissions",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to connect to server",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSubmissions()
    }, [])

    const handleGradeClick = (submission: Submission) => {
        setSelectedSubmission(submission)
        setGradeMarks(submission.marks?.toString() || "")
        setGradeFeedback(submission.feedback || "")
        setIsGradeDialogOpen(true)
    }

    const handleSubmitGrade = async () => {
        if (!selectedSubmission) return

        const marks = parseFloat(gradeMarks)
        if (isNaN(marks) || marks < 0 || marks > selectedSubmission.assignment.totalMarks) {
            toast({
                title: "Invalid Marks",
                description: `Marks must be between 0 and ${selectedSubmission.assignment.totalMarks}`,
                variant: "destructive",
            })
            return
        }

        try {
            setIsSubmittingGrade(true)
            const res = await fetch(`/api/teacher/submissions/${selectedSubmission.id}/grade`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    marks,
                    feedback: gradeFeedback,
                }),
            })

            const result = await res.json()

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Submission graded successfully",
                    variant: "success",
                })
                setIsGradeDialogOpen(false)
                fetchSubmissions() // Refresh list
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to submit grade",
                variant: "destructive",
            })
        } finally {
            setIsSubmittingGrade(false)
        }
    }

    const filteredSubmissions = submissions.filter(sub => {
        const matchesSearch =
            sub.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.assignment.classCode.toLowerCase().includes(searchQuery.toLowerCase())

        if (statusFilter === "ALL") return matchesSearch
        return matchesSearch && sub.status === statusFilter
    })

    if (loading) return <SkeletonTable />

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Submissions</h1>
                    <p className="text-[#9A9A9A]">Manage and grade student assignments</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Export Grades
                    </Button>
                </div>
            </div>

            <Card className="bg-[#161616] border-[#1C1C1C]">
                <CardHeader className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
                            <Input
                                placeholder="Search by student, assignment or class..."
                                className="pl-8 bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-white/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-[#9A9A9A]" />
                            <select
                                aria-label="Filter submissions by status"
                                className="h-10 rounded-md border border-[#1C1C1C] bg-[#1F1F1F] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="GRADED">Graded</option>
                                <option value="LATE">Late</option>
                                <option value="MISSING">Missing</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-[#9A9A9A] uppercase bg-[#1F1F1F] border-b border-[#1C1C1C]">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Student</th>
                                    <th className="px-6 py-4 font-semibold">Assignment</th>
                                    <th className="px-6 py-4 font-semibold">Class</th>
                                    <th className="px-6 py-4 font-semibold">Submitted</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Marks</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredSubmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No submissions found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubmissions.map((submission) => (
                                        <motion.tr
                                            key={submission.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="bg-transparent hover:bg-[#1F1F1F] border-b border-[#1C1C1C] transition-colors group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-[#1C1C1C]">
                                                        <AvatarImage src={submission.student.image || undefined} />
                                                        <AvatarFallback className="bg-[#1F1F1F] text-white font-bold">{getInitials(submission.student.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-bold text-white group-hover:text-white transition-colors">{submission.student.name}</div>
                                                        <div className="text-xs text-[#9A9A9A]">{submission.student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {submission.assignment.title}
                                            </td>
                                            <td className="px-6 py-4 text-[#9A9A9A]">
                                                {submission.assignment.classCode}
                                            </td>
                                            <td className="px-6 py-4 text-[#9A9A9A]">
                                                {submission.submittedAt ? formatDate(submission.submittedAt) : "-"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={
                                                        submission.status === "GRADED" ? "success" :
                                                            submission.status === "SUBMITTED" ? "default" :
                                                                submission.status === "LATE" ? "warning" :
                                                                    "secondary"
                                                    }
                                                >
                                                    {submission.status.replace("_", " ")}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white">
                                                {submission.marks !== null ? `${submission.marks}/${submission.assignment.totalMarks}` : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleGradeClick(submission)}
                                                    className="text-[#9A9A9A] hover:bg-white/5 hover:text-white transition-all"
                                                >
                                                    <CheckSquare className="w-4 h-4 mr-2" />
                                                    {submission.status === "GRADED" ? "Regrade" : "Grade"}
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Grade Dialog */}
            <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
                <DialogContent className="max-w-lg bg-[#161616] border-[#1C1C1C]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">Grade Submission</DialogTitle>
                        <DialogDescription className="text-[#9A9A9A]">
                            Enter marks and feedback for <strong className="text-white">{selectedSubmission?.student.name}</strong>'s submission.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="marks" className="text-[#9A9A9A] font-medium">
                                Marks (out of {selectedSubmission?.assignment.totalMarks})
                            </Label>
                            <Input
                                id="marks"
                                type="number"
                                value={gradeMarks}
                                onChange={(e) => setGradeMarks(e.target.value)}
                                className="bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                max={selectedSubmission?.assignment.totalMarks}
                                min={0}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="feedback" className="text-[#9A9A9A] font-medium">
                                Feedback
                            </Label>
                            <Textarea
                                id="feedback"
                                value={gradeFeedback}
                                onChange={(e) => setGradeFeedback(e.target.value)}
                                className="min-h-[150px] bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-white/20 resize-none"
                                placeholder="Excellent work! Check your..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)} className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmitGrade} 
                            disabled={isSubmittingGrade}
                            className="bg-white hover:bg-white/90 text-black font-bold px-8"
                        >
                            {isSubmittingGrade ? "Saving..." : "Save Grade"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
