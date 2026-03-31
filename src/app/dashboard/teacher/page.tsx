"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Users,
  BookOpen,
  FileText,
  Plus,
  ChevronRight,
  Bell,
  ClipboardList,
  GraduationCap,
  UserPlus,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import { getInitials, formatDate, cn } from "@/lib/utils"
import Link from "next/link"
import { AnalyticsCharts } from "@/components/dashboard/teacher/analytics-charts"

interface DashboardData {
  teacher: {
    id: string | null
    name: string
    email: string
    employeeId: string | null
    department: string | null
    subject: string | null
    university: string | null
    phone: string | null
    qualification: string | null
    experience: number | null
  }
  stats: {
    totalClasses: number
    totalStudents: number
    pendingSubmissions: number
    upcomingExams: number
  }
  classes: Array<{
    id: string
    name: string
    code: string
    subject: string
    department: string
    semester: number
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
  }>
  recentSubmissions: Array<{
    id: string
    assignmentTitle: string
    studentName: string
    studentEmail: string
    status: string
    submittedAt: string | null
    marks: number | null
    totalMarks: number
  }>
  upcomingExams: Array<{
    id: string
    title: string
    type: string
    startTime: string
    endTime: string
    duration: number
    className: string
    subject: string
    attemptCount: number
  }>
  activities: Array<{
    id: string
    type: "EXAM" | "ASSIGNMENT" | "TASK"
    title: string
    status: "LIVE" | "UPCOMING" | "PENDING"
    dueDate: string | null
    className: string
    classCode: string
    description: string
  }>
  announcements: Array<{
    id: string
    title: string
    content: string
    priority: string
    isGlobal: boolean
    createdAt: string
  }>
  notifications: Array<{
    id: string
    title: string
    message: string
    type: string
    read: boolean
    createdAt: string
  }>
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Clock, Activity, CheckSquare, Layers } from "lucide-react"

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
        <Icon className="w-8 h-8 text-[#555]" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && (
        <Link href={action.href}>
          <Button className="bg-white hover:bg-white/90 text-black font-semibold h-9 px-4 rounded-xl transition-all active:scale-95 border-none text-sm">
            <Plus className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  )
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "EXAM": return <Activity className="w-4 h-4 text-red-500" />
    case "ASSIGNMENT": return <FileText className="w-4 h-4 text-blue-500" />
    case "TASK": return <CheckSquare className="w-4 h-4 text-emerald-500" />
    default: return <Layers className="w-4 h-4 text-gray-500" />
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "LIVE": return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse text-[10px] py-0">LIVE</Badge>
    case "UPCOMING": return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] py-0">UPCOMING</Badge>
    case "PENDING": return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] py-0">PENDING</Badge>
    default: return null
  }
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/teacher/dashboard")
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
        <Card className="w-full max-w-md border-[#1C1C1C]">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">Unable to Load Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error || "Something went wrong"}</p>
            <Button onClick={() => window.location.reload()} className="bg-white hover:bg-white/90 text-black font-semibold h-10 px-8 rounded-xl transition-all active:scale-95 border-none">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { teacher, stats, classes, activities, announcements, notifications } = data

  return (
    <div className="space-y-8 pb-24">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-[#161616] via-[#191919] to-[#111111] border border-[#252525] rounded-2xl p-6 overflow-hidden"
      >
        {/* Decorative glow */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#555] mb-1">
              {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 17 ? "Good Afternoon" : "Good Evening"}
            </p>
            <h1 className="text-2xl font-bold text-white mb-1">{teacher.name} 👋</h1>
            <p className="text-[13px] text-[#9A9A9A]">
              {stats.totalClasses > 0
                ? `You have ${stats.pendingSubmissions} pending tasks and ${stats.upcomingExams} upcoming events`
                : "Create a class to begin your academic session"}
            </p>
            {teacher.department && (
              <p className="text-xs text-[#555] mt-2 truncate">
                {teacher.department}{teacher.subject ? ` • ${teacher.subject}` : ""}
              </p>
            )}
          </div>
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-white text-lg font-bold">{getInitials(teacher.name)}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: stats.totalStudents, icon: Users, iconColor: "text-blue-400", iconBg: "bg-blue-500/10 border-blue-500/20", href: "/dashboard/teacher/students" },
          { label: "My Classes", value: stats.totalClasses, icon: BookOpen, iconColor: "text-white", iconBg: "bg-white/8 border-white/10", href: "/dashboard/teacher/classes" },
          { label: "Submissions", value: stats.pendingSubmissions, icon: FileText, iconColor: "text-orange-400", iconBg: "bg-orange-500/10 border-orange-500/20", href: "/dashboard/teacher/submissions" },
          { label: "Upcoming Exams", value: stats.upcomingExams, icon: ClipboardList, iconColor: "text-purple-400", iconBg: "bg-purple-500/10 border-purple-500/20", href: "/dashboard/teacher/exams" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={stat.href}>
              <Card className="hover:border-[#252525] hover:bg-[rgba(0,229,153,0.02)] transition-all duration-200 cursor-pointer border-[#252525] shadow-none group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] text-[#9A9A9A] group-hover:text-white transition-colors font-medium">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1 text-white">{stat.value}</p>
                    </div>
                    <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center transition-all group-hover:shadow-lg", stat.iconBg)}>
                      <stat.icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", stat.iconColor)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Divider before Analytics */}
      <div className="border-t border-[#1C1C1C]" />

      {/* Analytics Charts */}
      <AnalyticsCharts />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#252525]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Active Classes</CardTitle>
              <Link href="/dashboard/teacher/classes">
                <Button size="sm" className="bg-white hover:bg-white/90 text-black font-semibold h-9 px-4 rounded-xl transition-all active:scale-95 border-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No Registered Classes"
                  description="You haven't registered any classes yet. Add a class to manage students and assignments."
                  action={{ label: "Add Class", href: "/dashboard/teacher/classes" }}
                />
              ) : (
                <div className="space-y-4">
                  {classes.slice(0, 4).map((cls) => (
                    <Link key={cls.id} href={`/dashboard/teacher/classes/${cls.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-[#1C1C1C] hover:bg-white/5 hover:border-[#1C1C1C] transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg border border-[#1C1C1C] bg-[#1F1F1F] flex items-center justify-center text-white font-bold">
                            {cls.code.substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{cls.name}</h4>
                            <p className="text-sm text-[#B5B5B5]">
                              {cls.code} • {cls.subject}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-[#1F1F1F] text-[#B5B5B5] border-none">
                            {cls.studentCount} Students
                          </Badge>
                          <Badge variant="outline" className="border-[#1C1C1C] text-[#B5B5B5]">
                            {cls.assignmentCount} Assignments
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unified Submission & Priority Activity Card */}
          <Card className="border-[#252525]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Priority Activities</CardTitle>
                <p className="text-xs text-[#555] mt-1">Live, pending and upcoming tasks</p>
              </div>
              <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-[#555] hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#090909] border-[#1C1C1C]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-500" />
                      All Scheduled Activities
                    </DialogTitle>
                    <DialogDescription>
                      Full list of live, pending, and upcoming academic activities.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {activities.length === 0 ? (
                      <EmptyState icon={Layers} title="No Activities" description="You have no upcoming or pending activities." />
                    ) : (
                      <div className="space-y-4">
                        {["LIVE", "PENDING", "UPCOMING"].map((sectionStatus) => {
                          const sectionItems = activities.filter(a => a.status === sectionStatus)
                          if (sectionItems.length === 0) return null
                          
                          return (
                            <div key={sectionStatus} className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#555] flex items-center gap-2">
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  sectionStatus === "LIVE" ? "bg-red-500" : sectionStatus === "PENDING" ? "bg-amber-500" : "bg-blue-500"
                                )} />
                                {sectionStatus}
                              </h4>
                              <div className="grid grid-cols-1 gap-2">
                                {sectionItems.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-[#1C1C1C] bg-[#1F1F1F]">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-[#1F1F1F] border border-[#1C1C1C] flex items-center justify-center text-gray-500">
                                        <ActivityIcon type={item.type} />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold dark:text-white">{item.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <span>{item.className}</span>
                                          <span>•</span>
                                          <span>{item.description}</span>
                                        </div>
                                      </div>
                                    </div>
                                    {item.dueDate && (
                                      <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">DEADLINE</p>
                                        <p className="text-xs font-mono text-[#9A9A9A]">
                                          {new Date(item.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-12 text-[#555] border-2 border-dashed rounded-2xl border-[#252525]">
                  <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">All Caught Up!</p>
                  <p className="text-sm mt-1">No live or pending activities for today.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activities.slice(0, 4).map((item) => (
                    <motion.div 
                      key={item.id} 
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-2xl border border-[#1C1C1C] bg-[#161616] hover:bg-[#1F1F1F] hover:border-[#1C1C1C] flex items-center justify-between group cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1F1F1F] flex items-center justify-center text-[#B5B5B5] group-hover:bg-white/5 group-hover:text-white transition-colors">
                          <ActivityIcon type={item.type} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="text-sm font-bold text-white line-clamp-1">{item.title}</p>
                             <StatusBadge status={item.status} />
                          </div>
                          <p className="text-xs text-[#B5B5B5] flex items-center gap-1 mt-0.5 font-medium">
                            {item.classCode} • {item.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card className="border-[#1C1C1C] bg-[#161616]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#1C1C1C] mb-4">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Notifications</CardTitle>
              <div className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-[10px] font-bold text-[#9A9A9A]">
                {notifications.filter(n => !n.read).length} New
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-[#555]">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold uppercase tracking-widest text-[10px]">No new updates</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notif) => (
                    <div key={notif.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 group border border-transparent hover:border-[#1C1C1C] transition-all">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-2 transition-transform group-hover:scale-125",
                        notif.read ? "bg-[#222]" : "bg-white shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                      )} />
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-white transition-colors">{notif.title}</p>
                        <p className="text-xs text-[#555] font-medium mt-1">{notif.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card className="border-[#1C1C1C] bg-[#161616]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#1C1C1C] mb-4">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Announcements</CardTitle>
              <Link href="/dashboard/teacher/announcements">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#888] hover:text-white hover:bg-white/5 rounded-lg">
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-[#555]">
                  <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold uppercase tracking-widest text-[10px]">No announcements</p>
                  <Link href="/dashboard/teacher/announcements">
                    <Button className="mt-4 bg-white hover:bg-white/90 text-black text-[10px] font-semibold uppercase tracking-widest px-4 h-9 rounded-xl transition-all active:scale-95 border-none">
                      Create New
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.slice(0, 3).map((ann) => (
                    <div key={ann.id} className="border-l border-[#1C1C1C] pl-4 group hover:border-white/20 transition-all">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white group-hover:text-white transition-colors">{ann.title}</h4>
                        {ann.priority === "HIGH" || ann.priority === "URGENT" ? (
                          <Badge className="bg-[#EF4444]/10 text-[#EF4444] border-none text-[9px] h-4 px-1">
                            {ann.priority}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-[#555] font-medium mt-1 line-clamp-2">{ann.content}</p>
                      <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest mt-2">
                        {ann.isGlobal ? "Universal" : "Class"} • {formatDate(ann.createdAt)}
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
