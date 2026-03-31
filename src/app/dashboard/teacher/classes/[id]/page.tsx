"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    Users,
    BookOpen,
    FileText,
    Clock,
    Calendar,
    MoreHorizontal,
    Plus,
    Settings,
    ArrowLeft,
    GraduationCap,
    Radio,
    MessageSquare,
    AlertTriangle,
    Trash2,
    Eye,
    ExternalLink,
    RefreshCw
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { formatDate, getInitials, cn } from "@/lib/utils"
import { StudentDetailsModal } from "@/components/dashboard/teacher/student-details-modal"
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

interface Student {
    id: string
    userId: string
    name: string
    email: string
    image: string | null
    department: string | null
    semester: number | null
    batch: string | null
    lastSeen: string | null
    joinedAt: string
    performance: {
        overallScore: number | null
        attendanceRate: number | null
    } | null
}

interface Assignment {
    id: string
    title: string
    dueDate: string
    totalMarks: number
    _count: { submissions: number }
}

interface Exam {
    id: string
    title: string
    startTime: string
    type: string
    duration: number
    _count: { attempts: number }
}

interface ClassDetail {
    id: string
    name: string
    code: string
    description: string | null
    subject: string
    department: string
    semester: number
    isActive: boolean
    createdAt: string
    studentCount: number
    assignmentCount: number
    examCount: number
    materialCount: number
    recentStudents: Array<{
        id: string
        name: string
        email: string
        image: string | null
    }>
    ongoingAssignments: Array<{
        id: string
        title: string
        dueDate: string
    }>
    upcomingExams: Array<{
        id: string
        title: string
        startTime: string
        type: string
    }>
}

export default function ClassDetailPage() {
    const params = useParams()
    const router = useRouter()
    const classId = params.id as string
    const [classData, setClassData] = useState<ClassDetail | null>(null)
    const [students, setStudents] = useState<Student[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [exams, setExams] = useState<Exam[]>([])
    
    const [loading, setLoading] = useState(true)
    const [loadingTab, setLoadingTab] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    // Modal state
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [studentToRemove, setStudentToRemove] = useState<Student | null>(null)
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const res = await fetch(`/api/teacher/classes/${classId}`)
                const result = await res.json()

                if (result.success) {
                    setClassData(result.data)
                } else {
                    setError(result.error || "Failed to load class details")
                }
            } catch (err) {
                setError("Failed to connect to server")
            } finally {
                setLoading(false)
            }
        }

        if (classId) {
            fetchInitialData()
        }
    }, [classId])

    const fetchStudents = async () => {
        setLoadingTab(true)
        try {
            const res = await fetch(`/api/teacher/classes/${classId}/students`)
            const result = await res.json()
            if (result.success) setStudents(result.data)
        } finally {
            setLoadingTab(false)
        }
    }

    const fetchAssignments = async () => {
        setLoadingTab(true)
        try {
            const res = await fetch(`/api/teacher/classes/${classId}/assignments`)
            const result = await res.json()
            if (result.success) setAssignments(result.data)
        } finally {
            setLoadingTab(false)
        }
    }

    const fetchExams = async () => {
        setLoadingTab(true)
        try {
            const res = await fetch(`/api/teacher/classes/${classId}/exams`)
            const result = await res.json()
            if (result.success) setExams(result.data)
        } finally {
            setLoadingTab(false)
        }
    }

    const handleRemoveStudent = async (studentId: string) => {
        setIsRemoving(true)
        try {
            // Updated to ensure studentId is in the path to match the [studentId] route correctly
            const res = await fetch(`/api/teacher/classes/${classId}/students/${studentId}`, {
                method: "DELETE"
            })
            const result = await res.json()

            if (result.success) {
                toast({ title: "Success", description: "Student removed from class" })
                // Update roster list
                setStudents(prev => prev.filter(s => s.id !== studentId))
                // Update overview stats and recent list for real-time consistency
                if (classData) {
                    setClassData({ 
                        ...classData, 
                        studentCount: Math.max(0, classData.studentCount - 1),
                        recentStudents: classData.recentStudents.filter(s => s.id !== studentId)
                    })
                }
                setIsRemoveDialogOpen(false)
                setStudentToRemove(null)
                setIsModalOpen(false)
            } else {
                toast({ title: "Error", description: result.error || "Failed to remove student", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Connection failed", variant: "destructive" })
        } finally {
            setIsRemoving(false)
        }
    }

    const handleTabChange = (value: string) => {
        if (value === "students") fetchStudents()
        else if (value === "assignments") fetchAssignments()
        else if (value === "exams") fetchExams()
    }

    if (loading) return <SkeletonDashboard />

    if (error || !classData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Class Not Found</h2>
                <p className="text-gray-500 mb-6">{error || "The requested class does not exist or you don't have access."}</p>
                <Link href="/dashboard/teacher/classes">
                    <Button className="bg-white hover:bg-white/90 text-black font-semibold h-11 px-8 rounded-xl transition-all active:scale-95 border-none">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Classes
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 min-h-screen bg-[#000] -m-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-[#1C1C1C] pb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Link href="/dashboard/teacher/classes" className="text-[11px] font-medium text-[#B5B5B5] hover:text-white transition-colors">
                            Classes
                        </Link>
                        <span className="text-[#1C1C1C] text-xs">/</span>
                        <span className="text-[11px] font-medium text-[#00E599]">{classData.code}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-3">{classData.name}</h1>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-[#00E599]/10 text-[#00E599] border-none text-[11px] font-semibold px-3 py-1 rounded-lg">
                            {classData.department}
                        </Badge>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1C1C1C]" />
                        <span className="text-xs font-medium text-[#B5B5B5]">Semester {classData.semester}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1C1C1C]" />
                        <span className="text-xs font-medium text-[#B5B5B5]">{classData.subject}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={`/dashboard/teacher/classes/${classId}/live`}>
                        <Button className="bg-white hover:bg-white/90 text-black text-sm font-semibold px-6 h-9 rounded-xl gap-2 shadow-lg transition-all active:scale-95 border-none">
                            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                            Go Live
                        </Button>
                    </Link>
                    <Link href={`/dashboard/teacher/classes/${classId}/settings`}>
                         <Button variant="outline" className="border-[#1C1C1C] bg-[#161616] text-[#B5B5B5] hover:text-white hover:border-[#00E599]/30 h-9 w-9 p-0 rounded-xl">
                            <Settings className="w-4 h-4" />
                         </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8" onValueChange={handleTabChange}>
                <TabsList className="bg-[#161616] border border-[#1C1C1C] p-1.5 h-12 rounded-2xl gap-1">
                    <TabsTrigger value="overview" className="rounded-xl px-8 text-xs font-semibold h-9 data-[state=active]:bg-white data-[state=active]:text-black transition-all">Overview</TabsTrigger>
                    <TabsTrigger value="students" className="rounded-xl px-8 text-xs font-semibold h-9 data-[state=active]:bg-white data-[state=active]:text-black transition-all">Students ({classData.studentCount})</TabsTrigger>
                    <TabsTrigger value="assignments" className="rounded-xl px-8 text-xs font-semibold h-9 data-[state=active]:bg-white data-[state=active]:text-black transition-all">Tasks ({classData.assignmentCount})</TabsTrigger>
                    <TabsTrigger value="exams" className="rounded-xl px-8 text-xs font-semibold h-9 data-[state=active]:bg-white data-[state=active]:text-black transition-all">Exams ({classData.examCount})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Active Students", value: classData.studentCount, icon: Users },
                            { label: "Active Tasks", value: classData.assignmentCount, icon: FileText },
                            { label: "Scheduled Exams", value: classData.examCount, icon: Clock },
                            { label: "Class Library", value: classData.materialCount, icon: BookOpen },
                        ].map((stat, i) => (
                            <Card key={i} className="bg-[#161616] border-[#1C1C1C] hover:border-[#2C2C2C] transition-all group overflow-hidden relative rounded-2xl">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between relative z-10">
                                        <div>
                                            <p className="text-[11px] font-medium text-[#B5B5B5]">{stat.label}</p>
                                            <h3 className="text-xl font-bold mt-1 text-white">{stat.value}</h3>
                                        </div>
                                        <div className="h-10 w-10 rounded-2xl flex items-center justify-center transition-all bg-[#1F1F1F] border border-[#1C1C1C] group-hover:border-white/20 group-hover:bg-white/5 text-[#B5B5B5] group-hover:text-white">
                                            <stat.icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-[#161616] border-[#1C1C1C] overflow-hidden">
                            <CardHeader className="border-b border-[#1C1C1C] pb-4">
                                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#00E599]" />
                                    Recently Enrolled Students
                                </CardTitle>
                                <CardDescription className="text-[11px] font-medium text-[#B5B5B5]">Latest students joined this class</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {classData.recentStudents.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-[#1C1C1C] flex items-center justify-center mx-auto mb-4">
                                             <Users className="w-6 h-6 text-[#B5B5B5]" />
                                        </div>
                                         <p className="text-[11px] font-medium text-[#B5B5B5]">No students enrolled yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {classData.recentStudents.map((student) => (
                                            <div key={student.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-[#1C1C1C]">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-10 w-10 border-2 border-[#1C1C1C] group-hover:border-[#00E599]/30 transition-colors">
                                                        <AvatarImage src={student.image || undefined} />
                                                        <AvatarFallback className="bg-black text-[#00E599] font-bold">{getInitials(student.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{student.name}</p>
                                                        <p className="text-[10px] text-[#444] font-medium">{student.email}</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-[11px] font-medium text-[#B5B5B5] hover:text-white pr-0 h-8"
                                                    onClick={async () => {
                                                        const res = await fetch(`/api/teacher/classes/${classId}/students`)
                                                        const result = await res.json()
                                                        if (result.success) {
                                                            const fullStudent = result.data.find((s: Student) => s.id === student.id)
                                                            setSelectedStudent(fullStudent || student as any)
                                                            setIsModalOpen(true)
                                                        }
                                                    }}
                                                >
                                                    View Profile
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-[#161616] border-[#1C1C1C] overflow-hidden">
                            <CardHeader className="border-b border-[#1C1C1C] pb-4">
                                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[#00E599]" />
                                    Upcoming Activities
                                </CardTitle>
                                <CardDescription className="text-[11px] font-medium text-[#B5B5B5]">Upcoming assignments and exam deadlines</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    {classData.ongoingAssignments.map((assignment) => (
                                        <div key={assignment.id} className="flex items-center justify-between p-4 bg-black/40 border border-[#1C1C1C] rounded-2xl group hover:border-[#00E599]/30 transition-all cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-[#1F1F1F] rounded-xl flex items-center justify-center text-[#555] border border-[#1C1C1C] group-hover:bg-[#00E599]/5 group-hover:text-[#00E599] transition-all">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-[#00E599] transition-colors">{assignment.title}</p>
                                                    <p className="text-[11px] text-[#B5B5B5] mt-1">
                                                        Deadline: {formatDate(assignment.dueDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#222] hover:text-[#00E599] group-hover:text-[#444]">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {classData.upcomingExams.map((exam) => (
                                        <div key={exam.id} className="flex items-center justify-between p-4 bg-black/40 border border-[#1C1C1C] rounded-2xl group hover:border-[#EF4444]/30 transition-all cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-[#EF4444]/5 rounded-xl flex items-center justify-center text-[#EF4444] border border-[#EF4444]/10">
                                                    <Clock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-[#EF4444] transition-colors">{exam.title}</p>
                                                    <p className="text-[11px] text-[#B5B5B5] mt-1">
                                                        {exam.type} • {formatDate(exam.startTime)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#222] hover:text-[#EF4444] group-hover:text-[#444]">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {classData.ongoingAssignments.length === 0 && classData.upcomingExams.length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-[#1C1C1C] flex items-center justify-center mx-auto mb-4">
                                                <Calendar className="w-6 h-6 text-[#B5B5B5]" />
                                            </div>
                                             <p className="text-[11px] font-medium text-[#B5B5B5]">No upcoming activities</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="students" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="bg-[#161616] border-[#1C1C1C] overflow-hidden">
                        <CardHeader className="border-b border-[#1C1C1C] flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Student Roster</CardTitle>
                                <CardDescription className="text-[11px] font-medium text-[#B5B5B5]">Manage all students currently enrolled in this class</CardDescription>
                            </div>
                            
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingTab ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <RefreshCw className="w-8 h-8 text-[#00E599] animate-spin" />
                                    <p className="text-[11px] font-medium text-[#B5B5B5]">Updating roster...</p>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="py-20 text-center space-y-4">
                                     <Users className="w-12 h-12 text-[#1C1C1C] mx-auto" />
                                     <p className="text-sm font-medium text-[#B5B5B5]">No students found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#1C1C1C]">
                                    {students.map((student) => (
                                        <div key={student.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border border-[#1C1C1C]">
                                                    <AvatarImage src={student.image || undefined} />
                                                    <AvatarFallback className="bg-black text-[#00E599] font-bold">{getInitials(student.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">{student.name}</h4>
                                                    <p className="text-[11px] text-[#B5B5B5] font-medium">{student.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 text-[11px] font-medium text-[#B5B5B5] hover:text-[#00E599] hover:bg-[#00E599]/5 transition-all gap-1.5 px-3"
                                                    onClick={() => {
                                                        setSelectedStudent(student)
                                                        setIsModalOpen(true)
                                                    }}
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Details</span>
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 text-[11px] font-medium text-[#B5B5B5] hover:text-[#00E599] hover:bg-[#00E599]/5 transition-all gap-1.5 px-3"
                                                    onClick={() => router.push(`/dashboard/teacher/messages?userId=${student.userId}`)}
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Message</span>
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 text-[11px] font-medium text-[#B5B5B5] hover:text-[#FACC15] hover:bg-[#FACC15]/5 transition-all gap-1.5 px-3"
                                                    onClick={() => {
                                                        setSelectedStudent(student)
                                                        setIsModalOpen(true)
                                                    }}
                                                >
                                                    <AlertTriangle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Report</span>
                                                </Button>
                                                <div className="w-px h-4 bg-[#1C1C1C] mx-1" />
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 text-[11px] font-medium text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all gap-1.5 px-3"
                                                    onClick={() => {
                                                        setStudentToRemove(student)
                                                        setIsRemoveDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Remove</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assignments" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="bg-[#161616] border-[#1C1C1C] overflow-hidden">
                        <CardHeader className="border-b border-[#1C1C1C] flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Academic Tasks</CardTitle>
                                <CardDescription className="text-[11px] font-medium text-[#B5B5B5]">Created assignments for this class</CardDescription>
                            </div>
                            <Link href="/dashboard/teacher/assignments">
                                <Button className="bg-white hover:bg-white/90 text-black text-[11px] font-semibold rounded-lg px-4 h-8 border-none">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Create Task
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-6">
                            {loadingTab ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <RefreshCw className="w-8 h-8 text-[#00E599] animate-spin" />
                                    <p className="text-[11px] font-medium text-[#B5B5B5]">Scanning tasks...</p>
                                </div>
                            ) : assignments.length === 0 ? (
                                <div className="py-12 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-3xl bg-[#1F1F1F] border border-[#1C1C1C] flex items-center justify-center mb-6">
                                        <FileText className="w-8 h-8 text-[#B5B5B5]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">No Active Tasks</h3>
                                    <p className="text-sm text-[#B5B5B5] mb-8 max-w-xs mx-auto">Prepare and publish academic assignments to begin tracking student progression.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {assignments.map((assignment) => (
                                        <Card key={assignment.id} className="bg-black/40 border-[#1C1C1C] hover:border-[#00E599]/30 transition-all group rounded-2xl">
                                            <CardContent className="p-5 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="h-10 w-10 bg-[#1F1F1F] rounded-xl flex items-center justify-center text-[#555] border border-[#1C1C1C] group-hover:bg-[#00E599]/10 group-hover:text-[#00E599] transition-all">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <Badge className="bg-[#1C1C1C] text-[#555] border-none text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                                                        {assignment._count.submissions} Submissions
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-[#00E599] transition-colors truncate">{assignment.title}</h4>
                                                    <p className="text-[11px] text-[#B5B5B5] mt-1">Due: {formatDate(assignment.dueDate)}</p>
                                                </div>
                                                <div className="pt-2 flex items-center gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="flex-1 h-8 rounded-lg border border-[#1C1C1C] text-[11px] font-medium text-[#B5B5B5] hover:text-white hover:bg-[#1C1C1C] transition-all"
                                                        onClick={() => router.push(`/dashboard/teacher/assignments/${assignment.id}`)}
                                                    >
                                                        Details
                                                    </Button>
                                                    <Button 
                                                        className="h-8 w-8 p-0 bg-white/5 hover:bg-white/10 text-white border-none rounded-lg transition-all"
                                                        onClick={() => router.push(`/dashboard/teacher/assignments`)}
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="exams" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="bg-[#161616] border-[#1C1C1C] overflow-hidden">
                        <CardHeader className="border-b border-[#1C1C1C] flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Examinations</CardTitle>
                                <CardDescription className="text-[11px] font-medium text-[#B5B5B5]">Manage scheduled exams and quizzes</CardDescription>
                            </div>
                            <Link href="/dashboard/teacher/exams">
                                <Button className="bg-white hover:bg-white/90 text-black text-[11px] font-semibold rounded-lg px-4 h-8 border-none">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Schedule Exam
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-6">
                            {loadingTab ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <RefreshCw className="w-8 h-8 text-[#00E599] animate-spin" />
                                    <p className="text-[11px] font-medium text-[#B5B5B5]">Loading exams...</p>
                                </div>
                            ) : exams.length === 0 ? (
                                <div className="py-12 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-3xl bg-[#1F1F1F] border border-[#1C1C1C] flex items-center justify-center mb-6">
                                        <Clock className="w-8 h-8 text-[#B5B5B5]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">No Exams Scheduled</h3>
                                    <p className="text-sm text-[#B5B5B5] mb-8 max-w-xs mx-auto">Create quizzes or formal examinations to evaluate student performance.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {exams.map((exam) => (
                                        <Card key={exam.id} className="bg-black/40 border-[#1C1C1C] hover:border-[#EF4444]/30 transition-all group rounded-2xl">
                                            <CardContent className="p-5 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="h-10 w-10 bg-[#EF4444]/5 rounded-xl flex items-center justify-center text-[#EF4444] border border-[#EF4444]/10 group-hover:bg-[#EF4444]/10 transition-all">
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <Badge className="bg-[#1C1C1C] text-[#555] border-none text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                                                        {exam.type} • {exam.duration}m
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-[#EF4444] transition-colors truncate">{exam.title}</h4>
                                                    <p className="text-[11px] text-[#B5B5B5] mt-1">{formatDate(exam.startTime)}</p>
                                                </div>
                                                <div className="pt-2 flex items-center gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="flex-1 h-8 rounded-lg border border-[#1C1C1C] text-[11px] font-medium text-[#B5B5B5] hover:text-white hover:bg-[#1C1C1C] transition-all"
                                                        onClick={() => router.push(`/dashboard/teacher/exams`)}
                                                    >
                                                        Settings
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <StudentDetailsModal 
                student={selectedStudent as any}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRemove={handleRemoveStudent}
                classId={classId}
            />

            <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
                <AlertDialogContent className="bg-[#161616] border border-red-500/20 rounded-[2rem] p-8 max-w-sm">
                    <AlertDialogHeader className="space-y-4">
                        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2 text-red-500">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-white text-center tracking-tight">Remove Student?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-[#555] text-center leading-relaxed">
                            Are you sure you want to remove <span className="text-white font-bold">{studentToRemove?.name}</span> from this class? They will be notified of this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-3 mt-8">
                        <AlertDialogCancel className="flex-1 h-10 bg-[#1C1C1C] border-none text-white hover:bg-[#222] rounded-xl font-semibold text-[11px]">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-[11px] transition-all"
                            onClick={() => studentToRemove && handleRemoveStudent(studentToRemove.id)}
                            disabled={isRemoving}
                        >
                            {isRemoving ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
