"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Trash2, Clock, Calendar, CheckCircle2, Circle, Edit,
  Users, User, ChevronDown, ChevronUp, Flag, AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format, isPast, isToday } from "date-fns"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  completedAt: string | null
  createdAt: string
}

interface TeacherClass {
  id: string
  name: string
  code: string
}

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const

const PRIORITY_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
  LOW: { label: "Low", className: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", icon: "↓" },
  MEDIUM: { label: "Medium", className: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: "→" },
  HIGH: { label: "High", className: "text-red-400 border-red-500/30 bg-red-500/10", icon: "↑" },
}

function dueDateBadge(dueDate: string | null, status: string) {
  if (!dueDate || status === "COMPLETED") return null
  const d = new Date(dueDate)
  if (isToday(d)) return <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">Due today</Badge>
  if (isPast(d)) return <Badge variant="outline" className="text-[10px] border-red-300 text-red-600">Overdue</Badge>
  return null
}

// ─── Task Card ──────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task
  onToggle: (t: Task) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
}) {
  const done = task.status === "COMPLETED"
  const priCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM

  return (
    <div className={cn(
      "group flex items-start gap-3 p-3 rounded-lg border border-border bg-card transition-all hover:shadow-sm",
      done && "opacity-55"
    )}>
      <Checkbox
        checked={done}
        onCheckedChange={() => onToggle(task)}
        className="mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-tight", done && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {task.dueDate && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
          {dueDateBadge(task.dueDate, task.status)}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Badge variant="outline" className={cn("text-[10px]", priCfg.className)}>
          {priCfg.icon} {priCfg.label}
        </Badge>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => onEdit(task)}>
            <Edit className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TeacherTasksPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed">("all")

  const [form, setForm] = useState({
    title: "", description: "", priority: "MEDIUM",
    dueDate: "", classId: "personal",
  })

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/teacher/tasks")
    const data = await res.json()
    if (data.success) setTasks(data.data)
  }, [])

  const fetchClasses = useCallback(async () => {
    const res = await fetch("/api/teacher/events")
    const data = await res.json()
    if (data.classes) setClasses(data.classes)
  }, [])

  useEffect(() => {
    Promise.all([fetchTasks(), fetchClasses()]).finally(() => setLoading(false))
  }, [fetchTasks, fetchClasses])

  // ─── Dialog helpers ───────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingTask(null)
    setForm({ title: "", description: "", priority: "MEDIUM", dueDate: "", classId: "personal" })
    setDialogOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setForm({
      title: task.title, description: task.description ?? "",
      priority: task.priority, dueDate: task.dueDate
        ? task.dueDate.slice(0, 16) : "", classId: "personal",
    })
    setDialogOpen(true)
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" }); return
    }
    setIsSaving(true)
    try {
      if (editingTask) {
        const res = await fetch("/api/teacher/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingTask.id, title: form.title,
            description: form.description, priority: form.priority,
            dueDate: form.dueDate || null,
          })
        })
        const data = await res.json()
        if (data.success) {
          setTasks(ts => ts.map(t => t.id === editingTask.id ? data.data : t))
          toast({ title: "Task updated" })
        } else {
          toast({ title: "Failed", variant: "destructive" })
        }
      } else {
        const res = await fetch("/api/teacher/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title, description: form.description,
            priority: form.priority, dueDate: form.dueDate || null,
            classId: form.classId === "personal" ? undefined : form.classId,
          })
        })
        const data = await res.json()
        if (data.success) {
          setTasks(ts => [data.data, ...ts])
          if (data.studentsNotified) {
            toast({ title: "Task assigned", description: `${data.studentsNotified} student${data.studentsNotified !== 1 ? "s" : ""} notified.` })
          } else {
            toast({ title: "Task created" })
          }
        } else {
          toast({ title: "Failed", variant: "destructive" })
        }
      }
      setDialogOpen(false)
    } catch {
      toast({ title: "Error", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED"
    setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: newStatus, completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null } : t))
    try {
      const res = await fetch("/api/teacher/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus })
      })
      if (!res.ok) {
        setTasks(ts => ts.map(t => t.id === task.id ? task : t)) // revert
        toast({ title: "Failed to update", variant: "destructive" })
      }
    } catch {
      setTasks(ts => ts.map(t => t.id === task.id ? task : t))
    }
  }

  const deleteTask = async (id: string) => {
    const prev = tasks
    setTasks(ts => ts.filter(t => t.id !== id))
    try {
      const res = await fetch(`/api/teacher/tasks?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        setTasks(prev)
        toast({ title: "Failed to delete", variant: "destructive" })
      } else {
        toast({ title: "Task deleted" })
      }
    } catch {
      setTasks(prev)
    }
  }

  // ─── Filtered lists ───────────────────────────────────────────────────────

  const filtered = tasks.filter(t => {
    if (activeTab === "pending") return t.status !== "COMPLETED"
    if (activeTab === "completed") return t.status === "COMPLETED"
    return true
  })

  const completedCount = tasks.filter(t => t.status === "COMPLETED").length
  const pendingCount = tasks.filter(t => t.status !== "COMPLETED").length
  const overdueCount = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== "COMPLETED").length

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 min-h-screen bg-[#000] -m-6 p-8 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E599]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1C1C1C] pb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Tasks</h1>
          <p className="text-[13px] text-[#B5B5B5] mt-2">Manage personal and class-wide action items</p>
        </div>
        <Button 
          size="sm" 
          onClick={openAdd} 
          className="h-9 px-4 bg-white hover:bg-white/90 text-black font-semibold rounded-xl shadow-lg transition-all active:scale-95 border-none text-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> 
          Create
        </Button>
      </div>

      {/* Stats */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl shadow-none">
          <CardContent className="p-6">
            <p className="text-2xl font-bold text-white tracking-tight leading-none">{tasks.length}</p>
            <p className="text-[13px] text-[#B5B5B5] mt-2">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl shadow-none">
          <CardContent className="p-6">
            <p className="text-2xl font-bold text-amber-500 tracking-tight leading-none">{pendingCount}</p>
            <p className="text-[13px] text-[#B5B5B5] mt-2">Pending</p>
          </CardContent>
        </Card>
        <Card className={cn("bg-[#161616] border-[#1C1C1C] rounded-2xl shadow-none", overdueCount > 0 && "border-red-500/50")}>
          <CardContent className="p-6">
            <p className={cn("text-2xl font-bold tracking-tight leading-none", overdueCount > 0 ? "text-red-500" : "text-white")}>{overdueCount}</p>
            <p className="text-[13px] text-[#B5B5B5] mt-2">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Task list */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">My Tasks</CardTitle>
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
              <TabsList className="h-7 text-xs bg-muted/50 border border-border">
                <TabsTrigger value="all" className="h-6 px-2.5 text-[11px]">All ({tasks.length})</TabsTrigger>
                <TabsTrigger value="pending" className="h-6 px-2.5 text-[11px]">Pending ({pendingCount})</TabsTrigger>
                <TabsTrigger value="completed" className="h-6 px-2.5 text-[11px]">Done ({completedCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm">{activeTab === "completed" ? "No completed tasks yet" : "No tasks. Click \"Add Task\" to get started."}</p>
            </div>
          ) : (
            filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={openEdit}
                onDelete={deleteTask}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingTask
                ? "Update this task."
                : "Create a personal task or assign to a class — students will be notified."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Title *</Label>
              <Input
                autoFocus
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder="Task title"
                className="bg-background border-border"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional details…"
                rows={2}
                className="bg-background border-border resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Priority */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p} value={p}>
                        <span className={cn("font-medium", PRIORITY_CONFIG[p].className)}>
                          {PRIORITY_CONFIG[p].icon} {PRIORITY_CONFIG[p].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <Input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="bg-background border-border text-sm"
                />
              </div>
            </div>

            {/* Assign to Class (only for new tasks) */}
            {!editingTask && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Assign To</Label>
                <Select value={form.classId} onValueChange={v => setForm(f => ({ ...f, classId: v }))}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">
                      <span className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> Personal (just me)</span>
                    </SelectItem>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> {c.name} ({c.code})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.classId !== "personal" && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> All enrolled students will receive a notification.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)} disabled={isSaving} className="h-9 px-4 rounded-xl">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-9 px-4 rounded-xl bg-white hover:bg-white/90 text-black border-none font-semibold">
              {isSaving ? "Saving..." : editingTask ? "Confirm" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
