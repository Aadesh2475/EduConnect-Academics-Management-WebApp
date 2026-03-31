"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Plus,
  Search,
  Copy,
  Users,
  Calendar,
  Clock,
  FileText,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Flag
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SkeletonTable } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { getInitials, cn } from "@/lib/utils"

interface TeacherClass {
  id: string
  name: string
  code: string
  description?: string
  department: string
  semester: number
  subject: string
  isActive: boolean
  createdAt: string
  _count: {
    enrollments: number
    assignments: number
    exams: number
    materials: number
  }
  pendingRequests: number
}

interface JoinRequest {
  id: string
  student: {
    id: string
    user: {
      name: string
      email: string
      image?: string
    }
    enrollmentNo?: string
    department?: string
    semester?: number
  }
  createdAt: string
}

interface EnrolledStudent {
  id: string
  userId: string
  enrollmentId: string
  name: string
  email: string
  image?: string
  enrollmentNo?: string
  joinedAt: string
}

export default function TeacherClassesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog States
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRequestsDialog, setShowRequestsDialog] = useState(false)
  const [showStudentsDialog, setShowStudentsDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [classToDelete, setClassToDelete] = useState<string | null>(null)

  // Selection States
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([])
  const [selectedStudent, setSelectedStudent] = useState<EnrolledStudent | null>(null)

  // Form States
  const [creating, setCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    department: "",
    semester: "1",
    subject: "",
    isActive: true
  })
  const [reportData, setReportData] = useState({ reason: "", details: "" })

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/classes?role=TEACHER")
      const result = await res.json()

      if (res.ok) {
        // Adapt API response to the local state structure
        const adaptedClasses = (result.classes || []).map((c: any) => ({
          ...c,
          pendingRequests: c.enrollments?.length || 0
        }))
        setClasses(adaptedClasses)
      } else {
        toast({ title: "Error", description: result.error || "Failed to load classes", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleCreateOrUpdateClass = async () => {
    if (!newClass.name || !newClass.department || !newClass.subject) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setCreating(true)
    try {
      const url = isEditing && selectedClass ? `/api/teacher/classes/${selectedClass.id}` : "/api/classes"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newClass,
          semester: parseInt(newClass.semester)
        }),
      })

      const result = await res.json()

      if (res.ok) {
        toast({
          title: "Success",
          description: isEditing ? "Class updated successfully" : `Class created with code: ${result.data?.code || result.code}`,
          variant: "success"
        })
        setShowCreateDialog(false)
        resetClassForm()
        fetchClasses() // Refresh list
      } else {
        toast({ title: "Error", description: result.error || "Failed to save class", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save class", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteClass = async () => {
    if (!classToDelete) return
    try {
      const res = await fetch(`/api/teacher/classes/${classToDelete}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast({ title: "Deleted", description: "Class has been deleted successfully", variant: "success" })
        setClasses(prev => prev.filter(c => c.id !== classToDelete))
        setShowDeleteDialog(false)
        setClassToDelete(null)
      } else {
        const result = await res.json()
        toast({ title: "Error", description: result.error || "Failed to delete class", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    }
  }

  const handleViewRequests = async (cls: TeacherClass) => {
    setSelectedClass(cls)
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/classes/${cls.id}/requests`)
      const result = await res.json()
      if (res.ok) {
        setJoinRequests(result.data || [])
        setShowRequestsDialog(true)
      } else {
        toast({ title: "Error", description: result.error || "Failed to load requests", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleViewStudents = async (cls: TeacherClass) => {
    setSelectedClass(cls)
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/classes/${cls.id}/students`)
      const result = await res.json()
      if (res.ok) {
        setEnrolledStudents(result.data || [])
        setShowStudentsDialog(true)
      } else {
        toast({ title: "Error", description: result.error || "Failed to load students", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAction = async (requestId: string, action: "approve" | "reject") => {
    if (!selectedClass) return

    try {
      const res = await fetch(`/api/teacher/classes/${selectedClass.id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: requestId, action }),
      })

      const result = await res.json()

      if (res.ok) {
        setJoinRequests(prev => prev.filter(r => r.id !== requestId))
        toast({ title: action === "approve" ? "Approved" : "Rejected", description: result.message, variant: "success" })
        fetchClasses()
      } else {
        toast({ title: "Error", description: result.error || "Failed to process request", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return

    try {
      const res = await fetch(`/api/teacher/classes/${selectedClass.id}/students`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId })
      })

      if (res.ok) {
        setEnrolledStudents(prev => prev.filter(s => s.id !== studentId))
        toast({ title: "Removed", description: "Student removed from class", variant: "success" })
        fetchClasses()
      } else {
        const result = await res.json()
        toast({ title: "Error", description: result.error || "Failed to remove student", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove student", variant: "destructive" })
    }
  }

  const handleReportStudent = async () => {
    if (!selectedClass || !selectedStudent || !reportData.reason) {
      toast({ title: "Error", description: "Reason is required", variant: "destructive" })
      return
    }

    try {
      const res = await fetch(`/api/teacher/classes/${selectedClass.id}/students/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          reason: reportData.reason,
          details: reportData.details
        })
      })

      if (res.ok) {
        toast({ title: "Reported", description: "Student has been reported", variant: "success" })
        setShowReportDialog(false)
        setReportData({ reason: "", details: "" })
      } else {
        const result = await res.json()
        toast({ title: "Error", description: result.error || "Failed to report student", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to report student", variant: "destructive" })
    }
  }

  const openEditDialog = (cls: TeacherClass) => {
    setSelectedClass(cls)
    setNewClass({
      name: cls.name,
      description: cls.description || "",
      department: cls.department,
      semester: cls.semester.toString(),
      subject: cls.subject,
      isActive: cls.isActive
    })
    setIsEditing(true)
    setShowCreateDialog(true)
  }

  const resetClassForm = () => {
    setNewClass({ name: "", description: "", department: "", semester: "1", subject: "", isActive: true })
    setIsEditing(false)
    setSelectedClass(null)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: "Copied!", description: `Class code ${code} copied to clipboard` })
  }

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: classes.length,
    active: classes.filter(c => c.isActive).length,
    students: classes.reduce((acc, c) => acc + c._count.enrollments, 0),
    pendingRequests: classes.reduce((acc, c) => acc + c.pendingRequests, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight uppercase">My Classes</h1>
          <p className="text-[#9A9A9A] text-[10px] uppercase tracking-wider">Manage your academic sessions and students</p>
        </div>
        </div>
        <Button
          onClick={() => { resetClassForm(); setShowCreateDialog(true) }}
          className="bg-white hover:bg-white/90 text-black font-bold h-10 px-6 rounded-xl shadow-lg transition-all active:scale-95 border-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Class
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Classes", value: stats.total, icon: BookOpen },
          { label: "Active Sessions", value: stats.active, icon: CheckCircle },
          { label: "Enrolled Students", value: stats.students, icon: Users },
          { label: "Registration Requests", value: stats.pendingRequests, icon: AlertCircle },
        ].map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="border-[#1C1C1C] bg-[#161616] hover:border-[#2C2C2C] transition-all group overflow-hidden relative">
              <CardContent className="p-3">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-[8px] font-bold text-[#666] uppercase tracking-[0.2em]">{stat.label}</p>
                    <p className="text-lg font-black text-white mt-1">{stat.value}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#1F1F1F] border border-[#1C1C1C] group-hover:border-[#00E599]/30 group-hover:bg-[#00E599]/5 transition-all">
                    <stat.icon className="w-4 h-4 text-[#555] group-hover:text-[#00E599] transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-[#1C1C1C] bg-[#161616]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9A9A9A] w-4 h-4" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-[#00E599]/20"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <SkeletonTable />
      ) : filteredClasses.length === 0 ? (
        <Card className="bg-[#161616] border-[#1C1C1C] border-dashed">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-[2rem] bg-[#1F1F1F] border border-[#1C1C1C] flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-[#888]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Registered Classes</h3>
            <p className="text-sm text-[#9A9A9A] mb-8 max-w-sm mx-auto">Register your first academic session to begin managing students and assignments.</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-white hover:bg-white/90 text-black font-semibold h-10 px-8 rounded-xl shadow-lg transition-all active:scale-95 border-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredClasses.map((cls, index) => (
              <motion.div key={cls.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}>
                <Card className={cn("group hover:shadow-2xl hover:shadow-[#00E599]/5 transition-all bg-[#161616] border-[#1C1C1C] hover:border-[#00E599]/20 rounded-2xl overflow-hidden", cls.pendingRequests > 0 && "border-[#00E599]/30")}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-white text-base truncate pr-2 tracking-tight">{cls.name}</h3>
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-[0.1em] px-1.5 h-4 border-none",
                            cls.isActive ? "bg-[#00E599]/10 text-[#00E599]" : "bg-[#222] text-[#555]"
                          )}>{cls.isActive ? "Active" : "Archived"}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-[10px] font-mono text-[#9A9A9A] bg-black/40 px-2 py-0.5 rounded-lg border border-[#1C1C1C]">{cls.code}</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[#888] hover:text-[#00E599] hover:bg-[#00E599]/5" onClick={() => handleCopyCode(cls.code)}><Copy className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewStudents(cls)}>
                            <Users className="mr-2 h-4 w-4" />View Students ({cls._count.enrollments})
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(cls)}>
                            <Edit className="mr-2 h-4 w-4" />Edit Class
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-500 font-medium focus:text-red-400 focus:bg-red-500/10"
                            onClick={() => {
                              setClassToDelete(cls.id)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Class
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-xs font-medium text-[#9A9A9A] mb-6 line-clamp-2 h-8">{cls.description || "Experimental academic module"}</p>

                    {cls.pendingRequests > 0 && (
                      <div className="flex items-center justify-between p-3 bg-[#00E599]/5 border border-[#00E599]/20 rounded-xl mb-6 cursor-pointer hover:bg-[#00E599]/10 transition-all active:scale-[0.98] group" onClick={() => handleViewRequests(cls)}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
                        <span className="text-[10px] font-bold text-[#00E599] uppercase tracking-widest">{cls.pendingRequests} Registration Requests</span>
                      </div>
                        <span className="text-[10px] font-black text-white hover:text-black hover:bg-white uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg transition-colors">Review</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#888] pt-5 border-t border-[#1C1C1C]">
                      <div className="flex items-center gap-1.5 hover:text-[#00E599] transition-colors"><Users className="w-3.5 h-3.5" /><span>{cls._count.enrollments} Students</span></div>
                      <div className="flex items-center gap-1.5 hover:text-[#00E599] transition-colors"><FileText className="w-3.5 h-3.5" /><span>{cls._count.assignments} Tasks</span></div>
                      <div className="flex items-center gap-1.5 hover:text-[#00E599] transition-colors"><Clock className="w-3.5 h-3.5" /><span>Sem {cls.semester}</span></div>
                    </div>
                  </CardContent>
                  <Link href={`/dashboard/teacher/classes/${cls.id}`} className="block">
                    <Button className="w-full rounded-none border-t border-[#1C1C1C] h-11 text-[10px] font-black uppercase tracking-[0.2em] bg-white hover:bg-white/90 text-black transition-all border-none">
                      Open Workspace
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Class Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg bg-[#161616] border-[#1C1C1C]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">{isEditing ? "Edit Class" : "Create New Class"}</DialogTitle>
            <DialogDescription className="text-[#9A9A9A]">{isEditing ? "Update class details" : "Create a class and share the code with your students"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[#9A9A9A] font-medium">Class Name *</Label>
              <Input
                placeholder="e.g., Data Structures & Algorithms"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                className="bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-[#00E599]/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#9A9A9A] font-medium">Description</Label>
              <Textarea
                placeholder="Enter class description..."
                value={newClass.description}
                onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                className="bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-[#00E599]/20"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-medium">Department *</Label>
                <Input
                  placeholder="e.g., Computer Science"
                  value={newClass.department}
                  onChange={(e) => setNewClass({ ...newClass, department: e.target.value })}
                  className="bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-[#00E599]/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-medium">Semester *</Label>
                <Select value={newClass.semester} onValueChange={(v) => setNewClass({ ...newClass, semester: v })}>
                  <SelectTrigger className="bg-[#1F1F1F] border-[#1C1C1C] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <SelectItem key={s} value={s.toString()} className="focus:bg-[#1F1F1F] focus:text-[#00E599]">
                        Semester {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#9A9A9A] font-medium">Subject *</Label>
              <Input
                placeholder="e.g., Programming"
                value={newClass.subject}
                onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                className="bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-[#00E599]/20"
              />
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 pt-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={newClass.isActive ? "success" : "secondary"} className="cursor-pointer" onClick={() => setNewClass({ ...newClass, isActive: !newClass.isActive })}>
                    {newClass.isActive ? "Active" : "Archived"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">(Click to toggle)</span>
                </div>
              </div>
            )}

            {!isEditing && (
              <div className="bg-[#00E599]/5 border border-[#00E599]/20 p-4 rounded-xl">
                <p className="text-sm text-[#00E599] font-medium leading-relaxed">
                  <strong className="font-bold">Note:</strong> A unique class code will be generated automatically. Share this code with your students to join.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrUpdateClass}
              disabled={creating}
              className="bg-white hover:bg-white/90 text-black font-semibold px-8 h-10 rounded-xl transition-all active:scale-95 border-none"
            >
              {creating ? "Saving..." : (isEditing ? "Update Class" : "Create Class")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Requests Dialog */}
      <Dialog open={showRequestsDialog} onOpenChange={setShowRequestsDialog}>
        <DialogContent className="max-w-2xl bg-[#161616] border-[#1C1C1C]">
          <DialogHeader>
            <DialogTitle>Join Requests - {selectedClass?.name}</DialogTitle>
            <DialogDescription>Review and manage student enrollment requests</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {joinRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending requests</p>
            ) : (
              joinRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-xl border border-[#1C1C1C]">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-[#1C1C1C]">
                      <AvatarImage src={request.student?.user?.image} />
                      <AvatarFallback className="bg-[#161616] text-[#00E599] font-bold">{getInitials(request.student?.user?.name ?? "")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white text-sm">{request.student?.user?.name ?? "Unknown"}</p>
                      <p className="text-[10px] text-[#9A9A9A] font-bold">{request.student?.user?.email}</p>
                      <p className="text-[9px] text-[#B5B5B5]/80 font-bold uppercase tracking-widest mt-0.5">{request.student?.enrollmentNo} · {request.student?.department} · Sem {request.student?.semester}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRequestAction(request.id, "reject")} className="h-8 rounded-xl border-[#1C1C1C] text-[#888] hover:bg-white/10 font-bold text-[10px] uppercase tracking-widest">Decline</Button>
                    <Button size="sm" onClick={() => handleRequestAction(request.id, "approve")} className="h-8 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-[10px] uppercase tracking-widest border-none">Confirm</Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowRequestsDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrolled Students Dialog */}
      <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
        <DialogContent className="max-w-3xl bg-[#161616] border-[#1C1C1C]">
          <DialogHeader>
            <DialogTitle>Students - {selectedClass?.name}</DialogTitle>
            <DialogDescription>Manage enrolled students ({enrolledStudents.length})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto p-1">
            {enrolledStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No students enrolled yet</p>
            ) : (
              <div className="grid gap-3">
                {enrolledStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-[#1F1F1F] border border-[#1C1C1C] rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-[#1C1C1C]">
                        <AvatarImage src={student.image} />
                        <AvatarFallback className="bg-[#161616] text-[#00E599] font-bold">{getInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                          {student.enrollmentNo && <span>{student.enrollmentNo}</span>}
                          <span>• Joined: {new Date(student.joinedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline"
                        onClick={() => { setSelectedStudent(student); setShowReportDialog(true); }}
                        className="text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
                      >
                        <Flag className="w-4 h-4 mr-1" />Report
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Student Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md bg-[#161616] border-[#1C1C1C]">
          <DialogHeader>
            <DialogTitle>Report Student</DialogTitle>
            <DialogDescription>Report specific issues or concerns for <strong>{selectedStudent?.name}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={reportData.reason} onValueChange={(v) => setReportData({ ...reportData, reason: v })}>
                <SelectTrigger className="bg-[#1F1F1F] border-[#1C1C1C] text-white">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                  <SelectItem value="Attendance Issue" className="focus:bg-[#1F1F1F] focus:text-[#00E599]">Attendance Issue</SelectItem>
                  <SelectItem value="Behavioral Concern" className="focus:bg-[#1F1F1F] focus:text-[#00E599]">Behavioral Concern</SelectItem>
                  <SelectItem value="Academic Integrity" className="focus:bg-[#1F1F1F] focus:text-[#00E599]">Academic Integrity</SelectItem>
                  <SelectItem value="Missing Assignments" className="focus:bg-[#1F1F1F] focus:text-[#00E599]">Missing Assignments</SelectItem>
                  <SelectItem value="Other" className="focus:bg-[#1F1F1F] focus:text-[#00E599]">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional Details</Label>
              <Textarea
                placeholder="Provide specific details about the issue..."
                value={reportData.details}
                onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
                rows={4}
                className="bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-[#00E599]/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button onClick={handleReportStudent} className="bg-white hover:bg-white/90 text-black font-semibold h-10 px-6 rounded-xl transition-all active:scale-95 border-none">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Class Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md bg-[#161616] border-[#1C1C1C]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Class
            </DialogTitle>
            <DialogDescription className="text-[#9A9A9A]">
              This action <span className="text-red-500 font-bold uppercase">cannot be undone</span>. All associated assignments, exams, and attendance records will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl mt-4">
            <p className="text-sm text-red-500 font-medium">
              Are you absolutely sure you want to delete this class? This will also remove all enrolled students from this session.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white h-11 px-6 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteClass}
              disabled={creating}
              className="bg-red-500 hover:bg-red-600 text-white font-bold h-11 px-8 rounded-xl transition-all active:scale-95 border-none"
            >
              {creating ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
