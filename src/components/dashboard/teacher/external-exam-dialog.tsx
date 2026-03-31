"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ClassOption {
    id: string
    name: string
    code: string
}

interface StudentOption {
    id: string
    name: string
    enrollmentNo: string | null
}

interface ExternalExamDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    classes: ClassOption[]
    onSuccess: () => void
    report?: any // For editing
}

export function ExternalExamDialog({
    open,
    onOpenChange,
    classes,
    onSuccess,
    report
}: ExternalExamDialogProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [fetchingStudents, setFetchingStudents] = useState(false)
    const [students, setStudents] = useState<StudentOption[]>([])
    
    const [formData, setFormData] = useState({
        classId: "",
        studentId: "",
        examType: "Unit Test",
        testName: "",
        totalMarks: 100,
        obtainedMarks: 0,
        note: ""
    })

    useEffect(() => {
        if (report) {
            setFormData({
                classId: report.classId,
                studentId: report.studentId,
                examType: report.examType,
                testName: report.testName || "",
                totalMarks: report.totalMarks,
                obtainedMarks: report.obtainedMarks,
                note: report.note || ""
            })
        } else {
            setFormData({
                classId: "",
                studentId: "",
                examType: "Unit Test",
                testName: "",
                totalMarks: 100,
                obtainedMarks: 0,
                note: ""
            })
        }
    }, [report, open])

    useEffect(() => {
        if (formData.classId) {
            fetchStudents(formData.classId)
        } else {
            setStudents([])
        }
    }, [formData.classId])

    const fetchStudents = async (id: string) => {
        try {
            setFetchingStudents(true)
            const res = await fetch(`/api/teacher/classes/${id}/students`)
            if (res.ok) {
                const data = await res.json()
                setStudents(data.students || [])
            }
        } catch (error) {
            console.error("Error fetching students:", error)
        } finally {
            setFetchingStudents(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.classId || !formData.studentId || !formData.examType || formData.totalMarks <= 0) {
            toast({
                title: "Error",
                description: "Please fill in all required fields accurately",
                variant: "destructive"
            })
            return
        }

        try {
            setLoading(true)
            const url = report ? `/api/teacher/exams/external/${report.id}` : "/api/teacher/exams/external"
            const method = report ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: formData.studentId,
                    classId: formData.classId,
                    examType: formData.examType,
                    testName: formData.testName,
                    totalMarks: Number(formData.totalMarks),
                    obtainedMarks: Number(formData.obtainedMarks),
                    note: formData.note
                })
            })

            const result = await res.json()

            if (result.success) {
                toast({
                    title: report ? "Report updated" : "Report created",
                    description: report ? "The external exam report has been updated." : "The student marks have been uploaded successfully.",
                    variant: "success"
                })
                onSuccess()
                onOpenChange(false)
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to save report",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save report",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="px-1 text-left">
                        <DialogTitle className="text-xl font-bold text-white">{report ? "Edit External Exam" : "Upload External Exam Marks"}</DialogTitle>
                        <DialogDescription className="text-[#9A9A9A]">
                            Enter marks for physical or external examinations.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="class">Class</Label>
                                <Select 
                                    value={formData.classId} 
                                    onValueChange={(v) => setFormData({ ...formData, classId: v, studentId: "" })}
                                    disabled={!!report}
                                >
                                    <SelectTrigger id="class">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name} ({cls.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student" className="text-[#9A9A9A] font-medium">Student</Label>
                                <Select 
                                    value={formData.studentId} 
                                    onValueChange={(v) => setFormData({ ...formData, studentId: v })}
                                    disabled={!formData.classId || fetchingStudents || !!report}
                                >
                                    <SelectTrigger id="student" className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20 h-9">
                                        <SelectValue placeholder={fetchingStudents ? "Loading..." : "Select Student"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1F1F1F] border-[#1C1C1C] text-white">
                                        {students.map((student) => (
                                            <SelectItem key={student.id} value={student.id} className="hover:bg-white/5 cursor-pointer">
                                                {student.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="examType">Exam Type</Label>
                                <Select 
                                    value={formData.examType} 
                                    onValueChange={(v) => setFormData({ ...formData, examType: v })}
                                >
                                    <SelectTrigger id="examType">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Test">Test</SelectItem>
                                        <SelectItem value="Internal Assessment">Internal Assessment</SelectItem>
                                        <SelectItem value="Unit Test">Unit Test</SelectItem>
                                        <SelectItem value="Final Exam">Final Exam</SelectItem>
                                        <SelectItem value="External Exam">External Exam</SelectItem>
                                        <SelectItem value="End Sem">End Sem</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="testName">Test Name (Optional)</Label>
                                <Input 
                                    id="testName" 
                                    placeholder="e.g. Unit Test 1" 
                                    value={formData.testName}
                                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="totalMarks">Total Marks</Label>
                                <Input 
                                    id="totalMarks" 
                                    type="number" 
                                    value={formData.totalMarks}
                                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="obtainedMarks">Obtained Marks</Label>
                                <Input 
                                    id="obtainedMarks" 
                                    type="number" 
                                    value={formData.obtainedMarks}
                                    onChange={(e) => setFormData({ ...formData, obtainedMarks: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note">Notes / Remarks</Label>
                            <Textarea 
                                id="note" 
                                placeholder="Additional details about the student performance"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 border-t border-[#1C1C1C] pt-4 mt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 px-4 rounded-xl border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="h-9 px-8 rounded-xl bg-white hover:bg-white/90 text-black font-semibold border-none shadow-lg transition-all active:scale-95">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
