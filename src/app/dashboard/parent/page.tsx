"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, FileText, ClipboardList, TrendingUp, Calendar, AlertCircle, Award, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials, formatDate } from "@/lib/utils"

interface StudentData {
    id: string
    name: string
    email: string
    image: string | null
    enrollmentNo: string | null
    department: string | null
    semester: number | null
    points: number
    currentStreak: number
    upcomingAssignments: Array<{ id: string, title: string, dueDate: string, className: string, totalMarks: number }>
    upcomingExams: Array<{ id: string, title: string, startTime: string, className: string }>
    recentAttendances: Array<{ id: string, date: string, status: string }>
    recentSubmissions: Array<{ id: string, assignmentTitle: string, status: string, submittedAt: string, grade: string | null }>
}

export default function ParentDashboard() {
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<StudentData[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetch("/api/parent/overview")
                const result = await res.json()

                if (result.success) {
                    setStudents(result.data.students)
                } else {
                    setError(result.error || "Failed to load parent dashboard")
                }
            } catch {
                setError("Failed to connect to server")
            } finally {
                setLoading(false)
            }
        }

        fetchDashboard()
    }, [])

    if (loading) return <SkeletonDashboard />

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-foreground mb-2">Error Loading Dashboard</h3>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        )
    }

    if (students.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-medium text-foreground mb-2">No Students Linked</h3>
                    <p className="text-muted-foreground">Please contact the administration to link your child&apos;s account securely.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Parent Portal Overview</h1>
                    <p className="text-muted-foreground mt-2">Monitor academic progress and stay updated.</p>
                </div>
            </motion.div>

            <div className="space-y-12">
                {students.map((student, idx) => (
                    <motion.div key={student.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                        {/* Student Header */}
                        <div className="flex items-center gap-4 mb-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
                            <Avatar className="h-20 w-20 border-2 border-indigo-100 dark:border-indigo-900/50">
                                <AvatarImage src={student.image || undefined} alt={student.name} />
                                <AvatarFallback className="text-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">{getInitials(student.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{student.name}</h2>
                                <p className="text-muted-foreground mt-1">{student.department || "General"} • Semester {student.semester || "-"}</p>
                            </div>
                            <div className="ml-auto flex gap-4 text-center">
                                <div className="bg-secondary px-4 py-2 rounded-xl">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Total Points</p>
                                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
                                        <Award className="w-5 h-5" /> {student.points}
                                    </p>
                                </div>
                                <div className="bg-secondary px-4 py-2 rounded-xl">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Day Streak</p>
                                    <p className="text-xl font-black text-orange-500 flex items-center justify-center">
                                        {student.currentStreak} 🔥
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Student Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Upcoming Assignments */}
                            <Card className="border-border">
                                <CardHeader className="pb-3 border-b border-border mb-3">
                                    <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                                        <FileText className="w-4 h-4 text-orange-500" /> Upcoming Assignments
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {student.upcomingAssignments.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">No upcoming assignments.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {student.upcomingAssignments.map((a) => (
                                                <div key={a.id} className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-medium dark:text-white">{a.title}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{a.className}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs shrink-0 whitespace-nowrap">
                                                        {formatDate(a.dueDate)}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Upcoming Exams */}
                            <Card className="border-border">
                                <CardHeader className="pb-3 border-b border-border mb-3">
                                    <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                                        <ClipboardList className="w-4 h-4 text-purple-500" /> Upcoming Exams
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {student.upcomingExams.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">No upcoming exams.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {student.upcomingExams.map((e) => (
                                                <div key={e.id} className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-medium dark:text-white">{e.title}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{e.className}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-xs font-medium dark:text-gray-300">{formatDate(e.startTime)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card className="border-border">
                                <CardHeader className="pb-3 border-b border-border mb-3">
                                    <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Recent Submissions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {student.recentSubmissions.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">No recent submissions.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {student.recentSubmissions.map((sub) => (
                                                <div key={sub.id} className="flex items-center gap-3">
                                                    {sub.status === "GRADED" ? (
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate dark:text-white">{sub.assignmentTitle}</p>
                                                        <p className="text-xs text-gray-500">{sub.status}</p>
                                                    </div>
                                                    {sub.grade && (
                                                        <Badge variant="secondary" className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">
                                                            {sub.grade}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
