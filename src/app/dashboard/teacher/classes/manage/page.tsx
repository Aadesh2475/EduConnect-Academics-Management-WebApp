"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  GraduationCap,
  Plus,
  Settings,
  Users,
  FileText,
  BookOpen,
  Calendar,
  Edit2,
  Trash2,
  Copy,
  Archive,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ClassData {
  id: string
  name: string
  code: string
  description?: string
  department: string
  semester: number
  subject: string
  isActive: boolean
  createdAt: string
  students: number
  assignments: number
  materials: number
  _count: {
    enrollments: number
    assignments: number
    exams: number
    materials: number
  }
}

export default function TeacherClassesManagePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<ClassData[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<ClassData | null>(null)
  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    department: "",
    semester: "1",
    subject: "",
  })

  // Fetch Classes (Real Data)
  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/classes?role=TEACHER")
      const result = await res.json()

      if (res.ok) {
        const adaptedClasses = (result.classes || []).map((c: any) => ({
          ...c,
          students: c._count?.enrollments || 0,
          assignments: c._count?.assignments || 0,
          materials: c._count?.materials || 0
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

  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.department || !newClass.subject) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
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
          description: `Class created with code: ${result.code}`,
          variant: "success"
        })
        setIsCreateOpen(false)
        setNewClass({ name: "", description: "", department: "", semester: "1", subject: "" })
        fetchClasses()
      } else {
        toast({ title: "Error", description: result.error || "Failed to create class", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create class", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/teacher/classes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (res.ok) {
        setClasses(classes.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c))
        toast({
          title: !currentStatus ? "Class activated" : "Class archived",
          description: `Class has been ${!currentStatus ? "activated" : "archived"}.`,
          variant: "success"
        })
      } else {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: "Copied!", description: "Class code copied to clipboard.", variant: "success" })
  }

  const confirmDelete = async () => {
    if (!classToDelete) return
    
    try {
      const res = await fetch(`/api/teacher/classes/${classToDelete.id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        setClasses(classes.filter(c => c.id !== classToDelete.id))
        toast({ title: "Deleted", description: "Class has been deleted successfully", variant: "success" })
        setIsDeleteDialogOpen(false)
        setClassToDelete(null)
      } else {
        toast({ title: "Error", description: "Failed to delete class", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
           <div className="h-10 w-48 bg-[#1F1F1F] rounded animate-pulse" />
           <div className="h-10 w-32 bg-[#1F1F1F] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#1F1F1F] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-[#161616] rounded-[2rem] border border-[#1C1C1C] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const stats = {
    total: classes.length,
    active: classes.filter(c => c.isActive).length,
    students: classes.reduce((acc, c) => acc + (c.students || 0), 0),
    assignments: classes.reduce((acc, c) => acc + (c.assignments || 0), 0)
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manage Classes</h1>
          <p className="text-[13px] text-[#B5B5B5] mt-2">Maintain your academic sessions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white hover:bg-white/90 text-black font-semibold h-9 px-4 rounded-xl transition-all active:scale-95 border-none shadow-lg text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] text-white max-w-lg rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Create Class</DialogTitle>
              <DialogDescription className="text-sm font-medium text-[#555]">
                Define the parameters for your new teaching session
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label htmlFor="create-name" className="text-[11px] font-bold text-[#888] uppercase tracking-widest">Class Name *</Label>
                <Input
                  id="create-name"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="e.g., Advanced Data Structures"
                  className="bg-[#161616] border-[#1C1C1C] h-12 rounded-xl focus:ring-white/20 text-sm font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-[#666]">Department *</Label>
                  <Input
                    placeholder="e.g., Computer Science"
                    value={newClass.department}
                    onChange={(e) => setNewClass({ ...newClass, department: e.target.value })}
                    className="bg-[#161616] border-[#1C1C1C] h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-semester" className="text-xs font-bold uppercase tracking-widest text-[#666]">Semester *</Label>
                  <Select
                    value={newClass.semester}
                    onValueChange={(value) => setNewClass({ ...newClass, semester: value })}
                  >
                    <SelectTrigger id="create-semester" className="bg-[#161616] border-[#1C1C1C] h-12 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={s.toString()} className="focus:bg-[#1F1F1F] focus:text-white">Semester {s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-subject" className="text-xs font-bold uppercase tracking-widest text-[#666]">Subject *</Label>
                <Input
                  id="create-subject"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  placeholder="e.g., DS-101"
                  className="bg-[#161616] border-[#1C1C1C] h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description" className="text-xs font-bold uppercase tracking-widest text-[#666]">Description</Label>
                <Textarea
                  id="create-description"
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder="Briefly describe the course objectives..."
                  className="bg-[#161616] border-[#1C1C1C] rounded-xl min-h-[100px] py-3"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-[#1C1C1C] text-[#555] hover:bg-white/5 h-11 px-6 rounded-xl text-sm font-semibold">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateClass} 
                disabled={creating}
                className="bg-white hover:bg-white/90 text-black font-semibold h-11 px-8 rounded-xl transition-all active:scale-95 text-sm"
              >
                {creating ? "Creating..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Capacity", value: stats.total, icon: BookOpen, color: "text-white", bg: "bg-white/5", border: "border-white/10" },
          { label: "Active Classes", value: stats.active, icon: CheckCircle, color: "text-white", bg: "bg-white/5", border: "border-white/10" },
          { label: "Member Base", value: stats.students, icon: Users, color: "text-white", bg: "bg-white/5", border: "border-white/10" },
          { label: "Task Records", value: stats.assignments, icon: FileText, color: "text-white", bg: "bg-white/5", border: "border-white/10" },
        ].map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
             <Card className={cn("bg-[#161616] border-[#1C1C1C] relative overflow-hidden group hover:border-[#2C2C2C] transition-all", stat.border)}>
               <CardContent className="p-3">
                 <div className="flex items-center justify-between relative z-10">
                   <div>
                     <p className="text-[11px] font-bold text-[#555] uppercase tracking-widest">{stat.label}</p>
                     <p className={cn("text-lg font-bold mt-1", stat.color)}>{stat.value}</p>
                   </div>
                   <div className={cn("h-8 w-8 flex items-center justify-center rounded-lg", stat.bg)}>
                     <stat.icon className={cn("w-4 h-4", stat.color)} />
                   </div>
                 </div>
               </CardContent>
             </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="mt-3">
        <Tabs defaultValue="active" className="space-y-8">
          <div className="flex items-center justify-between">
            <TabsList className="bg-[#161616] border border-[#1C1C1C] p-1 rounded-2xl h-11">
              <TabsTrigger value="active" className="rounded-xl px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-[#9A9A9A] font-bold text-xs uppercase tracking-widest">
                Active ({classes.filter(c => c.isActive).length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="rounded-xl px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-[#9A9A9A] font-bold text-xs uppercase tracking-widest">
                Archived ({classes.filter(c => !c.isActive).length})
              </TabsTrigger>
            </TabsList>
            
            <Button variant="ghost" onClick={fetchClasses} className="text-[#9A9A9A] hover:text-white hover:bg-white/5 rounded-xl h-11 w-11 p-0">
               <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </Button>
          </div>

          <TabsContent value="active" className="mt-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {classes.filter(c => c.isActive).map((cls, idx) => (
                  <motion.div
                    key={cls.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="bg-[#161616] border border-[#1C1C1C] rounded-[2rem] overflow-hidden group hover:border-[#333] transition-all relative">
                      <div className="absolute top-0 right-0 p-6 z-20">
                         <Badge className="bg-white/5 text-white border border-white/10 font-bold text-[10px] px-3 py-1 rounded-full">
                            Active
                         </Badge>
                      </div>
                      <CardHeader className="pt-6 px-6 pb-3">
                          <div className="space-y-1">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-[#1F1F1F] flex items-center justify-center border border-[#2C2C2C]">
                                  <GraduationCap className="w-3.5 h-3.5 text-[#555]" />
                                </div>
                                <CardTitle className="text-sm font-bold text-white tracking-tight">{cls.name}</CardTitle>
                             </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="bg-black/40 border border-[#1C1C1C] text-[#555] text-[10px] font-bold font-mono tracking-widest px-3 py-1 rounded-lg">
                                   {cls.code}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-lg text-[#666] hover:text-white hover:bg-white/5" 
                                  onClick={() => handleCopyCode(cls.code)}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                             </div>
                          </div>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 space-y-5">
                        <p className="text-sm text-[#9A9A9A] line-clamp-2 min-h-[40px] leading-relaxed">
                          {cls.description || "Experimental teaching session focusing on core competencies and practical application."}
                        </p>

                        <div className="grid grid-cols-3 gap-3">
                           {[
                             { label: "Students", value: cls.students, icon: Users, color: "text-white" },
                             { label: "Tasks", value: cls.assignments, icon: FileText, color: "text-white" },
                             { label: "Library", value: cls.materials, icon: BookOpen, color: "text-white" }
                           ].map((m, i) => (
                             <div key={i} className="bg-[#1F1F1F] border border-[#2C2C2C] p-2.5 rounded-xl flex flex-col items-center justify-center">
                                <p className={cn("text-base font-bold tracking-tight", m.color)}>{m.value}</p>
                                <p className="text-[9px] font-bold text-[#555] uppercase tracking-widest mt-0.5">{m.label}</p>
                             </div>
                           ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[#1C1C1C]">
                           <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#555] uppercase tracking-widest">
                              <Calendar className="w-4 h-4" />
                              Semester {cls.semester}
                            </div>
                             <div className="h-1 w-1 rounded-full bg-[#333]" />
                            <div className="text-[10px] font-bold text-[#555] uppercase tracking-widest">
                               {cls.subject}
                            </div>
                          </div>
                           <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.location.href = `/dashboard/teacher/classes/${cls.id}/settings`}
                              className="bg-[#1F1F1F] border-[#2C2C2C] text-white hover:bg-[#2C2C2C] font-semibold rounded-xl h-9 transition-all text-sm"
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Settings
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(cls.id, cls.isActive)}
                              className="text-[#666] hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                              title="Archive Class"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {classes.filter(c => c.isActive).length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                   <div className="w-20 h-20 rounded-[2.5rem] bg-[#161616] border border-[#1C1C1C] flex items-center justify-center mb-6">
                      <Archive className="w-8 h-8 text-[#333]" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">No Active Classes</h3>
                   <p className="text-sm text-[#9A9A9A] max-w-xs">You don't have any active classes at the moment. Create one to get started.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archived" className="mt-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {classes.filter(c => !c.isActive).map((cls, idx) => (
                  <motion.div
                    key={cls.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="bg-[#161616] border border-[#1C1C1C] rounded-[2rem] overflow-hidden grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all">
                      <CardHeader className="pt-6 px-6 pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <CardTitle className="text-lg font-bold text-white tracking-tight">{cls.name}</CardTitle>
                            <span className="text-[10px] font-black font-mono tracking-widest text-[#666]">{cls.code}</span>
                          </div>
                          <Badge variant="secondary" className="bg-[#1F1F1F] text-[#444] border-none font-black text-[10px] uppercase tracking-widest">
                            Archived
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 space-y-5">
                        <div className="grid grid-cols-3 gap-3 opacity-50">
                          {[
                             { label: "Students", value: cls.students },
                             { label: "Tasks", value: cls.assignments },
                             { label: "Library", value: cls.materials }
                           ].map((m, i) => (
                             <div key={i} className="bg-[#1F1F1F] border border-[#2C2C2C] p-3 rounded-2xl flex flex-col items-center justify-center">
                                <p className="text-lg font-black tracking-tight text-white">{m.value}</p>
                                <p className="text-[9px] font-bold text-[#666] uppercase tracking-widest mt-0.5">{m.label}</p>
                             </div>
                           ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[#1C1C1C]">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#444]">Semester {cls.semester}</span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(cls.id, cls.isActive)}
                              className="bg-[#1F1F1F] border-[#2C2C2C] text-[#9A9A9A] hover:bg-white/5 hover:text-white font-bold rounded-xl h-9"
                            >
                              Restore
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-[#444] hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                              onClick={() => {
                                setClassToDelete(cls)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {classes.filter(c => !c.isActive).length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-[#161616] border border-[#1C1C1C] flex items-center justify-center mb-6">
                    <Archive className="w-8 h-8 text-[#1C1C1C]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Vault Empty</h3>
                  <p className="text-sm text-[#9A9A9A] max-w-xs">Classes you archive for future reference or data logging will appear here.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Deletion Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] text-white max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-3">
               <div className="p-2 bg-red-500/10 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-500" />
               </div>
               Delete Class
            </DialogTitle>
            <DialogDescription className="text-[#9A9A9A] pt-2">
              Are you absoluteley sure you want to delete <strong>{classToDelete?.name}</strong>? This will permanently erase all associated assignments, grades, and materials.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl mt-4">
             <p className="text-xs text-red-400 font-medium">This operation cannot be undone. All student records within this class will be lost.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 h-11 px-6 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white font-bold h-11 px-8 rounded-xl transition-all active:scale-95 border-none"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
