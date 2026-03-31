"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Calendar, FileText, Users, Edit, Trash2, GraduationCap } from "lucide-react"
import { DatetimePicker as DateTimePicker } from "@/components/ui/datetime-picker"

// Define types based on our API response
type ClassData = {
  id: string
  name: string
  code: string
}

type Assignment = {
  id: string
  title: string
  description: string
  dueDate: string
  totalMarks: number
  isActive: boolean
  className: string
  classCode: string
  classId: string
  submissionsCount: number
  totalStudents: number
}

export default function TeacherAssignmentsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [classes, setClasses] = useState<ClassData[]>([])

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    totalMarks: "100",
    classId: ""
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [assignmentsRes, classesRes] = await Promise.all([
        fetch("/api/teacher/assignments"),
        fetch("/api/teacher/classes")
      ])

      const assignmentsData = await assignmentsRes.json()
      const classesData = await classesRes.json()

      if (assignmentsData.success) {
        setAssignments(assignmentsData.data)
      }
      if (classesData.success) {
        setClasses(classesData.data)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({ title: "Error", description: "Failed to load assignments.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.dueDate || !formData.classId) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }

    setIsSubmitLoading(true)
    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Assignment created successfully." })
        setIsCreateOpen(false)
        setFormData({ title: "", description: "", instructions: "", dueDate: "", totalMarks: "100", classId: "" })
        fetchInitialData()
      } else {
        toast({ title: "Error", description: data.error || "Failed to create assignment", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAssignment) return
    setIsSubmitLoading(true)
    try {
      const res = await fetch(`/api/teacher/assignments/${selectedAssignment.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Deleted", description: "Assignment was deleted." })
        setIsDeleteDialogOpen(false)
        setSelectedAssignment(null)
        fetchInitialData()
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    } finally {
      setIsSubmitLoading(false)
    }
  }

  if (loading || isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 min-h-screen bg-[#000] -m-6 p-8 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E599]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1C1C1C] pb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Assignments</h1>
          <p className="text-[13px] text-[#B5B5B5] mt-2">
            Manage all coursework and submission sessions
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)} 
          className="h-9 px-4 bg-white hover:bg-white/90 text-black font-semibold rounded-xl shadow-lg transition-all active:scale-95 border-none text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-[#161616] border border-[#1C1C1C] border-dashed rounded-[2rem]">
          <div className="w-20 h-20 rounded-[2.5rem] bg-[#00E599]/5 border border-[#1C1C1C] flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-[#444]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No assignments found</h3>
          <p className="text-[13px] text-[#B5B5B5] max-w-xs mb-8">
            You haven't created any assignments yet. Start by creating your first one.
          </p>
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="h-9 px-6 bg-white hover:bg-white/90 text-black font-semibold rounded-xl shadow-lg transition-all active:scale-95 border-none text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create first assignment
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const dueDate = new Date(assignment.dueDate)
            const isOverdue = dueDate < new Date() && assignment.isActive
            const submissionPercentage = assignment.totalStudents > 0
              ? Math.round((assignment.submissionsCount / assignment.totalStudents) * 100)
              : 0

            return (
              <Card key={assignment.id} className={cn(
                "group relative flex flex-col bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#00E599]/30",
                isOverdue ? 'border-l-4 border-l-[#EF4444]' : 'border-l-4 border-l-[#00E599]'
              )}>
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00E599]/0 to-[#00E599]/0 group-hover:from-[#00E599]/5 group-hover:to-transparent transition-all duration-500" />

                <CardHeader className="relative z-10 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-3">
                      <CardTitle className="text-lg font-bold text-white group-hover:text-[#00E599] transition-colors line-clamp-1">{assignment.title}</CardTitle>
                       <div className="flex items-center gap-2">
                          <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-[#1C1C1C] flex items-center gap-2">
                              <GraduationCap className="w-3 h-3 text-[#B5B5B5]" />
                              <span className="text-[11px] text-[#B5B5B5]">{assignment.className}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono border-[#1C1C1C] text-[#B5B5B5]">{assignment.classCode}</Badge>
                       </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 flex-1 pb-6">
                  <p className="text-[13px] text-[#B5B5B5] leading-relaxed line-clamp-2 mb-6">
                    {assignment.description}
                  </p>
  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-black/40 border border-[#1C1C1C] rounded-xl group/item">
                        <div className="flex items-center gap-3">
                           <Calendar className={cn("w-4 h-4", isOverdue ? 'text-[#EF4444]' : 'text-[#B5B5B5]')} />
                           <span className={cn("text-[11px] font-medium", isOverdue ? 'text-[#EF4444]' : 'text-[#B5B5B5]')}>
                             Due: {dueDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                           </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                         <div className="flex items-center justify-between text-[11px] px-1">
                             <span className="text-[#B5B5B5]">Submissions</span>
                             <span className="text-[#00E599]">{assignment.submissionsCount} / {assignment.totalStudents} Students</span>
                         </div>
                        <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-[#1C1C1C]">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${submissionPercentage}%` }}
                                className="h-full bg-gradient-to-r from-[#00E599]/40 to-[#00E599]"
                            />
                        </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="relative z-10 pt-4 pb-6 px-6 border-t border-[#1C1C1C] gap-3">
                   <Button
                    className="flex-1 h-9 bg-white hover:bg-white/90 text-black font-semibold rounded-xl text-sm transition-all active:scale-95 border-none"
                    onClick={() => router.push(`/dashboard/teacher/assignments/${assignment.id}`)}
                  >
                    Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-[#B5B5B5] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition-all"
                    onClick={() => {
                      setSelectedAssignment(assignment)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
      </div>

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#161616] border border-[#1C1C1C] rounded-3xl p-8 overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E599]/5 blur-[60px] rounded-full pointer-events-none" />
           <DialogHeader className="relative z-10">
            <DialogTitle className="text-xl font-bold text-white tracking-tight">Create Assignment</DialogTitle>
            <DialogDescription className="text-sm text-[#B5B5B5]">
              Add a new assignment for your students
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="relative z-10 space-y-6 mt-8">
            <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="class" className="text-[11px] font-medium text-[#B5B5B5]">Select Class *</Label>
                <Select value={formData.classId} onValueChange={(val) => setFormData({ ...formData, classId: val })}>
                    <SelectTrigger id="class" className="h-10 bg-[#1F1F1F] border-[#1C1C1C] text-white rounded-xl focus:border-[#00E599]/50 transition-all font-medium text-sm">
                    <SelectValue placeholder="Select class..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                    {classes.map(c => (
                        <SelectItem key={c.id} value={c.id} className="focus:bg-[#00E599]/10 focus:text-white cursor-pointer">{c.name} ({c.code})</SelectItem>
                    ))}
                    {classes.length === 0 && <SelectItem value="none" disabled>No classes found.</SelectItem>}
                    </SelectContent>
                </Select>
                </div>

                <div className="space-y-2">
                <Label htmlFor="title" className="text-[11px] font-medium text-[#B5B5B5]">Assignment Title *</Label>
                <Input
                    id="title"
                    placeholder="Enter title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-10 bg-[#1F1F1F] border-[#1C1C1C] text-white rounded-xl focus:border-[#00E599]/50 transition-all font-medium text-sm"
                    required
                />
                </div>

                <div className="space-y-2">
                <Label htmlFor="description" className="text-[11px] font-medium text-[#B5B5B5]">Description *</Label>
                <Input
                    id="description"
                    placeholder="Enter description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-10 bg-[#1F1F1F] border-[#1C1C1C] text-white rounded-xl focus:border-[#00E599]/50 transition-all font-medium text-sm"
                    required
                />
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-[11px] font-medium text-[#B5B5B5]">Due Date *</Label>
                    <DateTimePicker
                    date={formData.dueDate ? new Date(formData.dueDate) : undefined}
                    setDate={(date) => {
                        if (date) {
                        setFormData({ ...formData, dueDate: date.toISOString() })
                        }
                    }}
                    className="w-full h-10 bg-[#1F1F1F] border-[#1C1C1C] text-white rounded-xl focus:border-[#00E599]/50 transition-all font-medium text-sm"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="totalMarks" className="text-[11px] font-medium text-[#B5B5B5]">Max Score *</Label>
                    <Input
                    id="totalMarks"
                    type="number"
                    min="1"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    className="h-10 bg-[#1F1F1F] border-[#1C1C1C] text-white rounded-xl focus:border-[#00E599]/50 transition-all font-medium text-sm"
                    required
                    />
                </div>
                </div>
            </div>

            <DialogFooter className="pt-8 border-t border-[#1C1C1C] gap-4">
               <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateOpen(false)} 
                disabled={isSubmitLoading}
                className="h-9 px-6 border-[#1C1C1C] text-[#B5B5B5] hover:text-white hover:bg-[#1C1C1C] rounded-xl font-semibold text-sm"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="h-9 px-6 bg-white hover:bg-white/90 text-black font-semibold rounded-xl shadow-lg transition-all active:scale-95 border-none text-sm"
                disabled={isSubmitLoading}
              >
                {isSubmitLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-black" /> : <Plus className="w-4 h-4 mr-2" />}
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#161616] border border-[#EF4444]/20 rounded-3xl p-8 overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#EF4444]/5 blur-[60px] rounded-full pointer-events-none" />
          <DialogHeader className="relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-8 h-8 text-[#EF4444]" />
            </div>
            <DialogTitle className="text-xl font-bold text-white text-center">Delete Assignment?</DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#555] text-center leading-relaxed">
              Are you sure you want to delete <span className="text-[#EF4444] font-bold">"{selectedAssignment?.title}"</span>? 
              This action cannot be undone and all student submissions will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="relative z-10 gap-4 mt-8 flex-row items-center">
            <Button 
                variant="outline" 
                disabled={isSubmitLoading}
                className="flex-1 h-9 bg-transparent border-[#1C1C1C] text-[#B5B5B5] hover:bg-[#1C1C1C] hover:text-white rounded-xl font-semibold text-sm"
                onClick={() => setIsDeleteDialogOpen(false)}
            >
                Cancel
            </Button>
            <Button 
                onClick={handleDelete} 
                disabled={isSubmitLoading}
                className="flex-1 h-9 bg-white hover:bg-white/90 text-black font-semibold rounded-xl transition-all active:scale-95 border-none text-sm"
            >
              {isSubmitLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-black" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
