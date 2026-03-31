"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
    Mail, 
    Calendar, 
    GraduationCap, 
    TrendingUp, 
    Trash2, 
    MessageSquare, 
    AlertTriangle,
    Clock,
    UserCircle
} from "lucide-react"
import { getInitials, formatDate, cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ReportStudentModal } from "./report-student-modal"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface StudentDetailsModalProps {
    student: {
        id: string
        userId: string
        name: string
        email: string
        image: string | null
        department: string | null
        semester: number | null
        batch: string | null
        lastSeen: string | null
        performance: {
            overallScore: number | null
            attendanceRate: number | null
        } | null
        joinedAt: string
    } | null
    isOpen: boolean
    onClose: () => void
    onRemove: (studentId: string) => void
    classId?: string
}

export function StudentDetailsModal({ student, isOpen, onClose, onRemove, classId }: StudentDetailsModalProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [removing, setRemoving] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)

    if (!student) return null

    const handleRemove = async () => {
        setRemoving(true)
        try {
            await onRemove(student.id)
            setIsConfirmRemoveOpen(false)
            onClose()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove student from class",
                variant: "destructive"
            })
        } finally {
            setRemoving(false)
        }
    }

    const handleMessage = () => {
        router.push(`/dashboard/teacher/messages?userId=${student.userId}`)
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="bg-[#161616] border-[#1C1C1C] text-white max-w-lg rounded-3xl p-0 overflow-hidden">
                    <DialogHeader className="p-0">
                        <DialogTitle className="sr-only">Student Details - {student.name}</DialogTitle>
                        <DialogDescription className="sr-only">
                            Detailed overview of student performance, contact info, and academic track.
                        </DialogDescription>
                        <div className="relative h-32 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-b border-[#1C1C1C]">
                            <div className="absolute -bottom-10 left-8">
                                <Avatar className="h-20 w-20 border-4 border-[#161616] shadow-2xl">
                                    <AvatarImage src={student.image || undefined} />
                                    <AvatarFallback className="bg-black text-white text-xl font-bold">
                                        {getInitials(student.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="pt-14 pb-8 px-8 space-y-6">
                        <div>
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold tracking-tight">{student.name}</h2>
                                <Badge className="bg-white/8 text-[#9A9A9A] border-white/10 text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest">
                                    Enrolled
                                </Badge>
                            </div>
                            <p className="text-[#555] font-medium mt-1 flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" />
                                {student.email}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-black/40 border border-[#1C1C1C] space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <GraduationCap className="w-3 h-3 text-[#444]" />
                                    <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest leading-none">Academic Track</p>
                                </div>
                                <p className="text-xs font-bold text-white uppercase">{student.department || "N/A"}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-black/40 border border-[#1C1C1C] space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <UserCircle className="w-3 h-3 text-[#444]" />
                                    <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest leading-none">Status</p>
                                </div>
                                <p className="text-xs font-bold text-white uppercase">S{student.semester || "X"} • {student.batch || "N/A"}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] ml-1">Performance Insight</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C1C] border border-[#222]">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/5 flex items-center justify-center text-emerald-500">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#555] uppercase tracking-tight">Grade Avg</p>
                                        <p className="text-sm font-bold text-white">
                                            {student.performance?.overallScore !== null && student.performance?.overallScore !== undefined 
                                                ? `${student.performance.overallScore}%` 
                                                : "---"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C1C] border border-[#222]">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/5 flex items-center justify-center text-blue-500">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#555] uppercase tracking-tight">Attendance</p>
                                        <p className="text-sm font-bold text-white">
                                            {student.performance?.attendanceRate !== null && student.performance?.attendanceRate !== undefined
                                                ? `${student.performance.attendanceRate}%` 
                                                : "---"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[#1C1C1C] grid grid-cols-2 gap-3">
                            <Button 
                                onClick={handleMessage}
                                className="bg-white hover:bg-white/90 text-black text-xs font-bold h-11 rounded-xl transition-all border-none"
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Message
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsReportModalOpen(true)}
                                className="border-[#1C1C1C] bg-[#1C1C1C] text-white hover:bg-white/5 h-11 text-xs font-bold rounded-xl transition-all"
                            >
                                <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                                Report
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={() => setIsConfirmRemoveOpen(true)}
                                className="col-span-2 h-11 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-1"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove from Class
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ReportStudentModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                studentId={student.id}
                studentName={student.name}
                classId={classId}
            />

            <AlertDialog open={isConfirmRemoveOpen} onOpenChange={setIsConfirmRemoveOpen}>
                <AlertDialogContent className="bg-[#161616] border border-red-500/20 rounded-[2rem] p-8 max-w-sm">
                    <AlertDialogHeader className="space-y-4">
                        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2 text-red-500">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-white text-center tracking-tight">Remove Student?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-[#555] text-center leading-relaxed">
                            Are you sure you want to remove <span className="text-white font-bold">{student.name}</span> from this class? They will be notified of this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-3 mt-8">
                        <AlertDialogCancel className="flex-1 h-12 bg-[#1C1C1C] border-none text-white hover:bg-[#222] rounded-xl font-bold text-[10px] uppercase tracking-widest">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                            onClick={handleRemove}
                            disabled={removing}
                        >
                            {removing ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
