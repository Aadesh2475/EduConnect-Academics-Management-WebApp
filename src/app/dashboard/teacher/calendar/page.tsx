"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { DatetimePicker as DateTimePicker } from "@/components/ui/datetime-picker"
import {
  ChevronLeft, ChevronRight, Plus, Edit, Trash2,
  CalendarDays, BookOpen, FileText, Bell, CheckSquare,
  Calendar, Clock, MapPin, Tag, Pencil
} from "lucide-react"
import { format, isToday, isPast, isFuture, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string
  title: string
  startDate: string
  endDate?: string | null
  type: string
  description?: string | null
  location?: string | null
  color?: string | null
  class?: { id: string; name: string; code: string } | null
  isGlobal?: boolean
  isEditable?: boolean
}

interface PersonalEvent {
  id: string
  title: string
  startDate: string
  endDate?: string | null
  description?: string | null
  color?: string | null // used as subtype: note | reminder | task | other
  type: "personal"
}

interface TeacherClass { id: string; name: string; code: string }

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  class: { icon: BookOpen, label: "Class" },
  assignment: { icon: FileText, label: "Assignment" },
  exam: { icon: FileText, label: "Exam" },
  meeting: { icon: Calendar, label: "Meeting" },
  office: { icon: Clock, label: "Office Hours" },
  holiday: { icon: CalendarDays, label: "Holiday" },
  announcement: { icon: Bell, label: "Announcement" },
  task: { icon: CheckSquare, label: "Task" },
  note: { icon: Pencil, label: "Note" },
  reminder: { icon: Bell, label: "Reminder" },
  other: { icon: Tag, label: "Other" },
}

const PERSONAL_SUBTYPES = ["note", "reminder", "task", "other"]
const MANUAL_TYPES = ["class", "assignment", "exam", "meeting", "office", "holiday"]

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ─── Status helper ────────────────────────────────────────────────────────────

function eventStatus(dateStr: string): "past" | "today" | "upcoming" {
  const d = new Date(dateStr)
  if (isToday(d)) return "today"
  if (isPast(d)) return "past"
  return "upcoming"
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent | PersonalEvent
  onEdit?: () => void
  onDelete?: () => void
}) {
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.other
  const Icon = cfg.icon
  const status = eventStatus(event.startDate)

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-4 rounded-2xl border border-[#262626] bg-[#1F1F1F] transition-all hover:border-[#333] hover:shadow-2xl hover:shadow-black/50",
        status === "past" && "opacity-90"
      )}
    >
      {/* Left accent bar */}
      <div className={cn(
        "absolute left-0 top-3 bottom-3 w-1 rounded-full",
        status === "today" ? "bg-white" :
          status === "upcoming" ? "bg-[#333]" :
            "bg-[#1C1C1C]"
      )} />

      <div className="flex-shrink-0 mt-1 flex items-center justify-center h-8 w-8 rounded-xl bg-[#1F1F1F] border border-[#2C2C2C]">
        <Icon className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-white leading-tight tracking-tight truncate">{event.title}</p>
          {status === "today" && (
            <Badge className="bg-white/5 text-white border border-white/10 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0">Today</Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-medium text-[#D1D5DB] flex-wrap">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {format(new Date(event.startDate), "MMM d, h:mm a")}
          </span>
          {"location" in event && event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />{event.location}
            </span>
          )}
          {"class" in event && event.class && (
            <span className="text-white bg-white/10 px-2 py-0.5 rounded-md border border-white/10">{event.class.code}</span>
          )}
        </div>

        {event.description && (
          <p className="mt-2 text-[11px] font-medium text-[#D1D5DB] line-clamp-2 leading-relaxed">{event.description}</p>
        )}
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 lg:opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-[#1C1C1C]">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9A9A9A] hover:text-white hover:bg-white/10 rounded-lg" onClick={onEdit}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9A9A9A] hover:text-red-500 hover:bg-red-500/10 rounded-lg" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherCalendarPage() {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [academicEvents, setAcademicEvents] = useState<CalendarEvent[]>([])
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([])
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"academic" | "personal">("academic")

  // ── Dialog state ──
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | PersonalEvent | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ── New event form ──
  const [form, setForm] = useState({
    title: "", description: "", startDate: new Date().toISOString(),
    endDate: "", location: "", type: "class", classId: "none", subtype: "note",
  })

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAcademic = useCallback(async () => {
    const res = await fetch("/api/teacher/events")
    const data = await res.json()
    if (data.events) {
      setAcademicEvents(data.events)
      setClasses(data.classes ?? [])
    }
  }, [])

  const fetchPersonal = useCallback(async () => {
    const res = await fetch("/api/calendar/personal")
    const data = await res.json()
    if (data.success) setPersonalEvents(data.data)
  }, [])

  useEffect(() => {
    Promise.all([fetchAcademic(), fetchPersonal()]).finally(() => setLoading(false))
  }, [fetchAcademic, fetchPersonal])

  // ─── Calendar helpers ────────────────────────────────────────────────────────

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const navigateMonth = (dir: number) =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1))

  const allVisibleEvents = activeTab === "academic" ? academicEvents : personalEvents

  const getEventsForDay = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return allVisibleEvents.filter(e => isSameDay(new Date(e.startDate), d))
  }

  const selectedDayEvents = allVisibleEvents.filter(e =>
    isSameDay(new Date(e.startDate), selectedDate)
  )

  // ─── Dialogs ─────────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingEvent(null)
    setForm({
      title: "", description: "", startDate: selectedDate.toISOString(),
      endDate: "", location: "", type: activeTab === "personal" ? "personal" : "class",
      classId: "none", subtype: "note",
    })
    setDialogOpen(true)
  }

  const openEdit = (event: CalendarEvent | PersonalEvent) => {
    setEditingEvent(event)
    if (event.type === "personal") {
      const pe = event as PersonalEvent
      setForm({
        title: pe.title, description: pe.description ?? "",
        startDate: pe.startDate, endDate: pe.endDate ?? "",
        location: "", type: "personal", classId: "none",
        subtype: pe.color ?? "note",
      })
    } else {
      const ae = event as CalendarEvent
      setForm({
        title: ae.title, description: ae.description ?? "",
        startDate: ae.startDate, endDate: ae.endDate ?? "",
        location: ae.location ?? "", type: ae.type,
        classId: ae.class?.id ?? "none", subtype: "note",
      })
    }
    setDialogOpen(true)
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title || !form.startDate) {
      toast({ title: "Title and date are required", variant: "destructive" }); return
    }
    setIsSaving(true)
    try {
      const isPersonal = activeTab === "personal"
      if (isPersonal) {
        const payload = {
          title: form.title, description: form.description,
          startDate: form.startDate, endDate: form.endDate || null,
          subtype: form.subtype,
        }
        if (editingEvent) {
          const res = await fetch(`/api/calendar/personal/${editingEvent.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
          const data = await res.json()
          if (data.success) {
            setPersonalEvents(pe => pe.map(e => e.id === editingEvent.id ? data.data : e))
            toast({ title: "Updated" })
          }
        } else {
          const res = await fetch("/api/calendar/personal", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
          const data = await res.json()
          if (data.success) {
            setPersonalEvents(pe => [...pe, data.data])
            toast({ title: "Added" })
          }
        }
      } else {
        // Academic manual event
        const payload = {
          title: form.title, description: form.description,
          type: form.type, startDate: form.startDate,
          endDate: form.endDate || null, location: form.location,
          classId: form.classId === "none" ? null : form.classId,
        }
        if (editingEvent) {
          const res = await fetch(`/api/teacher/events/${editingEvent.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
          if (res.ok) {
            const saved = await res.json()
            setAcademicEvents(ae => ae.map(e => e.id === editingEvent.id ? { ...saved, isEditable: true } : e))
            toast({ title: "Event updated" })
          }
        } else {
          const res = await fetch("/api/teacher/events", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
          if (res.ok) {
            const saved = await res.json()
            setAcademicEvents(ae => [...ae, { ...saved, isEditable: true }])
            toast({ title: "Event created" })
          }
        }
      }
      setDialogOpen(false)
    } catch (e) {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (event: CalendarEvent | PersonalEvent) => {
    try {
      if (event.type === "personal") {
        const res = await fetch(`/api/calendar/personal/${event.id}`, { method: "DELETE" })
        const data = await res.json()
        if (data.success) setPersonalEvents(pe => pe.filter(e => e.id !== event.id))
      } else {
        const res = await fetch(`/api/teacher/events/${event.id}`, { method: "DELETE" })
        if (res.ok || res.status === 204) setAcademicEvents(ae => ae.filter(e => e.id !== event.id))
      }
      toast({ title: "Deleted" })
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 lg:ml-0 rounded-[2rem] space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 pb-4 border-b border-[#1C1C1C]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Calendar</h1>
          <p className="text-[13px] text-[#B5B5B5] mt-2">Schedule & student activities</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAdd} className="bg-white hover:bg-white/90 text-black font-semibold h-9 px-4 rounded-xl transition-all active:scale-95 shadow-lg text-sm">
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === "personal" ? "Add Entry" : "Create"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "academic" | "personal")}>
        <TabsList className="mb-8 bg-[#161616] border border-[#1C1C1C] p-1 rounded-2xl h-10">
          <TabsTrigger value="academic" className="rounded-xl px-6 h-8 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-[#9A9A9A] font-bold text-xs uppercase tracking-widest transition-all">
            <CalendarDays className="w-4 h-4 mr-2" /> Academic
          </TabsTrigger>
          <TabsTrigger value="personal" className="rounded-xl px-6 h-8 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-[#9A9A9A] font-bold text-xs uppercase tracking-widest transition-all">
            <Pencil className="w-4 h-4 mr-2" /> Personal Notes
          </TabsTrigger>
        </TabsList>

        {/* Both tabs share the same layout */}
        {(["academic", "personal"] as const).map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Calendar grid */}
              <Card className="lg:col-span-7 border-border shadow-sm">
                <CardHeader className="pb-2 border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </CardTitle>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateMonth(-1)}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateMonth(1)}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 pb-4">
                  <div className="grid grid-cols-7 gap-1">
                    {dayNames.map(d => (
                      <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">{d}</div>
                    ))}
                    {[...Array(firstDayOfMonth)].map((_, i) => (
                      <div key={`e-${i}`} className="aspect-square" />
                    ))}
                    {[...Array(daysInMonth)].map((_, i) => {
                      const day = i + 1
                      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      const dayEvts = getEventsForDay(day)
                      const todayDay = isToday(dayDate)
                      const selDay = isSameDay(dayDate, selectedDate)

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(dayDate)}
                          className={cn(
                            "aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-sm",
                            selDay && !todayDay ? "ring-2 ring-white/80 dark:ring-white/60 bg-white/10 dark:bg-white/5 text-foreground font-semibold shadow-md"
                              : todayDay ? "bg-gradient-to-br from-white to-gray-50 dark:from-white/20 dark:to-white/5 ring-2 ring-white/70 shadow-[0_0_14px_rgba(255,255,255,0.9)] dark:shadow-[0_0_14px_rgba(255,255,255,0.4)] text-gray-900 dark:text-white font-bold"
                                : "text-foreground hover:bg-muted/60"
                          )}
                        >
                          <span className="text-[13px] leading-none mb-1">{day}</span>
                          {dayEvts.length > 0 && (
                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {dayEvts.slice(0, 3).map((_, idx) => (
                                <div key={idx} className="w-1 h-1 rounded-full bg-foreground/40" />
                              ))}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Day panel */}
              <Card className="lg:col-span-5 border-[#1C1C1C] bg-[#161616] rounded-[2rem] shadow-2xl flex flex-col min-h-[400px]">
                <CardHeader className="py-4 px-6 border-b border-[#1C1C1C]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Details</p>
                      <CardTitle className="text-sm font-bold text-white tracking-tight">
                        {format(selectedDate, "EEEE, MMMM d")}
                      </CardTitle>
                    </div>
                    <Button variant="outline" onClick={openAdd} className="border-[#2C2C2C] text-white/60 hover:bg-white/5 hover:text-white rounded-xl h-9 px-4 font-bold text-[10px] uppercase tracking-widest transition-all">
                      <Plus className="w-4 h-4 mr-1.5" /> New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedDayEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-2 text-muted-foreground">
                      <CalendarDays className="w-8 h-8 text-muted-foreground/30" />
                      <p className="text-sm">No events for this day</p>
                    </div>
                  ) : (
                    selectedDayEvents
                      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                      .map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onEdit={"isEditable" in event && event.isEditable || event.type === "personal" ? () => openEdit(event) : undefined}
                          onDelete={"isEditable" in event && event.isEditable || event.type === "personal" ? () => handleDelete(event) : undefined}
                        />
                      ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming / Past section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Upcoming */}
              <Card className="border-[#1C1C1C] bg-[#161616] rounded-[2rem] shadow-xl overflow-hidden">
                <CardHeader className="py-5 px-7 border-b border-[#1C1C1C]">
                   <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Timeline</p>
                  <CardTitle className="text-sm font-bold text-white tracking-tight">Next 14 Days</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {(() => {
                    const end = new Date(Date.now() + 14 * 86400000)
                    const items = allVisibleEvents
                      .filter(e => {
                        const d = new Date(e.startDate)
                        return (isFuture(d) || isToday(d)) && d <= end
                      })
                      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    return items.length === 0
                      ? <p className="text-sm text-muted-foreground text-center py-6">Nothing coming up</p>
                      : items.map(e => (
                        <EventCard
                          key={e.id}
                          event={e}
                          onEdit={"isEditable" in e && e.isEditable || e.type === "personal" ? () => openEdit(e) : undefined}
                          onDelete={"isEditable" in e && e.isEditable || e.type === "personal" ? () => handleDelete(e) : undefined}
                        />
                      ))
                  })()}
                </CardContent>
              </Card>

              {/* Past */}
              <Card className="border-[#1C1C1C] bg-[#161616] rounded-[2rem] shadow-xl overflow-hidden">
                <CardHeader className="py-5 px-7 border-b border-[#1C1C1C]">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Archive</p>
                  <CardTitle className="text-sm font-bold text-white tracking-tight">Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {(() => {
                    const start = new Date(Date.now() - 7 * 86400000)
                    const items = allVisibleEvents
                      .filter(e => {
                        const d = new Date(e.startDate)
                        return isPast(d) && !isToday(d) && d >= start
                      })
                      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                    return items.length === 0
                      ? <p className="text-sm text-muted-foreground text-center py-6">No recent events</p>
                      : items.map(e => (
                        <EventCard key={e.id} event={e} />
                      ))
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-[#0A0A0A] border-[#1C1C1C] text-white rounded-[2rem] p-0 overflow-hidden">
          <DialogHeader className="p-7 pb-3">
            <DialogTitle className="text-xl font-bold text-white tracking-tight mb-1.5">
              {editingEvent ? "Edit Event" : "Create Event"}
            </DialogTitle>
            <DialogDescription className="text-[#555] text-sm font-medium leading-relaxed">
              {activeTab === "personal"
                ? "Add notes to your personal calendar."
                : "Schedule a new event for your classes."}
            </DialogDescription>
          </DialogHeader>

          <div className="px-8 py-4 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Event Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Weekly Sync"
                className="bg-[#161616] border-[#1C1C1C] h-12 rounded-xl focus:ring-white/20 text-white font-medium"
              />
            </div>

            {/* Date/Time */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Select Time *</Label>
              <div className="bg-[#161616] border border-[#1C1C1C] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-white/20">
                <DateTimePicker
                  date={form.startDate ? new Date(form.startDate) : undefined}
                  setDate={d => d && setForm(f => ({ ...f, startDate: d.toISOString() }))}
                  placeholder="Select time"
                />
              </div>
            </div>

            {activeTab === "personal" ? (
              /* Personal fields */
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Type</Label>
                <Select value={form.subtype} onValueChange={v => setForm(f => ({ ...f, subtype: v }))}>
                  <SelectTrigger className="bg-[#161616] border-[#1C1C1C] h-12 rounded-xl text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                    {PERSONAL_SUBTYPES.map(t => (
                      <SelectItem key={t} value={t} className="capitalize focus:bg-[#1F1F1F] focus:text-white">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              /* Academic fields */
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="bg-[#161616] border-[#1C1C1C] h-12 rounded-xl text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                      {MANUAL_TYPES.map(t => (
                        <SelectItem key={t} value={t} className="capitalize focus:bg-[#1F1F1F] focus:text-white">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Class</Label>
                  <Select value={form.classId} onValueChange={v => setForm(f => ({ ...f, classId: v }))}>
                    <SelectTrigger className="bg-[#161616] border-[#1C1C1C] h-12 rounded-xl text-white">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                      <SelectItem value="none" className="focus:bg-[#1F1F1F] focus:text-white">All Classes</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id} className="focus:bg-[#1F1F1F] focus:text-white">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Location (academic only) */}
            {activeTab === "academic" && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Location</Label>
                <Input
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g., Room 101"
                  className="bg-[#161616] border-[#1C1C1C] h-12 rounded-xl focus:ring-white/20 text-white"
                />
              </div>
            )}

            {/* Description / Notes */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-[#666] uppercase tracking-widest">
                {activeTab === "personal" ? "Notes" : "Description"}
              </Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Details..."
                rows={3}
                className="bg-[#161616] border-[#1C1C1C] rounded-xl resize-none text-white focus:ring-white/20"
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-4 gap-3 bg-[#161616]/30 border-t border-[#1C1C1C]">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving} className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-xs">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-white hover:bg-white/90 text-black h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.1)]">
              {isSaving ? "Saving..." : editingEvent ? "Save" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
