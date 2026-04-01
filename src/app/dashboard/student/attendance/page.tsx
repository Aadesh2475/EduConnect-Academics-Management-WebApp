"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users,
  MapPin,
  Bell,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RaiseIssueDialog } from "@/components/student/RaiseIssueDialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import { cn, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface AttendanceRecord {
  id: string
  date: string
  className: string
  classCode: string
  topic?: string
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
}

interface Event {
  id: string
  title: string
  type: "class" | "exam" | "assignment" | "event" | "holiday"
  date: string
  time?: string
  location?: string
  className?: string
  description?: string
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function StudentAttendancePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedClass, setSelectedClass] = useState("all")
  const [activeTab, setActiveTab] = useState("attendance")

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/student/attendance${selectedClass !== "all" ? `?classId=${selectedClass}` : ""}`)
      const data = await res.json()
      if (data.success) {
        setAttendanceRecords(data.data.records)
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events")
      const data = await res.json()
      if (data.success) {
        setEvents(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
  }

  useEffect(() => {
    fetchAttendance()
    fetchEvents()
  }, [selectedClass])

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))

    return days
  }

  const getStatusForDate = (date: Date) => {
    const record = attendanceRecords.find(r => new Date(r.date).toDateString() === date.toDateString())
    return record?.status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-emerald-500"
      case "ABSENT": return "bg-rose-500"
      case "LATE": return "bg-amber-500"
      case "EXCUSED": return "bg-white"
      default: return "bg-[#252525]"
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "class": return "bg-white/10 text-white border-white/20"
      case "exam": return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      case "assignment": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "event": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      default: return "bg-[#161616] text-[#888] border-[#252525]"
    }
  }

  const filteredRecords = selectedClass === "all" ? attendanceRecords : attendanceRecords.filter(r => r.classCode === selectedClass)
  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter(r => r.status === "PRESENT").length,
    absent: filteredRecords.filter(r => r.status === "ABSENT").length,
    late: filteredRecords.filter(r => r.status === "LATE").length,
    rate: Math.round((filteredRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length / (filteredRecords.length || 1)) * 100) || 0,
  }

  const uniqueClasses = [...new Set(attendanceRecords.map(r => r.classCode))]

  if (loading) return <SkeletonDashboard />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Attendance & Calendar</h1>
          <p className="text-[#9A9A9A]">Track your attendance and upcoming events</p>
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48 bg-[#111111] border-[#252525] text-white h-10">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent className="bg-[#111111] border-[#252525] text-white">
            <SelectItem value="all">All Classes</SelectItem>
            {uniqueClasses.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Classes", value: stats.total, icon: BookOpen, color: "white" },
          { label: "Present", value: stats.present, icon: CheckCircle, color: "emerald" },
          { label: "Absent", value: stats.absent, icon: XCircle, color: "rose" },
          { label: "Late", value: stats.late, icon: Clock, color: "amber" },
          { label: "Attendance Rate", value: `${stats.rate}%`, icon: Users, color: "white" },
        ].map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="bg-[#161616] border-[#1C1C1C] overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">{stat.label}</p>
                    <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border",
                    stat.color === "white" && "bg-white/5 border-white/10 text-white",
                    stat.color === "emerald" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                    stat.color === "rose" && "bg-rose-500/10 border-rose-500/20 text-rose-500",
                    stat.color === "amber" && "bg-amber-500/10 border-amber-500/20 text-amber-500",
                  )}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#111111] border border-[#252525] p-1 rounded-xl h-11">
          <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-[#9A9A9A]"><CheckCircle className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-[#9A9A9A]"><CalendarIcon className="w-4 h-4 mr-2" />Calendar</TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-[#9A9A9A]"><Bell className="w-4 h-4 mr-2" />Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-[#161616] border-[#1C1C1C]">
              <CardHeader className="pb-2 border-b border-[#252525] px-6 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="border-[#252525] text-[#9A9A9A] hover:text-white hover:bg-white/10 h-8 w-8" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" className="border-[#252525] text-[#9A9A9A] hover:text-white hover:bg-white/10 h-8 text-xs font-semibold uppercase tracking-wider" onClick={() => setCurrentDate(new Date())}>Today</Button>
                    <Button variant="outline" size="icon" className="border-[#252525] text-[#9A9A9A] hover:text-white hover:bg-white/10 h-8 w-8" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map(day => <div key={day} className="text-center text-xs font-bold uppercase tracking-widest text-[#555] py-2">{day}</div>)}
                  {getCalendarDays().map((date, index) => {
                    const status = date ? getStatusForDate(date) : null
                    const isToday = date?.toDateString() === new Date().toDateString()
                    const isSelected = selectedDate?.toDateString() === date?.toDateString()
                    return (
                      <div key={index} className={cn("aspect-square p-1 rounded-xl cursor-pointer transition-all relative border border-transparent", date && "hover:bg-white/5", isToday && "bg-white/10", isSelected && "border-white bg-white/5")} onClick={() => date && setSelectedDate(date)}>
                        {date && (
                          <>
                            <span className={cn("text-sm font-medium text-[#888]", isToday && "font-bold text-white", isSelected && "text-white")}>{date.getDate()}</span>
                            {status && <div className={cn("absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-sm", getStatusColor(status))} />}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-5 mt-4 pt-4 border-t border-[#252525]">
                  {[{ status: "Present", color: "bg-emerald-500" }, { status: "Absent", color: "bg-rose-500" }, { status: "Late", color: "bg-amber-500" }, { status: "Excused", color: "bg-white" }].map(item => (
                    <div key={item.status} className="flex items-center gap-2"><div className={cn("w-2 h-2 rounded-full", item.color)} /><span className="text-[10px] font-bold text-[#888] uppercase tracking-widest">{item.status}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#161616] border-[#1C1C1C]">
              <CardHeader className="pb-2 border-b border-[#252525] px-6 py-4">
                <CardTitle className="text-white text-base">{selectedDate ? formatDate(selectedDate) : "Select a date"}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedDate ? (
                  <div className="space-y-4">
                    {attendanceRecords.filter(r => new Date(r.date).toDateString() === selectedDate.toDateString()).map(record => (
                      <div key={record.id} className="p-4 bg-[#111111] border border-[#252525] rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="bg-[#1F1F1F] text-[#888] hover:bg-[#1F1F1F] border border-[#252525] uppercase tracking-widest text-[10px]">{record.classCode}</Badge>
                          <Badge className={cn("border-0 text-[10px] uppercase font-bold tracking-widest",
                            record.status === "PRESENT" ? "bg-emerald-500/10 text-emerald-500" :
                              record.status === "ABSENT" ? "bg-rose-500/10 text-rose-500" :
                                record.status === "LATE" ? "bg-amber-500/10 text-amber-500" :
                                  "bg-white/10 text-white"
                          )}>{record.status}</Badge>
                        </div>
                        <p className="font-bold text-sm text-white">{record.className}</p>
                        {record.topic && <p className="text-xs text-[#888]">{record.topic}</p>}

                        <RaiseIssueDialog
                          defaultCategory="ATTENDANCE"
                          defaultTitle={`Attendance Issue: ${record.className}`}
                          defaultDescription={`I was marked as ${record.status} but I believe this is incorrect.`}
                          entityId={record.id}
                          entityType={`Attendance - ${record.className}`}
                          trigger={
                            <Button variant="ghost" size="sm" className="w-full mt-2 bg-[#1A1A1A] hover:bg-white/5 border border-[#252525] text-[#9A9A9A] hover:text-white h-8 text-[10px] uppercase tracking-widest font-bold">
                              <AlertTriangle className="w-3 h-3 mr-2" /> Report Issue
                            </Button>
                          }
                        />
                      </div>
                    ))}
                    {attendanceRecords.filter(r => new Date(r.date).toDateString() === selectedDate.toDateString()).length === 0 && <p className="text-center text-[#555] text-sm py-8 font-medium">No records for this date</p>}
                  </div>
                ) : <p className="text-center text-[#555] text-sm py-8 font-medium">Click on a date to view details</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6 outline-none">
          <Card className="bg-[#161616] border-[#1C1C1C]">
            <CardHeader className="border-b border-[#252525]"><CardTitle className="text-white">Monthly Overview</CardTitle></CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 max-w-md">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]"><span>Attendance Rate</span><span className="text-white">{stats.rate}%</span></div>
                <Progress value={stats.rate} className="h-2 bg-[#1C1C1C]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col items-center justify-center">
                  <p className="text-4xl font-bold text-emerald-500">{stats.present}</p>
                  <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mt-2">Days Present</p>
                </div>
                <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col items-center justify-center">
                  <p className="text-4xl font-bold text-rose-500">{stats.absent}</p>
                  <p className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest mt-2">Days Absent</p>
                </div>
                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col items-center justify-center">
                  <p className="text-4xl font-bold text-amber-500">{stats.late}</p>
                  <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mt-2">Days Late</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6 outline-none">
          <div className="space-y-4">
            {events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event, index) => (
              <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="bg-[#161616] border-[#1C1C1C] hover:border-[#252525] transition-all">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                      <div className="text-center bg-white/5 border border-white/10 rounded-xl p-3 min-w-[70px] shrink-0">
                        <p className="text-2xl font-bold text-white">{new Date(event.date).getDate()}</p>
                        <p className="text-[10px] font-bold text-[#888] uppercase tracking-widest">{MONTHS[new Date(event.date).getMonth()].slice(0, 3)}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-bold text-white text-lg leading-none">{event.title}</h3>
                          <Badge className={cn("text-[9px] font-bold uppercase tracking-widest border border-dashed rounded-md px-2", getEventColor(event.type))}>{event.type}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-[11px] font-medium text-[#888]">
                          {event.time && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#555]" />{event.time}</span>}
                          {event.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#555]" />{event.location}</span>}
                          {event.className && <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-[#555]" />{event.className}</span>}
                        </div>
                        {event.description && <p className="text-sm font-medium text-[#777] mt-3">{event.description}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {events.filter(e => new Date(e.date) >= new Date()).length === 0 && (
              <div className="text-center py-16 bg-[#161616] border border-[#1C1C1C] rounded-2xl border-dashed">
                <Bell className="w-12 h-12 mx-auto text-[#252525] mb-4" />
                <p className="text-[#888] font-bold">No upcoming events scheduled</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
