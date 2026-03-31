"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
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
  color?: string | null
  type: "personal"
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  class: { icon: BookOpen, label: "Class" },
  assignment: { icon: FileText, label: "Assignment" },
  exam: { icon: FileText, label: "Exam" },
  meeting: { icon: Calendar, label: "Meeting" },
  announcement: { icon: Bell, label: "Announcement" },
  task: { icon: CheckSquare, label: "Task" },
  note: { icon: Pencil, label: "Note" },
  reminder: { icon: Bell, label: "Reminder" },
  other: { icon: Tag, label: "Other" },
  event: { icon: CalendarDays, label: "Event" },
}

const PERSONAL_SUBTYPES = ["note", "reminder", "task", "other"]
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
        "group relative flex gap-3 p-3 rounded-lg border border-border bg-card transition-all hover:shadow-sm",
        status === "past" && "opacity-50"
      )}
    >
      <div className={cn(
        "absolute left-0 top-2 bottom-2 w-0.5 rounded-full",
        status === "today" ? "bg-primary" :
          status === "upcoming" ? "bg-muted-foreground/40" :
            "bg-muted-foreground/20"
      )} />

      <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pl-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-tight truncate">{event.title}</p>
          {status === "today" && (
            <Badge variant="outline" className="text-[10px] shrink-0 border-primary/40 text-primary bg-primary/5">Today</Badge>
          )}
          {status === "past" && (
            <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground">Past</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(event.startDate), "MMM d, h:mm a")}
          </span>
          {"location" in event && event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{event.location}
            </span>
          )}
          {"class" in event && event.class && (
            <span className="text-muted-foreground/70">{event.class.code}</span>
          )}
        </div>

        {event.description && (
          <p className="mt-1 text-[11px] text-muted-foreground/80 line-clamp-1">{event.description}</p>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onEdit}>
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentCalendarPage() {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [academicEvents, setAcademicEvents] = useState<CalendarEvent[]>([])
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"academic" | "personal">("academic")

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<PersonalEvent | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", description: "", startDate: new Date().toISOString(),
    endDate: "", subtype: "note",
  })

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchAcademic = useCallback(async () => {
    const res = await fetch("/api/student/events")
    if (res.ok) {
      const data = await res.json()
      setAcademicEvents(Array.isArray(data) ? data : [])
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

  // ─── Calendar helpers ───────────────────────────────────────────────────────

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

  // ─── Dialog helpers ─────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingEvent(null)
    setForm({ title: "", description: "", startDate: selectedDate.toISOString(), endDate: "", subtype: "note" })
    setDialogOpen(true)
  }

  const openEdit = (event: PersonalEvent) => {
    setEditingEvent(event)
    setForm({
      title: event.title, description: event.description ?? "",
      startDate: event.startDate, endDate: event.endDate ?? "",
      subtype: event.color ?? "note",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.startDate) {
      toast({ title: "Title and date are required", variant: "destructive" }); return
    }
    setIsSaving(true)
    try {
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
      setDialogOpen(false)
    } catch {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (event: PersonalEvent) => {
    try {
      const res = await fetch(`/api/calendar/personal/${event.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setPersonalEvents(pe => pe.filter(e => e.id !== event.id))
        toast({ title: "Deleted" })
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your schedule, assignments, exams, and personal notes.</p>
        </div>
        {activeTab === "personal" && (
          <Button size="sm" onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Personal Note
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "academic" | "personal")}>
        <TabsList className="mb-4 bg-muted/50 border border-border">
          <TabsTrigger value="academic" className="gap-2">
            <CalendarDays className="w-4 h-4" /> Academic
          </TabsTrigger>
          <TabsTrigger value="personal" className="gap-2">
            <Pencil className="w-4 h-4" /> Personal
          </TabsTrigger>
        </TabsList>

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
              <Card className="lg:col-span-5 border-border shadow-sm flex flex-col min-h-[380px]">
                <CardHeader className="pb-2 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        {format(selectedDate, "EEEE, MMMM d")}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    {tab === "personal" && (
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={openAdd}>
                        <Plus className="w-3.5 h-3.5" /> Add
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pt-3 space-y-2">
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
                          onEdit={event.type === "personal" ? () => openEdit(event as PersonalEvent) : undefined}
                          onDelete={event.type === "personal" ? () => handleDelete(event as PersonalEvent) : undefined}
                        />
                      ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming / Past */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-sm font-semibold text-foreground">Upcoming — Next 14 Days</CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-2 max-h-72 overflow-y-auto">
                  {(() => {
                    const end = new Date(Date.now() + 14 * 86400000)
                    const items = allVisibleEvents
                      .filter(e => { const d = new Date(e.startDate); return (isFuture(d) || isToday(d)) && d <= end })
                      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    return items.length === 0
                      ? <p className="text-sm text-muted-foreground text-center py-6">Nothing coming up</p>
                      : items.map(e => (
                        <EventCard
                          key={e.id}
                          event={e}
                          onEdit={e.type === "personal" ? () => openEdit(e as PersonalEvent) : undefined}
                          onDelete={e.type === "personal" ? () => handleDelete(e as PersonalEvent) : undefined}
                        />
                      ))
                  })()}
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-sm font-semibold text-foreground">Recent — Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-2 max-h-72 overflow-y-auto">
                  {(() => {
                    const start = new Date(Date.now() - 7 * 86400000)
                    const items = allVisibleEvents
                      .filter(e => { const d = new Date(e.startDate); return isPast(d) && !isToday(d) && d >= start })
                      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                    return items.length === 0
                      ? <p className="text-sm text-muted-foreground text-center py-6">No recent events</p>
                      : items.map(e => <EventCard key={e.id} event={e} />)
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Personal event dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingEvent ? "Edit" : "New"} Personal Note
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Personal entries are only visible to you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Title"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date & Time *</Label>
              <DateTimePicker
                date={form.startDate ? new Date(form.startDate) : undefined}
                setDate={d => d && setForm(f => ({ ...f, startDate: d.toISOString() }))}
                placeholder="Select date & time"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.subtype} onValueChange={v => setForm(f => ({ ...f, subtype: v }))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSONAL_SUBTYPES.map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Add details…"
                rows={2}
                className="bg-background border-border resize-none text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : editingEvent ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
