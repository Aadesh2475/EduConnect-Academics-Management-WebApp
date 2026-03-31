"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, Trophy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface StudentResult {
    studentId: string
    name: string
    email: string
    image: string | null
    status: "ATTEMPTED" | "PENDING"
    score: number
    percentage: number
    submittedAt: string | null
}

interface ExamResultsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    examId: string | null
}

export function ExamResultsDialog({ open, onOpenChange, examId }: ExamResultsDialogProps) {
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<StudentResult[]>([])
    const [examTitle, setExamTitle] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchResults = async () => {
            if (!examId || !open) return

            setLoading(true)
            try {
                const res = await fetch(`/api/teacher/exams/${examId}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.success) {
                        setResults(data.data.results || [])
                        setExamTitle(data.data.title)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch results", error)
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [examId, open])

    const filteredResults = results.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: results.length,
        attempted: results.filter(r => r.status === "ATTEMPTED").length,
        avgScore: results.reduce((acc, curr) => acc + curr.percentage, 0) / (results.filter(r => r.status === "ATTEMPTED").length || 1)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-[#161616] border-[#1C1C1C]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">Exam Results: {examTitle}</DialogTitle>
                    <DialogDescription className="text-[#9A9A9A]">
                        View student performance and submission status
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-4 py-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#9A9A9A]" />
                        <Input
                            placeholder="Search student..."
                            className="pl-9 bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-white/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 text-sm font-bold">
                        <div className="flex flex-col items-center px-6 bg-[#1F1F1F] rounded-lg justify-center border border-[#1C1C1C]">
                            <span className="text-white">{stats.attempted}/{stats.total}</span>
                            <span className="text-xs text-[#9A9A9A]">Attempted</span>
                        </div>
                        <div className="flex flex-col items-center px-6 bg-[#1F1F1F] rounded-lg justify-center border border-[#1C1C1C]">
                            <span className="text-white">{Math.round(stats.avgScore)}%</span>
                            <span className="text-xs text-[#9A9A9A]">Avg Score</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden border border-[#1C1C1C] rounded-xl bg-[#090909]">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#9A9A9A]" />
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className="bg-[#1F1F1F]">
                                    <TableRow className="border-[#1C1C1C] hover:bg-transparent">
                                        <TableHead className="text-[#9A9A9A] font-bold">Student</TableHead>
                                        <TableHead className="text-[#9A9A9A] font-bold">Status</TableHead>
                                        <TableHead className="text-[#9A9A9A] font-bold">Score</TableHead>
                                        <TableHead className="text-[#9A9A9A] font-bold">Percentage</TableHead>
                                        <TableHead className="text-[#9A9A9A] font-bold">Submitted At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredResults.length === 0 ? (
                                        <TableRow className="hover:bg-transparent border-[#1C1C1C]">
                                            <TableCell colSpan={5} className="text-center py-12 text-[#666666]">
                                                No students found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredResults.map((result) => (
                                            <TableRow key={result.studentId} className="border-[#1C1C1C] hover:bg-[#1F1F1F]/50 transition-colors">
                                                <TableCell className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8 border border-[#1C1C1C]">
                                                        <AvatarImage src={result.image || undefined} />
                                                        <AvatarFallback className="bg-[#1F1F1F] text-white font-bold">{result.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-bold text-sm text-white">{result.name}</p>
                                                        <p className="text-xs text-[#9A9A9A]">{result.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={result.status === "ATTEMPTED" ? "secondary" : "outline"}
                                                        className={result.status === "ATTEMPTED" ? "bg-white/8 text-[#D4D4D4] border-white/10 hover:bg-white/12" : "text-[#9A9A9A] border-[#1C1C1C]"}>
                                                        {result.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold text-white">
                                                    {result.status === "ATTEMPTED" ? result.score : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {result.status === "ATTEMPTED" ? (
                                                        <span className={cn("font-bold text-sm", result.percentage >= 40 ? "text-[#00E599]" : "text-red-500")}>
                                                            {result.percentage.toFixed(1)}%
                                                        </span>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell className="text-[#9A9A9A] text-xs">
                                                    {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
