"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  FileText,
  Clock,
  TrendingUp,
  Bell,
  ChevronRight,
  Plus,
  GraduationCap,
  FolderOpen,
  ClipboardList,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import { getInitials, formatDate, cn } from "@/lib/utils"
import Link from "next/link"
import { GamificationOverview } from "@/components/dashboard/student/gamification-overview"

interface DashboardData {
  student: {
    id: string | null
    name: string
    email: string
    enrollmentNo: string | null
    department: string | null
    semester: number | null
    section: string | null
    batch: string | null
    phone: string | null
  }
  stats: {
    totalClasses: number
    pendingSubmissions: number
    upcomingExams: number
    attendanceRate: number
  }
  classes: Array<{
    id: string
    name: string
    code: string
    subject: string
    department: string
    teacherName: string
    studentCount: number
    assignmentCount: number
    materialCount: number
    joinedAt: string | null
  }>
  upcomingAssignments: Array<{
    id: string
    title: string
    dueDate: string
    className: string
    subject: string
    totalMarks: number
  }>
  upcomingExams: Array<{
    id: string
    title: string
    type: string
    startTime: string
    duration: number
    className: string
    subject: string
  }>
  notifications: Array<{
    id: string
    title: string
    message: string
    type: string
    read: boolean
    createdAt: string
  }>
  announcements: Array<{
    id: string
    title: string
    content: string
    priority: string
    className: string
    teacherName: string
    createdAt: string
  }>
  performance: Array<{
    month: number
    year: number
    attendanceRate: number | null
    assignmentRate: number | null
    examAverage: number | null
    overallScore: number | null
  }>
}

// Empty state component
function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border border-[#1C1C1C] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && (
        <Link href={action.href}>
          <Button className="bg-white hover:bg-white/90 text-black font-semibold rounded-xl h-10 px-6 transition-all active:scale-95 border-none">
            <Plus className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/student/dashboard")
        const result = await res.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || "Failed to load dashboard")
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

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md border-border">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">Unable to Load Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error || "Something went wrong"}</p>
            <Button onClick={() => window.location.reload()} className="bg-white hover:bg-white/90 text-black font-semibold rounded-xl px-8 h-10 transition-all active:scale-95 border-none">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { student, stats, classes, upcomingAssignments, upcomingExams, notifications, announcements } = data

  return (
    <div className="space-y-6 pb-24">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#161616] border border-[#1C1C1C] rounded-2xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {student.name}</h1>
            <p className="text-[#888] text-sm font-medium max-w-md">
              {stats.totalClasses > 0
                ? `You have ${stats.pendingSubmissions} pending submissions and ${stats.upcomingExams} upcoming exams.`
                : "Join a class to start your academic journey."}
            </p>
            {student.department && (
              <div className="flex items-center gap-2 mt-4">
                <Badge className="bg-white/10 text-white border-white/20 font-semibold px-3 py-1 text-[10px] uppercase tracking-wider">{student.department}</Badge>
                <div className="w-1 h-1 rounded-full bg-[#333]" />
                <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest">Semester {student.semester || "-"}</span>
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <Avatar className="h-20 w-20 border-2 border-[#252525] shadow-2xl">
              <AvatarFallback className="bg-[#111111] text-white text-2xl font-bold">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enrolled Classes", value: stats.totalClasses, icon: BookOpen, href: "/dashboard/student/classes" },
          { label: "Pending Submissions", value: stats.pendingSubmissions, icon: FileText, href: "/dashboard/student/assignments" },
          { label: "Upcoming Exams", value: stats.upcomingExams, icon: ClipboardList, href: "/dashboard/student/exams" },
          { label: "Attendance Rate", value: `${stats.attendanceRate}%`, icon: TrendingUp, href: "/dashboard/student/attendance" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={stat.href}>
              <Card className="hover:border-[#444] hover:bg-white/[0.02] transition-all duration-200 cursor-pointer border-[#1C1C1C] bg-[#161616] shadow-none group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] text-[#888] group-hover:text-[#B5B5B5] transition-colors">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1 text-white">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl border border-[#252525] bg-[#111111] flex items-center justify-center group-hover:border-white/30 transition-all">
                      <stat.icon className="w-6 h-6 text-[#555] group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Section */}
        <div className="lg:col-span-2">
          <Card className="border-[#1C1C1C] bg-[#161616]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#252525] px-6 py-4">
              <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                MY CLASSES
              </CardTitle>
              <Link href="/dashboard/student/classes">
                <Button variant="ghost" size="sm" className="text-[#888] hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              {classes.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No Classes Yet"
                  description="You haven't joined any classes. Browse available classes and request to join."
                  action={{ label: "Browse Classes", href: "/dashboard/student/classes" }}
                />
              ) : (
                <div className="space-y-3">
                    {classes.slice(0, 4).map((cls) => (
                      <Link key={cls.id} href={`/dashboard/student/classes/${cls.id}`}>
                        <div className="flex items-center justify-between p-4 rounded-xl border border-[#252525] bg-[#111111] hover:bg-[#1A1A1A] hover:border-[#444] transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg border border-[#252525] bg-[#161616] flex items-center justify-center text-[#888] text-xs font-bold group-hover:bg-white group-hover:text-black transition-all">
                              {cls.code.substring(0, 2)}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white group-hover:text-white transition-colors">{cls.name}</h4>
                              <p className="text-[11px] font-medium text-[#555] mt-0.5">
                                {cls.teacherName} • {cls.code}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-[#1A1A1A] text-[#888] border border-[#252525] text-[10px] font-bold">
                            {cls.studentCount} Students
                          </Badge>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card className="mt-6 border-[#1C1C1C] bg-[#161616]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#252525] px-6 py-4">
              <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                UPCOMING ASSIGNMENTS
              </CardTitle>
              <Link href="/dashboard/student/assignments">
                <Button variant="ghost" size="sm" className="text-[#888] hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              {upcomingAssignments.length === 0 ? (
                <div className="text-center py-8 text-[#555]">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-[#888]">No Upcoming Assignments</p>
                  <p className="text-sm mt-1">You&apos;re all caught up! No assignments due.</p>
                </div>
              ) : (
                <div className="space-y-3">
                    {upcomingAssignments.slice(0, 5).map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 rounded-xl border border-[#252525] bg-[#111111] hover:bg-[#1A1A1A] hover:border-[#444] transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg border border-[#252525] bg-[#161616] flex items-center justify-center group-hover:border-white/30 group-hover:bg-white/5 transition-all">
                            <FileText className="w-5 h-5 text-[#555] group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-white transition-colors">{assignment.title}</h4>
                            <p className="text-[11px] font-medium text-[#555] mt-0.5">{assignment.className}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-[#888]">
                            {formatDate(assignment.dueDate)}
                          </p>
                          <p className="text-[10px] font-bold text-white uppercase tracking-widest mt-1">{assignment.totalMarks} Marks</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GamificationOverview />

          {/* Upcoming Exams */}
          <Card className="border-[#1C1C1C] bg-[#161616]">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#252525] px-6 py-4">
              <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                UPCOMING EXAMS
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/10 text-white border-0 text-[10px] font-bold">{upcomingExams.length}</Badge>
                <Link href="/dashboard/student/exams">
                  <Button variant="ghost" size="sm" className="text-[#888] hover:text-white text-[10px] font-bold uppercase tracking-wider p-0 h-auto transition-colors">
                    View All <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {upcomingExams.length === 0 ? (
                <div className="text-center py-8 text-[#555]">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-[#888]">No upcoming exams</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#888] font-medium mb-2">
                    You have {upcomingExams.length} upcoming exam{upcomingExams.length !== 1 ? "s" : ""}
                  </p>
                  {upcomingExams.slice(0, 3).map((exam) => (
                    <div key={exam.id} className="p-3 rounded-xl border border-[#252525] bg-[#111111] hover:bg-[#1A1A1A] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] border-[#333] text-[#888] bg-[#161616]">{exam.type}</Badge>
                        <span className="text-[10px] text-[#555] font-medium">{exam.duration} min</span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{exam.title}</h4>
                      <p className="text-[11px] text-[#555] font-medium mt-0.5">{exam.className}</p>
                      <div className="flex items-center gap-1.5 mt-3 text-[11px] font-bold text-[#888]">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(exam.startTime)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-[#1C1C1C] bg-[#161616]">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-[#252525]">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                NOTIFICATIONS
              </CardTitle>
              <Badge variant="secondary" className="bg-[#111111] text-[#888] border border-[#252525]">
                {notifications.filter(n => !n.read).length}
              </Badge>
            </CardHeader>
            <CardContent className="p-4">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-[#555]">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-[#888]">No new notifications</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 5).map((notif) => (
                    <div key={notif.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#111111] transition-colors border border-transparent hover:border-[#252525]">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        notif.read ? "bg-[#333]" : "bg-white"
                      )} />
                      <div>
                        <p className="text-xs font-bold text-white">{notif.title}</p>
                        <p className="text-[11px] text-[#888] mt-0.5">{notif.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="border-[#1C1C1C] bg-[#161616]">
            <CardHeader className="py-4 border-b border-[#252525]">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                RECENT ANNOUNCEMENTS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-[#555]">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-[#888]">No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.slice(0, 3).map((ann) => (
                    <div key={ann.id} className="border-l-2 border-[#333] pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-xs text-white">{ann.title}</h4>
                        {ann.priority === "HIGH" || ann.priority === "URGENT" ? (
                          <Badge className="bg-white/10 text-white hover:bg-white/20 border-0 text-[9px] px-1.5 py-0">
                            {ann.priority}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-[#888] line-clamp-2 leading-relaxed">{ann.content}</p>
                      <p className="text-[10px] font-bold text-[#555] mt-2 uppercase tracking-wider">
                        {ann.className} • {formatDate(ann.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
