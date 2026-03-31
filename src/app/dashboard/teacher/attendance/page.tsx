"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import {
  CheckSquare,
  Search,
  Calendar as CalendarIcon,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Plus,
  Save,
  Trash2,
  MoreVertical,
  Filter,
  ArrowUpRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Edit,
  Lock,
  Info
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from "recharts"

// Types
interface Student {
  id: string
  name: string
  email: string
  enrollmentNumber: string
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | null
  image?: string
  remarks?: string
}

interface AttendanceSession {
  id: string
  date: string
  className: string
  classCode: string
  topic: string
  totalPresent: number
  totalAbsent: number
  totalStudents: number
  createdAt?: string
}

interface ClassOption {
  id: string
  name: string
  code: string
}

// 48 hours in ms
const LOCK_WINDOW_MS = 48 * 60 * 60 * 1000

export default function TeacherAttendancePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [teacherClasses, setTeacherClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState("all")
  // Classids already marked today
  const [markedTodayClasses, setMarkedTodayClasses] = useState<{ classId: string; createdAt: string }[]>([])
  const [loadingToday, setLoadingToday] = useState(false)

  // Marking/Editing State
  const [isMarkingOpen, setIsMarkingOpen] = useState(false)
  const [markingSession, setMarkingSession] = useState<{
    sessionId?: string // valid if editing
    classId: string
    className: string
    classCode: string
    date: Date
    topic: string
    students: Student[]
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Analytics State
  const [statsData, setStatsData] = useState<{ overall: { daily: any[], monthly: any[] }, trend: any[] }>({
    overall: { daily: [], monthly: [] },
    trend: []
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [trendClassId, setTrendClassId] = useState<string>("")
  
  // Full Report Modal
  const [isFullReportOpen, setIsFullReportOpen] = useState(false)
  const [fullReportType, setFullReportType] = useState<"overall" | "class">("overall")

  // Session Report Modal
  const [isSessionReportOpen, setIsSessionReportOpen] = useState(false)
  const [selectedReportSession, setSelectedReportSession] = useState<AttendanceSession | null>(null)
  const [sessionStudents, setSessionStudents] = useState<Student[]>([])
  const [loadingReport, setLoadingReport] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Refetch sessions when class filter changes
  useEffect(() => {
    if (!loading) {
      fetchSessions()
    }
  }, [selectedClass])

  // Refetch trend data when trendClassId changes
  useEffect(() => {
    async function fetchStats() {
      try {
        setLoadingStats(true)
        const response = await fetch(`/api/teacher/attendance/stats${trendClassId && trendClassId !== "all" ? `?classId=${trendClassId}` : ""}`)
        const result = await response.json()
        if (result.success) {
          setStatsData(result.data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoadingStats(false)
      }
    }
    if (trendClassId) { // Only fetch if a class is selected
      fetchStats()
    }
  }, [trendClassId])



  const fetchSessionReport = async (session: AttendanceSession) => {
    try {
        setLoadingReport(true)
        setSelectedReportSession(session)
        const res = await fetch(`/api/attendance/${session.id}`)
        const data = await res.json()
        if (data.success) {
            setSessionStudents(data.data.students)
            setIsSessionReportOpen(true)
        }
    } catch (error) {
        toast({ title: "Error", description: "Failed to load report", variant: "destructive" })
    } finally {
        setLoadingReport(false)
    }
  }

  // Fetch today's marked classes whenever dialog opens for new entry
  useEffect(() => {
    if (isMarkingOpen && !markingSession) {
      fetchTodayMarkedClasses()
    }
  }, [isMarkingOpen, markingSession])

  const fetchTodayMarkedClasses = async () => {
    try {
      setLoadingToday(true)
      const res = await fetch("/api/attendance?today=true")
      const data = await res.json()
      if (data.success) {
        setMarkedTodayClasses(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch today's marked classes:", error)
    } finally {
      setLoadingToday(false)
    }
  }

  // Check if a session is older than 48 hours (locked for editing)
  const isSessionLocked = (createdAt: string | Date) => {
    return Date.now() - new Date(createdAt).getTime() > LOCK_WINDOW_MS
  }

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const classesRes = await fetch("/api/classes?role=TEACHER")
      const classesData = await classesRes.json()
      if (classesData.classes) {
        setTeacherClasses(classesData.classes.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code
        })))
      }
      await fetchSessions()
    } catch (error) {
      console.error("Failed to fetch initial data:", error)
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const query = selectedClass !== "all" ? `?classId=${selectedClass}` : ""
      const sessionsRes = await fetch(`/api/attendance${query}`)
      const sessionsData = await sessionsRes.json()
      if (sessionsData.success) {
        setSessions(sessionsData.data)
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
    }
  }

  // Derived state for calendar modifiers
  const sessionDates = sessions.map(s => new Date(s.date))
  const getSessionForDate = (d: Date) => sessions.filter(s => new Date(s.date).toDateString() === d.toDateString())

  // Start Marking new attendance
  const startNewAttendance = async (classId: string) => {
    const cls = teacherClasses.find(c => c.id === classId)
    if (!cls) return

    try {
      setIsSubmitting(true)
      // For a real app, you might want to fetch *active* students only
      const res = await fetch(`/api/teacher/classes/${classId}`)
      const data = await res.json()

      if (data.success && data.data.enrollments) {
        const students: Student[] = data.data.enrollments.map((e: any) => ({
          id: e.student.id,
          name: e.student.user.name,
          email: e.student.user.email,
          image: e.student.user.image,
          enrollmentNumber: e.student.enrollmentNo || "N/A",
          status: "PRESENT", // Default to present
          remarks: ""
        }))

        setMarkingSession({
          classId: cls.id,
          className: cls.name,
          classCode: cls.code,
          date: new Date(),
          topic: "",
          students
        })
        setIsMarkingOpen(true)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load students", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this attendance session? This cannot be undone.")) return

    try {
      const res = await fetch(`/api/attendance?sessionId=${sessionId}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Session deleted" })
        fetchSessions() // Refresh
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete session", variant: "destructive" })
    }
  }

  const editSession = async (sessionId: string) => {
    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/attendance/${sessionId}`)
      const data = await res.json()

      if (data.success) {
        // Guard: check 48h lock before opening editor
        if (data.data.createdAt && isSessionLocked(data.data.createdAt)) {
          toast({
            title: "Edit Window Closed",
            description: "This session can no longer be edited — the 48-hour window has closed.",
            variant: "destructive"
          })
          return
        }
        setMarkingSession({
          sessionId: sessionId,
          classId: data.data.classId,
          className: data.data.className,
          classCode: data.data.classCode,
          date: new Date(data.data.date),
          topic: data.data.topic,
          students: data.data.students
        })
        setIsMarkingOpen(true)
      } else {
        throw new Error(data.error || "Failed to fetch session details")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load session for editing", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveAttendance = async () => {
    if (!markingSession) return
    if (!markingSession.topic) {
      toast({ title: "Validation Error", description: "Topic is required", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        classId: markingSession.classId,
        date: markingSession.date.toISOString(),
        topic: markingSession.topic,
        attendances: markingSession.students.map(s => ({
          studentId: s.id,
          status: s.status,
          remarks: s.remarks
        }))
      }

      const method = markingSession.sessionId ? "PUT" : "POST"
      const finalPayload = markingSession.sessionId ? { ...payload, sessionId: markingSession.sessionId } : payload

      const res = await fetch("/api/attendance", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...finalPayload,
          attendances: markingSession.students
            .filter(s => s.status !== null) // Only send those with a status set
            .map(s => ({
              studentId: s.id,
              status: s.status,
              remarks: s.remarks
            }))
        })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Attendance saved successfully", variant: "success" })
        setIsMarkingOpen(false)
        setMarkingSession(null)
        fetchSessions()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save attendance", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateStudentStatus = (id: string, status: Student["status"]) => {
    if (!markingSession) return
    setMarkingSession({
      ...markingSession,
      students: markingSession.students.map(s => s.id === id ? { ...s, status } : s)
    })
  }

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  const sessionsOnDate = date ? getSessionForDate(date) : []

  // Date Helpers for Custom Grid
  const currentDate = date || new Date()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const navigateMonth = (direction: number) => {
    setDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
  }

  const isSelected = (day: number) => {
    if (!date) return false
    return day === date.getDate() &&
      currentDate.getMonth() === date.getMonth() &&
      currentDate.getFullYear() === date.getFullYear()
  }

  const isFutureDate = (day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return checkDate > today
  }

  const hasSession = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return sessionDates.some(d => d.toDateString() === checkDate.toDateString())
  }

  // Stats
  const totalSessions = sessions.length
  const totalRate = sessions.length > 0 ?
    (sessions.reduce((acc, s) => acc + (s.totalPresent / s.totalStudents), 0) / sessions.length * 100).toFixed(1) : "0.0"

  // Process data for charts
  const chartData = [...sessions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14) // Last 14 sessions
    .map(s => ({
      date: format(new Date(s.date), "MMM dd"),
      present: s.totalPresent,
      absent: s.totalAbsent
    }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#00E599]"></div>
          <p className="text-[#555] font-bold uppercase tracking-widest text-[10px]">Synchronizing Records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 min-h-screen bg-[#000] -m-6 p-8 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E599]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#1C1C1C]">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">
            Attendance
          </h1>
          <p className="text-[13px] text-[#555] font-medium uppercase tracking-widest mt-2">
            Manage student tracking and presence metrics
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#111] p-1.5 rounded-2xl shadow-sm border border-[#1C1C1C]">
          <div className="flex items-center gap-2 px-3">
            <Filter className="w-4 h-4 text-[#555]" />
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[160px] md:w-[200px] border-none shadow-none focus:ring-0 font-bold text-white text-[11px] uppercase tracking-wider bg-transparent">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#1C1C1C] text-white">
                <SelectItem value="all" className="text-[11px] font-bold uppercase tracking-widest focus:bg-white/5">All Classes</SelectItem>
                {teacherClasses.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-[11px] font-bold uppercase tracking-widest focus:bg-white/5">{c.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-[1px] bg-[#1C1C1C] mx-1"></div>

          <Dialog open={isMarkingOpen} onOpenChange={setIsMarkingOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => !markingSession && fetchTodayMarkedClasses()} className="h-9 px-6 bg-white hover:bg-white/90 text-black font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all active:scale-95 border-none">
                <Plus className="w-4 h-4 mr-2" />
                Record Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-[2.5rem] bg-[#000] border-[#1C1C1C]">
              {!markingSession ? (
                <div className="p-0 flex flex-col h-full">
                  <div className="p-8 bg-[#00E599]/10 border-b border-[#1C1C1C] relative">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Users className="w-16 h-16 text-[#00E599]" />
                    </div>
                    <DialogHeader className="relative z-10">
                      <DialogTitle className="text-xl font-bold text-white tracking-tight">Select Class</DialogTitle>
                      <DialogDescription className="text-[11px] font-bold text-[#555] uppercase tracking-widest mt-1">Choose a class to start recording attendance</DialogDescription>
                    </DialogHeader>
                  </div>
                  <div className="p-8 grid grid-cols-1 gap-4 overflow-y-auto">
                    {teacherClasses.map(cls => {
                      const alreadyMarked = markedTodayClasses.some(m => m.classId === cls.id)
                      return (
                        <div key={cls.id} className="relative">
                          <Button
                            variant="outline"
                            className={cn(
                              "h-auto p-6 justify-start transition-all duration-300 group rounded-2xl w-full relative overflow-hidden",
                              alreadyMarked
                                ? "opacity-40 cursor-not-allowed bg-[#080808] border-[#1C1C1C] border-dashed"
                                : "hover:border-[#00E599]/40 hover:bg-[#00E599]/5 bg-[#080808] border-[#1C1C1C] border-solid"
                            )}
                            disabled={alreadyMarked || loadingToday}
                            onClick={() => !alreadyMarked && startNewAttendance(cls.id)}
                          >
                            <div className={cn(
                              "p-4 rounded-xl mr-5 transition-all duration-300",
                              alreadyMarked ? "bg-white/5 text-[#555]" : "bg-[#00E599]/10 text-[#00E599] group-hover:scale-110"
                            )}>
                              {alreadyMarked
                                ? <Lock className="w-5 h-5" />
                                : <Users className="w-5 h-5" />}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <div className="font-bold text-white text-base tracking-tight leading-tight group-hover:text-[#00E599] transition-colors">{cls.name}</div>
                              <div className="text-[10px] font-bold text-[#555] uppercase tracking-widest mt-1">{cls.code}</div>
                              {alreadyMarked && (
                                <div className="text-[10px] text-[#A855F7] font-bold uppercase tracking-wider mt-2 flex items-center gap-1.5 opacity-80">
                                  <CheckCircle className="w-3 h-3" />
                                  Already Recorded Today
                                </div>
                              )}
                            </div>
                            {!alreadyMarked && (
                              <ArrowUpRight className="w-5 h-5 text-[#222] group-hover:text-[#00E599] transition-colors" />
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                // Marking UI
                <div className="flex flex-col h-full bg-[#000]">
                  <div className="p-8 border-b border-[#1C1C1C] bg-white/[0.02] flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <CheckSquare className="w-24 h-24 text-white" />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <DialogTitle className="text-xl font-bold flex items-center gap-3 text-white tracking-tight">
                          {markingSession.className}
                          <Badge className="bg-white/10 text-white border-0 text-[9px] font-bold tracking-widest uppercase h-5">{markingSession.classCode}</Badge>
                        </DialogTitle>
                        <DialogDescription className="text-[11px] font-bold text-[#555] uppercase tracking-widest mt-2">{format(markingSession.date, "EEEE, MMMM do yyyy")}</DialogDescription>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest bg-white/5 border-[#1C1C1C] hover:bg-white/10 text-white rounded-lg transition-all" onClick={() => setMarkingSession({
                        ...markingSession,
                        students: markingSession.students.map(s => ({ ...s, status: "PRESENT" }))
                      })}>
                        Full Attendance
                      </Button>
                    </div>

                    <div className="relative z-10">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Sparkles className="h-4 w-4 text-[#A855F7]" />
                      </div>
                      <Input
                        className="pl-11 h-12 text-sm bg-white/[0.03] border-[#1C1C1C] focus:border-[#A855F7]/40 text-white p-4 rounded-xl transition-all placeholder:text-[#333]"
                        placeholder="Define session focus (e.g. 'Advanced Vector Calculus')"
                        value={markingSession.topic}
                        onChange={(e) => setMarkingSession({ ...markingSession, topic: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="divide-y divide-[#1C1C1C]">
                      {markingSession.students.map((student, idx) => (
                        <div key={student.id} className={cn("px-8 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group", idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]")}>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-[#1C1C1C] shadow-sm rounded-xl">
                              <AvatarImage src={student.image} />
                              <AvatarFallback className="bg-black text-[#A855F7] text-[10px] font-bold">{getInitials(student.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-sm text-white leading-none mb-1.5 flex items-center gap-3 tracking-tight">
                                {student.name}
                                {student.status === null && (
                                  <Badge className="h-4 px-1.5 text-[8px] border-[#A855F7]/30 text-[#A855F7] bg-[#A855F7]/10 font-bold uppercase tracking-widest">PENDING</Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest leading-none">{student.enrollmentNumber}</div>
                            </div>
                          </div>

                          <div className="flex gap-1.5 bg-black p-1.5 rounded-xl border border-[#1C1C1C] shadow-inner">
                            {[
                              { stat: "PRESENT", label: "P", activeClass: "bg-[#00E599] text-black shadow-[0_0_15px_rgba(0,229,153,0.3)]", inactiveClass: "text-[#444] hover:text-[#00E599] hover:bg-[#00E599]/10" },
                              { stat: "ABSENT", label: "A", activeClass: "bg-[#F87171] text-black shadow-[0_0_15px_rgba(248,113,113,0.3)]", inactiveClass: "text-[#444] hover:text-[#F87171] hover:bg-[#F87171]/10" },
                              { stat: "LATE", label: "L", activeClass: "bg-[#FB923C] text-black shadow-[0_0_15px_rgba(251,146,60,0.3)]", inactiveClass: "text-[#444] hover:text-[#FB923C] hover:bg-[#FB923C]/10" },
                              { stat: "EXCUSED", label: "E", activeClass: "bg-[#3B82F6] text-black shadow-[0_0_15px_rgba(59,130,246,0.3)]", inactiveClass: "text-[#444] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10" }
                            ].map((opt) => (
                              <button
                                key={opt.stat}
                                title={opt.stat}
                                className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-300",
                                  student.status === opt.stat ? opt.activeClass : opt.inactiveClass
                                )}
                                onClick={() => updateStudentStatus(student.id, opt.stat as Student["status"])}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter className="p-8 border-t border-[#1C1C1C] bg-white/[0.02] flex sm:justify-between items-center z-10">
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Verified Population: <span className="text-white">{markingSession.students.length} Students</span></p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                      <Button variant="ghost" onClick={() => {
                        setIsMarkingOpen(false);
                        setTimeout(() => setMarkingSession(null), 200);
                      }} className="h-12 px-8 bg-transparent hover:bg-white/5 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all">Discard</Button>
                      <Button onClick={saveAttendance} disabled={isSubmitting} className="h-12 min-w-[160px] bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-[0_5px_20px_rgba(255,255,255,0.1)] border-none transition-all active:scale-95">
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting ? "Syncing..." : "Finalize Record"}
                      </Button>
                    </div>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>      {/* Main Content: Calendar & List (Top) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 space-y-6">
          <Card className="overflow-hidden border-[#1C1C1C] shadow-[0_8px_30px_rgba(0,0,0,0.5)] bg-[#111] rounded-[2rem]">
            <CardHeader className="border-b border-[#1C1C1C] bg-white/[0.02] pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-sm font-bold text-white uppercase tracking-widest">
                  <CalendarIcon className="w-4 h-4 text-[#A855F7]" />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)} className="rounded-xl bg-transparent border-[#1C1C1C] hover:bg-white/5 text-white h-9 w-9">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateMonth(1)} className="rounded-xl bg-transparent border-[#1C1C1C] hover:bg-white/5 text-white h-9 w-9">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-[#444] uppercase tracking-widest pb-2">
                    {day}
                  </div>
                ))}
                {[...Array(firstDayOfMonth)].map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1
                  const loopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                  const future = isFutureDate(day)

                  return (
                    <button
                      key={day}
                      onClick={() => !future && setDate(loopDate)}
                      disabled={future}
                      title={future ? "Attendance can only be reported in real-time" : undefined}
                      className={cn(
                        "aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative border",
                        future
                        ? "opacity-10 cursor-not-allowed border-transparent text-[#222]"
                        : isSelected(day)
                          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] border-white scale-105 z-10 font-bold"
                          : isToday(day)
                            ? "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/30 font-bold hover:bg-[#00E599]/20"
                            : "bg-transparent border-transparent hover:bg-white/5 text-[#B5B5B5] font-medium"
                      )}
                    >
                      <span className="text-sm tracking-tight">{day}</span>
                      {hasSession(day) && !future && (
                        <div className={cn(
                          "absolute bottom-1.5 w-1 h-1 rounded-full",
                          isSelected(day) ? "bg-black" : "bg-[#A855F7]"
                        )}></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="bg-[#A855F7]/5 border border-[#A855F7]/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[#A855F7]/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#A855F7]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#A855F7]/20 transition-all"></div>
            <div className="flex gap-4 items-start relative z-10">
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#A855F7]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#B5B5B5] uppercase tracking-widest mb-1">Teacher Insight</p>
                <p className="text-[13px] text-[#B5B5B5] leading-relaxed">Dates highlighted with a <span className="text-[#A855F7] font-bold underline decoration-[#A855F7]/30 underline-offset-4">purple indicator</span> contain finalized attendance records. Select a date to review detailed metrics.</p>
              </div>
            </div>
          </div>
        </div>

        {/* List Side */}
        <Card className="lg:col-span-6 bg-[#111] border-[#1C1C1C] rounded-[2rem] overflow-hidden min-h-[500px]">
          <CardHeader className="p-8 border-b border-[#1C1C1C] bg-white/[0.01] flex flex-row items-center justify-between pb-6">
            <div>
              <CardTitle className="text-xl font-bold text-white tracking-tight">
                {date ? format(date, "MMMM do, yyyy") : "Archive History"}
              </CardTitle>
              <CardDescription className="text-[11px] font-bold text-[#555] uppercase tracking-widest mt-1">
                {sessionsOnDate.length > 0 ? `${sessionsOnDate.length} Active Sessions` : "Zero records found"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-transparent min-h-[400px]">
            {sessionsOnDate.length > 0 ? (
              <div className="p-8 space-y-6">
                {sessionsOnDate.map(session => (
                    <div key={session.id} className="group bg-black rounded-[1.5rem] p-6 border border-[#1C1C1C] hover:border-[#A855F7]/30 transition-all duration-300 relative overflow-hidden">
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                      session.totalAbsent === 0 ? "bg-[#00E599]" :
                        session.totalAbsent < session.totalStudents * 0.2 ? "bg-[#3B82F6]" : "bg-[#F87171]"
                    )}></div>

                    <div className="flex flex-col sm:flex-row justify-between gap-6 ml-2">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-white/5 text-[#555] border-0 text-[10px] font-bold tracking-widest uppercase">{session.classCode}</Badge>
                          <h3 className="font-bold text-lg text-white tracking-tight group-hover:text-[#A855F7] transition-colors">{session.className}</h3>
                        </div>
                        <p className="text-[#B5B5B5] flex items-center text-sm font-medium leading-relaxed">
                          <span className="text-[#444] mr-3 uppercase text-[10px] font-bold tracking-widest">Topic:</span> {session.topic}
                        </p>

                        <div className="flex gap-6 pt-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#555]">
                            <div className="w-2 h-2 rounded-full bg-[#00E599] shadow-[0_0_8px_#00E599]"></div>
                            {session.totalPresent} Present
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#555]">
                            <div className="w-2 h-2 rounded-full bg-[#F87171] shadow-[0_0_8px_#F87171]"></div>
                            {session.totalAbsent} Absent
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-3 bg-white/5 border border-white/5 hover:bg-[#A855F7]/10 hover:text-[#A855F7] text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all"
                            onClick={() => fetchSessionReport(session)}
                          >
                            <FileText className="w-3 h-3 mr-1" /> Show Report
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                        {session.createdAt && isSessionLocked(session.createdAt) ? (
                            <div className="flex items-center gap-2 h-8 px-4 bg-white/5 rounded-xl border border-[#1C1C1C]">
                                <Lock className="w-3.5 h-3.5 text-[#FB923C]" />
                                <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest">Final</span>
                            </div>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className="bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 text-[#555] hover:text-[#3B82F6] h-10 w-10 transition-all" onClick={() => editSession(session.id)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="bg-white/[0.02] border border-white/5 rounded-xl hover:bg-red-500/10 text-[#555] hover:text-red-500 h-10 w-10 transition-all" onClick={() => deleteSession(session.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 py-24">
                <div className="bg-white/[0.02] rounded-full mb-8 border border-white/5 p-8 flex items-center justify-center">
                  <CalendarIcon className="w-12 h-12 text-[#222]" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Zero Session Data</h3>
                <p className="text-[11px] font-bold text-[#444] uppercase tracking-widest mt-3 max-w-xs leading-relaxed">
                  Select an active date from the calendar or initiate a new attendance record.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Area */}
      <div className="relative z-10 space-y-8">
        {/* Overall Attendance Bar Chart */}
        <Card className="bg-[#111] border-[#1C1C1C] rounded-[2.5rem] overflow-hidden group">
          <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-[#00E599]" />
                  Overall Attendance
              </CardTitle>
              <CardDescription className="text-[11px] text-[#555] font-bold uppercase tracking-widest mt-1">Global participation across all your classes</CardDescription>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-4 bg-white/5 border-[#1C1C1C] hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                onClick={() => {
                    setFullReportType("overall");
                    setIsFullReportOpen(true);
                }}
            >
                Full Report
            </Button>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData.overall.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1C1C1C" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#555", fontWeight: "bold" }}
                    dy={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#555", fontWeight: "bold" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-[#000] border border-[#1C1C1C] p-4 rounded-2xl shadow-2xl min-w-[200px] space-y-3">
                                    <div className="border-b border-white/5 pb-2">
                                        <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">{data.fullDate}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-[#555] uppercase tracking-widest">Sessions</span>
                                            <span className="text-white">{data.totalClasses}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-[#555] uppercase tracking-widest">Rate</span>
                                            <span className="text-[#00E599]">{data.avgAttendance.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold pt-1 border-t border-white/5">
                                            <span className="text-[#00E599] uppercase tracking-widest">Present</span>
                                            <span className="text-white">{data.presents}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-[#F87171] uppercase tracking-widest">Absent</span>
                                            <span className="text-white">{data.absents}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    }}
                  />
                  <Bar dataKey="avgAttendance" name="Attendance Rate" fill="#00E599" radius={[8, 8, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Class Trend Line Chart */}
        <Card className="bg-[#111] border-[#1C1C1C] rounded-[2.5rem] overflow-hidden group">
          <CardHeader className="p-8 pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <LineChart className="w-4 h-4 text-[#3B82F6]" />
                        Class Trend Analysis
                    </CardTitle>
                    <CardDescription className="text-[11px] text-[#555] font-bold uppercase tracking-widest mt-1">Daily progression for specific class selections</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={trendClassId} onValueChange={setTrendClassId}>
                        <SelectTrigger className="w-[180px] bg-black border-[#1C1C1C] rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest text-white px-4">
                            <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#000] border-[#1C1C1C] text-white">
                            {[...teacherClasses].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold uppercase tracking-widest">{c.code} - {c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 px-4 bg-white/5 border-[#1C1C1C] hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                        onClick={() => {
                            setFullReportType("class");
                            setIsFullReportOpen(true);
                        }}
                    >
                        Full Report
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statsData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1C1C1C" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#555", fontWeight: "bold" }}
                    dy={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#555", fontWeight: "bold" }}
                  />
                  <Tooltip
                    cursor={{ stroke: '#3B82F6', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-[#000] border border-[#1C1C1C] p-4 rounded-2xl shadow-2xl min-w-[200px] space-y-3">
                                    <div className="border-b border-white/5 pb-2">
                                        <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">{data.fullDate}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-[#555] uppercase tracking-widest">Enrolled</span>
                                            <span className="text-white">{data.totalStudents}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-[#555] uppercase tracking-widest">Rate</span>
                                            <span className="text-[#3B82F6]">{data.attendanceRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold pt-1 border-t border-white/5">
                                            <span className="text-[#00E599] uppercase tracking-widest">Present</span>
                                            <span className="text-white">{data.presents}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-[#F87171] uppercase tracking-widest">Absent</span>
                                            <span className="text-white">{data.absents}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="attendanceRate" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTrend)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section Moved Below */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#111] border-[#1C1C1C] rounded-[2rem] overflow-hidden group hover:border-[#00E599]/30 transition-all">
          <CardContent className="p-8">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-[#00E599]/10 border border-[#00E599]/20 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-[#00E599]" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-white tracking-tight">{totalRate}%</p>
                  <Badge className="bg-[#00E599]/10 text-[#00E599] border-0 text-[10px] font-bold tracking-widest">AVG RATE</Badge>
                </div>
                <p className="text-[11px] font-bold text-[#555] mt-1 uppercase tracking-widest">Performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-[#1C1C1C] rounded-[2rem] overflow-hidden group hover:border-[#A855F7]/30 transition-all">
          <CardContent className="p-8">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-[#A855F7]/10 border border-[#A855F7]/20 group-hover:scale-110 transition-transform">
                <CalendarIcon className="w-6 h-6 text-[#A855F7]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white tracking-tight">{totalSessions}</p>
                <p className="text-[11px] font-bold text-[#555] mt-1 uppercase tracking-widest">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-[#1C1C1C] rounded-[2rem] overflow-hidden group hover:border-[#3B82F6]/30 transition-all">
          <CardContent className="p-8">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white tracking-tight">{teacherClasses.length}</p>
                <p className="text-[11px] font-bold text-[#555] mt-1 uppercase tracking-widest">Active Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Report Modal */}
      <Dialog open={isFullReportOpen} onOpenChange={setIsFullReportOpen}>
        <DialogContent className="max-w-4xl bg-[#000] border-[#1C1C1C] rounded-[2.5rem] p-0 overflow-hidden">
            <div className="p-8 bg-[#111] border-b border-[#1C1C1C]">
                <DialogTitle className="text-2xl font-bold text-white tracking-tight">Attendance Analysis Report</DialogTitle>
                <DialogDescription className="text-[11px] font-bold text-[#555] uppercase tracking-widest mt-2">
                    Comprehensive performance audit for the last 6 months
                </DialogDescription>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
                <div className="space-y-6">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#1C1C1C] text-[10px] font-bold text-[#555] uppercase tracking-widest">
                                <th className="pb-4">Period</th>
                                <th className="pb-4">Sessions</th>
                                <th className="pb-4">Avg. Attendance</th>
                                <th className="pb-4">Present</th>
                                <th className="pb-4">Absent</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {statsData.overall.monthly.map((m, idx) => (
                                <tr key={idx} className="text-sm">
                                    <td className="py-4 font-bold text-white">{m.fullMonth}</td>
                                    <td className="py-4 text-[#B5B5B5]">{m.totalClasses}</td>
                                    <td className="py-4 text-[#00E599] font-bold">{m.avgAttendance.toFixed(1)}%</td>
                                    <td className="py-4 text-white">{m.presents}</td>
                                    <td className="py-4 text-[#F87171]">{m.absents}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="p-6 bg-[#A855F7]/5 rounded-2xl border border-[#A855F7]/10">
                        <div className="flex gap-4">
                            <Info className="w-5 h-5 text-[#A855F7] flex-shrink-0" />
                            <p className="text-xs text-[#B5B5B5] leading-relaxed">
                                <span className="text-white font-bold">Policy Note:</span> We keep record of only 6 months for attendance. If you want more detailed report, contact support.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter className="p-8 bg-[#111] border-t border-[#1C1C1C]">
                <Button onClick={() => setIsFullReportOpen(false)} className="bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] h-10 px-8 rounded-xl">Close Report</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Report Modal */}
      <Dialog open={isSessionReportOpen} onOpenChange={setIsSessionReportOpen}>
        <DialogContent className="max-w-3xl bg-[#000] border-[#1C1C1C] rounded-[2.5rem] p-0 overflow-hidden">
            {selectedReportSession && (
                <>
                <div className="p-8 bg-[#111] border-b border-[#1C1C1C]">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-white tracking-tight">{selectedReportSession.className} - Report</DialogTitle>
                            <DialogDescription className="text-[11px] font-bold text-[#555] uppercase tracking-widest mt-2">
                                {format(new Date(selectedReportSession.date), "MMMM do, yyyy")} • {selectedReportSession.topic}
                            </DialogDescription>
                        </div>
                        <Badge className="bg-[#A855F7]/10 text-[#A855F7] border-0 font-bold tracking-widest uppercase">{selectedReportSession.classCode}</Badge>
                    </div>
                </div>
                <div className="p-8 max-h-[50vh] overflow-y-auto">
                    {loadingReport ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#A855F7]"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                {sessionStudents.map(student => (
                                    <div key={student.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border border-[#1C1C1C]">
                                                <AvatarImage src={student.image} />
                                                <AvatarFallback className="bg-black text-[#A855F7] text-xs">{getInitials(student.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-bold text-white">{student.name}</p>
                                                <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest">{student.enrollmentNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {student.remarks && (
                                                <span className="text-[10px] text-[#555] italic">"{student.remarks}"</span>
                                            )}
                                            <Badge className={cn("font-bold uppercase tracking-widest text-[9px]", 
                                                student.status === "PRESENT" ? "bg-[#00E599]/10 text-[#00E599]" :
                                                student.status === "ABSENT" ? "bg-[#F87171]/10 text-[#F87171]" :
                                                "bg-white/10 text-white"
                                            )}>
                                                {student.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="p-8 bg-[#111] border-t border-[#1C1C1C]">
                    <Button onClick={() => setIsSessionReportOpen(false)} className="bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] h-10 px-8 rounded-xl">Back to List</Button>
                </DialogFooter>
                </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
