"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  GraduationCap,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Copy,
  UserPlus,
  FileText,
  Settings
} from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SkeletonTable } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { getInitials, formatDate, cn } from "@/lib/utils"

interface Class {
  id: string
  name: string
  code: string
  description?: string
  department: string
  semester: number
  subject: string
  isActive: boolean
  createdAt: string
  teacher: {
    id: string
    user: {
      name: string
      email: string
      image?: string
    }
  }
  _count: {
    enrollments: number
    assignments: number
    exams: number
  }
}

export default function AdminClassesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<{ id: string, name: string, email: string }[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newClassData, setNewClassData] = useState({
    name: "",
    description: "",
    department: "",
    semester: "",
    subject: "",
    teacherId: ""
  })
  const itemsPerPage = 10

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/classes?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}&department=${departmentFilter}`)
      const data = await res.json()

      if (data.success) {
        setClasses(data.data)
        setTotalPages(data.totalPages)
      } else {
        toast({ title: "Error", description: data.error || "Failed to fetch classes", variant: "destructive" })
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error)
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, departmentFilter, toast])

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/admin/teachers")
      const data = await res.json()
      if (data.success) {
        setTeachers(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error)
    }
  }

  useEffect(() => {
    fetchClasses()
    fetchTeachers()
  }, [fetchClasses])

  const handleCreateClass = async () => {
    try {
      if (!newClassData.name || !newClassData.department || !newClassData.semester || !newClassData.subject || !newClassData.teacherId) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      setIsSubmitting(true)
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClassData),
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: "Success", description: "Class created successfully" })
        setShowCreateDialog(false)
        setNewClassData({ name: "", description: "", department: "", semester: "", subject: "", teacherId: "" })
        fetchClasses()
      } else {
        toast({ title: "Error", description: data.error || "Failed to create class", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create class", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClass = async () => {
    if (!selectedClass) return
    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/admin/classes/${selectedClass.id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: "Success", description: "Class deleted successfully" })
        setShowDeleteDialog(false)
        fetchClasses()
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete class", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete class", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: "Copied!", description: `Class code ${code} copied to clipboard` })
  }

  const filteredClasses = classes

  const departments = ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Business"]

  const stats = {
    total: classes.length,
    active: classes.filter(c => c.isActive).length,
    students: classes.reduce((acc, c) => acc + c._count.enrollments, 0),
    assignments: classes.reduce((acc, c) => acc + c._count.assignments, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600">Manage all classes on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchClasses}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Class
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Classes", value: stats.total, icon: BookOpen, color: "blue" },
          { label: "Active Classes", value: stats.active, icon: Calendar, color: "green" },
          { label: "Total Students", value: stats.students, icon: GraduationCap, color: "purple" },
          { label: "Assignments", value: stats.assignments, icon: FileText, color: "orange" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    stat.color === "blue" && "bg-blue-100 text-blue-600",
                    stat.color === "green" && "bg-green-100 text-green-600",
                    stat.color === "purple" && "bg-purple-100 text-purple-600",
                    stat.color === "orange" && "bg-orange-100 text-orange-600",
                  )}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by class name, code, or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <SkeletonTable />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredClasses.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{cls.name}</h3>
                          <Badge variant={cls.isActive ? "success" : "secondary"}>
                            {cls.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">{cls.code}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyCode(cls.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedClass(cls); setShowViewDialog(true) }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Class
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Manage Students
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => { setSelectedClass(cls); setShowDeleteDialog(true) }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Class
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {cls.description || "No description available"}
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={cls.teacher.user.image} />
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                          {getInitials(cls.teacher.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cls.teacher.user.name}</p>
                        <p className="text-xs text-gray-500">{cls.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{cls._count.enrollments} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{cls._count.assignments} tasks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Sem {cls.semester}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* View Class Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Class Details</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedClass.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono">{selectedClass.code}</Badge>
                    <Badge variant={selectedClass.isActive ? "success" : "secondary"}>
                      {selectedClass.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-gray-600">{selectedClass.description || "No description"}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">Department</Label>
                  <p className="font-medium">{selectedClass.department}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">Subject</Label>
                  <p className="font-medium">{selectedClass.subject}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">Semester</Label>
                  <p className="font-medium">{selectedClass.semester}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">Created</Label>
                  <p className="font-medium">{formatDate(new Date(selectedClass.createdAt))}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="text-gray-500 text-xs">Instructor</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedClass.teacher.user.image} />
                    <AvatarFallback>{getInitials(selectedClass.teacher.user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedClass.teacher.user.name}</p>
                    <p className="text-sm text-gray-500">{selectedClass.teacher.user.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{selectedClass._count.enrollments}</p>
                  <p className="text-sm text-gray-600">Students</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-purple-600">{selectedClass._count.assignments}</p>
                  <p className="text-sm text-gray-600">Assignments</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{selectedClass._count.exams}</p>
                  <p className="text-sm text-gray-600">Exams</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            <Button>Edit Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedClass?.name}"? This will remove all assignments, exams, and enrollments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteClass} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>Create a new class and assign a teacher</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input
                  placeholder="Advanced Mathematics"
                  value={newClassData.name}
                  onChange={(e) => setNewClassData({ ...newClassData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Calculus"
                  value={newClassData.subject}
                  onChange={(e) => setNewClassData({ ...newClassData, subject: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter class description..."
                value={newClassData.description}
                onChange={(e) => setNewClassData({ ...newClassData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={newClassData.department}
                  onValueChange={(val) => setNewClassData({ ...newClassData, department: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={newClassData.semester}
                  onValueChange={(val) => setNewClassData({ ...newClassData, semester: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign Teacher</Label>
              <Select
                value={newClassData.teacherId}
                onValueChange={(val) => setNewClassData({ ...newClassData, teacherId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleCreateClass} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
