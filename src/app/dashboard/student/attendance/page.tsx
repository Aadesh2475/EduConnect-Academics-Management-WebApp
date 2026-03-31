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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RaiseIssueDialog } from "@/components/student/RaiseIssueDialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
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
        // Note: The API also returns stats, which we can use
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

  const openReportDialog = (record: AttendanceRecord) => { }

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
      case "PRESENT": return "bg-green-500"
      case "ABSENT": return "bg-red-500"
      case "LATE": return "bg-yellow-500"
      case "EXCUSED": return "bg-blue-500"
      default: return "bg-gray-300"
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "class": return "bg-blue-100 text-blue-700"
      case "exam": return "bg-red-100 text-red-700"
      case "assignment": return "bg-purple-100 text-purple-700"
      case "event": return "bg-green-100 text-green-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const filteredRecords = selectedClass === "all" ? attendanceRecords : attendanceRecords.filter(r => r.classCode === selectedClass)
  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter(r => r.status === "PRESENT").length,
    absent: filteredRecords.filter(r => r.status === "ABSENT").length,
    late: filteredRecords.filter(r => r.status === "LATE").length,
    rate: Math.round((filteredRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length / filteredRecords.length) * 100) || 0,
  }

  const uniqueClasses = [...new Set(attendanceRecords.map(r => r.classCode))]

  if (loading) return <SkeletonDashboard />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance & Calendar</h1>
          <p className="text-gray-600">Track your attendance and upcoming events</p>
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {uniqueClasses.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Classes", value: stats.total, icon: BookOpen, color: "blue" },
          { label: "Present", value: stats.present, icon: CheckCircle, color: "green" },
          { label: "Absent", value: stats.absent, icon: XCircle, color: "red" },
          { label: "Late", value: stats.late, icon: Clock, color: "yellow" },
          { label: "Attendance Rate", value: `${stats.rate}%`, icon: Users, color: "purple" },
        ].map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                    stat.color === "blue" && "bg-blue-100 text-blue-600",
                    stat.color === "green" && "bg-green-100 text-green-600",
                    stat.color === "red" && "bg-red-100 text-red-600",
                    stat.color === "yellow" && "bg-yellow-100 text-yellow-600",
                    stat.color === "purple" && "bg-purple-100 text-purple-600"
                  )}><stat.icon className="w-4 h-4" /></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="attendance"><CheckCircle className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarIcon className="w-4 h-4 mr-2" />Calendar</TabsTrigger>
          <TabsTrigger value="events"><Bell className="w-4 h-4 mr-2" />Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map(day => <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>)}
                  {getCalendarDays().map((date, index) => {
                    const status = date ? getStatusForDate(date) : null
                    const isToday = date?.toDateString() === new Date().toDateString()
                    const isSelected = selectedDate?.toDateString() === date?.toDateString()
                    return (
                      <div key={index} className={cn("aspect-square p-1 rounded-lg cursor-pointer transition-colors relative", date && "hover:bg-gray-100", isToday && "bg-blue-50", isSelected && "ring-2 ring-blue-500")} onClick={() => date && setSelectedDate(date)}>
                        {date && (
                          <>
                            <span className={cn("text-sm", isToday && "font-bold text-blue-600")}>{date.getDate()}</span>
                            {status && <div className={cn("absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full", getStatusColor(status))} />}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                  {[{ status: "Present", color: "bg-green-500" }, { status: "Absent", color: "bg-red-500" }, { status: "Late", color: "bg-yellow-500" }, { status: "Excused", color: "bg-blue-500" }].map(item => (
                    <div key={item.status} className="flex items-center gap-2 text-sm"><div className={cn("w-3 h-3 rounded-full", item.color)} /><span className="text-gray-600">{item.status}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-lg">{selectedDate ? formatDate(selectedDate) : "Select a date"}</CardTitle></CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-4">
                    {attendanceRecords.filter(r => new Date(r.date).toDateString() === selectedDate.toDateString()).map(record => (
                      <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{record.classCode}</Badge>
                          <Badge variant={record.status === "PRESENT" ? "success" : record.status === "ABSENT" ? "destructive" : "secondary"}>{record.status}</Badge>
                        </div>
                        <p className="font-medium text-sm">{record.className}</p>
                        {record.topic && <p className="text-xs text-gray-500 mt-1">{record.topic}</p>}

                        <RaiseIssueDialog
                          defaultCategory="ATTENDANCE"
                          defaultTitle={`Attendance Issue: ${record.className} on ${format(new Date(record.date), "PPP")}`}
                          defaultDescription={`I was marked as ${record.status} but I believe this is incorrect.`}
                          entityId={record.id}
                          entityType={`Attendance - ${record.className}`}
                          trigger={
                            <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-yellow-600">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Report Issue
                            </Button>
                          }
                        />
                      </div>
                    ))}
                    {attendanceRecords.filter(r => new Date(r.date).toDateString() === selectedDate.toDateString()).length === 0 && <p className="text-center text-gray-500 py-8">No records</p>}
                  </div>
                ) : <p className="text-center text-gray-500 py-8">Click on a date to view details</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Monthly Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span>Attendance Rate</span><span className="font-medium">{stats.rate}%</span></div>
                <Progress value={stats.rate} className="h-3" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-green-50 rounded-lg text-center"><p className="text-3xl font-bold text-green-600">{stats.present}</p><p className="text-sm text-gray-600">Days Present</p></div>
                <div className="p-4 bg-red-50 rounded-lg text-center"><p className="text-3xl font-bold text-red-600">{stats.absent}</p><p className="text-sm text-gray-600">Days Absent</p></div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center"><p className="text-3xl font-bold text-yellow-600">{stats.late}</p><p className="text-sm text-gray-600">Days Late</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="space-y-4">
            {events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event, index) => (
              <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-center bg-blue-100 rounded-lg p-2 min-w-16">
                        <p className="text-2xl font-bold text-blue-600">{new Date(event.date).getDate()}</p>
                        <p className="text-xs text-blue-600">{MONTHS[new Date(event.date).getMonth()].slice(0, 3)}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge className={cn("capitalize", getEventColor(event.type))}>{event.type}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {event.time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{event.time}</span>}
                          {event.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</span>}
                          {event.className && <Badge variant="outline">{event.className}</Badge>}
                          {event.description && <p className="text-xs text-gray-400 w-full mt-1">{event.description}</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {events.filter(e => new Date(e.date) >= new Date()).length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No upcoming events</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
