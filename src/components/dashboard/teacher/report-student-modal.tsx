"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportStudentModalProps {
    studentId: string
    studentName: string
    classId?: string
    isOpen: boolean
    onClose: () => void
}

const REASONS = [
    { value: "academic_dishonesty", label: "Academic Dishonesty" },
    { value: "behavioral_issues", label: "Behavioral Issues" },
    { value: "poor_attendance", label: "Poor Attendance" },
    { value: "lack_of_participation", label: "Lack of Participation" },
    { value: "other", label: "Other" },
]

export function ReportStudentModal({ studentId, studentName, classId, isOpen, onClose }: ReportStudentModalProps) {
    const { toast } = useToast()
    const [reason, setReason] = useState("")
    const [details, setDetails] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!reason) {
            toast({ title: "Error", description: "Please select a reason for reporting", variant: "destructive" })
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch("/api/teacher/students/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,
                    classId,
                    reason,
                    details,
                }),
            })

            const result = await res.json()

            if (res.ok) {
                toast({ title: "Report Submitted", description: `Report for ${studentName} has been recorded.` })
                onClose()
                setReason("")
                setDetails("")
            } else {
                toast({ title: "Error", description: result.error || "Failed to submit report", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Connection failed", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#161616] border-[#1C1C1C] text-white max-w-md rounded-3xl p-0 overflow-hidden">
                <div className="p-6 border-b border-[#1C1C1C] bg-[#EF4444]/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-bold">Report Student</DialogTitle>
                        <DialogDescription className="text-xs text-[#555]">
                            Filing report for <span className="text-white font-bold">{studentName}</span>
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-[#555] uppercase tracking-widest ml-1">Reporting Reason</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger className="h-11 bg-black border-[#1C1C1C] text-white rounded-xl focus:ring-0">
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                                {REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value} className="focus:bg-white/5 focus:text-[#EF4444]">
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-[#555] uppercase tracking-widest ml-1">Additional Details</Label>
                        <Textarea
                            className="bg-black border-[#1C1C1C] focus:border-[#EF4444]/40 text-white rounded-2xl min-h-[120px] resize-none p-4 text-sm"
                            placeholder="Provide specific observations or incidents..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="p-6 bg-black/40 border-t border-[#1C1C1C] flex gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="flex-1 text-xs font-bold text-[#555] hover:text-white hover:bg-white/5 rounded-xl h-11"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 bg-[#EF4444] hover:bg-[#D32F2F] text-white text-xs font-bold rounded-xl h-11 shadow-lg shadow-[#EF4444]/20"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Report"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
