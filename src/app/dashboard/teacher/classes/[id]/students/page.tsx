"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users,
    Search,
    UserX,
    Mail,
    MoreVertical,
    ChevronLeft,
    ShieldAlert,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { SkeletonTable } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { getInitials } from "@/lib/utils"

interface Student {
    id: string
    userId: string
    enrollmentId: string
    name: string
    email: string
    image?: string
    enrollmentNo?: string
    joinedAt: string
}

export default function ClassStudentsPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<Student[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [studentToRemove, setStudentToRemove] = useState<Student | null>(null)
    const [removing, setRemoving] = useState(false)

    const classId = params.id as string

    useEffect(() => {
        fetchStudents()
    }, [classId])

    const fetchStudents = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/teacher/classes/${classId}/students`)
            const result = await res.json()

            if (res.ok) {
                setStudents(result.students)
            } else {
                toast({ title: "Error", description: result.error || "Failed to load students", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveStudent = async () => {
        if (!studentToRemove) return

        setRemoving(true)
        try {
            const res = await fetch(`/api/teacher/classes/${classId}/students`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: studentToRemove.id }),
            })
            const result = await res.json()

            if (res.ok) {
                setStudents(prev => prev.filter(s => s.id !== studentToRemove.id))
                toast({ title: "Removed", description: `${studentToRemove.name} has been removed from the class`, variant: "success" })
                setStudentToRemove(null)
            } else {
                toast({ title: "Error", description: result.error || "Failed to remove student", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
        } finally {
            setRemoving(false)
        }
    }

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.enrollmentNo && student.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-8 min-h-screen bg-[#000] -m-6 p-8 relative overflow-hidden">
             {/* Background Glow */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E599]/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1C1C1C] pb-8">
                <div className="space-y-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.back()}
                        className="h-8 px-3 text-[#555] hover:text-[#00E599] hover:bg-[#00E599]/5 rounded-lg group transition-all"
                    >
                        <ChevronLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight uppercase">Students</h1>
                        <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mt-1">
                            Student roster and management
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-full sm:w-72 group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#444] group-hover:text-[#00E599] transition-colors w-4 h-4" />
                        <Input
                            placeholder="Find student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-12 bg-[#161616] border-[#1C1C1C] focus:border-[#00E599]/50 text-white rounded-xl transition-all font-medium text-[10px] uppercase tracking-widest"
                        />
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-[#161616] border border-[#1C1C1C] flex items-center gap-3">
                        <Users className="w-4 h-4 text-[#00E599]" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none">
                            {loading ? "..." : String(students.length).padStart(2, '0')} Students
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 bg-[#161616] border border-[#1C1C1C] rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-[#161616] border border-[#1C1C1C] border-dashed rounded-[2rem]">
                        <div className="w-16 h-16 rounded-[2rem] bg-[#00E599]/5 border border-[#1C1C1C] flex items-center justify-center mb-6">
                            <Users className="w-8 h-8 text-[#222]" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No students found</h3>
                        <p className="text-sm text-[#444] font-medium max-w-xs">
                            {searchQuery ? "Your search query yielded no results." : "No students have enrolled in this class yet."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {filteredStudents.map((student) => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative flex items-center justify-between p-5 bg-[#161616] border border-[#1C1C1C] rounded-2xl hover:border-[#00E599]/30 transition-all duration-300 overflow-hidden"
                                >
                                    {/* Background Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#00E599]/0 to-[#00E599]/0 group-hover:from-[#00E599]/5 group-hover:to-transparent transition-all duration-500" />
                                    
                                    <div className="relative z-10 flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-12 w-12 rounded-2xl border-2 border-[#1C1C1C] group-hover:border-[#00E599]/50 transition-all shadow-2xl">
                                                <AvatarImage src={student.image} />
                                                <AvatarFallback className="bg-black text-[#00E599] font-bold text-base">
                                                    {getInitials(student.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-lg bg-[#161616] border border-[#1C1C1C] flex items-center justify-center">
                                                <div className="w-1 h-1 rounded-full bg-[#00E599] animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-[#00E599] transition-colors">{student.name}</h4>
                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-2.5 h-2.5 text-[#333]" />
                                                    <span className="text-[9px] font-bold text-[#555] lowercase tracking-wide">{student.email}</span>
                                                </div>
                                                {student.enrollmentNo && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-[#222]" />
                                                        <span className="text-[8px] font-black text-[#444] uppercase tracking-widest">ID: {student.enrollmentNo}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-[#444] hover:text-[#00E599] hover:bg-[#00E599]/10 rounded-xl transition-all">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#161616] border-[#1C1C1C] rounded-xl p-1 shadow-2xl">
                                                <DropdownMenuItem 
                                                    className="text-[#EF4444] focus:text-white focus:bg-[#EF4444] rounded-lg cursor-pointer font-bold text-[10px] uppercase tracking-widest p-3" 
                                                    onClick={() => setStudentToRemove(student)}
                                                >
                                                    <UserX className="w-4 h-4 mr-2" />
                                                    Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <Dialog open={!!studentToRemove} onOpenChange={(open) => !open && setStudentToRemove(null)}>
                <DialogContent className="bg-[#161616] border border-[#EF4444]/20 rounded-3xl p-8 max-w-md overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#EF4444]/5 blur-[60px] rounded-full pointer-events-none" />
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mx-auto mb-2 relative z-10">
                            <ShieldAlert className="w-8 h-8 text-[#EF4444]" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-white text-center relative z-10">Remove Student</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-[#555] text-center leading-relaxed relative z-10">
                            You are about to remove <span className="text-[#EF4444] font-bold">"{studentToRemove?.name}"</span>. 
                            This student will no longer have access to this class.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-row gap-4 mt-8 relative z-10">
                        <Button 
                            variant="outline" 
                            className="flex-1 h-11 bg-transparent border-[#1C1C1C] text-[#888] hover:bg-[#1C1C1C] hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                            onClick={() => setStudentToRemove(null)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="flex-1 h-11 bg-[#EF4444] hover:bg-[#D32F2F] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-[0_4px_20_rgba(239,68,68,0.2)]"
                            onClick={handleRemoveStudent} 
                            disabled={removing}
                        >
                            {removing ? "Removing..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
