"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    Settings,
    Save,
    Trash2,
    ChevronLeft,
    AlertTriangle,
    RefreshCw,
    Users,
    Eye,
    MessageSquare,
    Search
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { getInitials } from "@/lib/utils"
import { StudentDetailsModal } from "@/components/dashboard/teacher/student-details-modal"

interface Student {
    id: string
    name: string
    email: string
    image: string | null
    department: string | null
    semester: number | null
    batch: string | null
    lastSeen: string | null
    performance: {
        overallScore: number | null
        attendanceRate: number | null
    } | null
    joinedAt: string
}

export default function ClassSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [students, setStudents] = useState<Student[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // Modal state for student details
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        department: "",
        semester: "1",
        subject: "",
        maxStudents: "50",
        isActive: true,
    })

    const classId = params.id as string

    useEffect(() => {
        fetchClassDetails()
        fetchStudents()
    }, [classId])

    const fetchClassDetails = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/classes/${classId}`)
            const result = await res.json()

            if (res.ok) {
                setFormData({
                    name: result.name,
                    description: result.description || "",
                    department: result.department,
                    semester: result.semester.toString(),
                    subject: result.subject,
                    maxStudents: result.maxStudents?.toString() || "50",
                    isActive: result.isActive,
                })
            } else {
                toast({ title: "Error", description: result.error || "Failed to load class details", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async () => {
        setLoadingStudents(true)
        try {
            const res = await fetch(`/api/teacher/classes/${classId}/students`)
            const result = await res.json()
            if (result.success) {
                setStudents(result.data)
            }
        } catch (error) {
            console.error("Error fetching students:", error)
        } finally {
            setLoadingStudents(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/classes/${classId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    semester: parseInt(formData.semester),
                }),
            })
            const result = await res.json()

            if (res.ok) {
                toast({ title: "Saved", description: "Class settings updated successfully" })
            } else {
                toast({ title: "Error", description: result.error || "Failed to update class", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/classes/${classId}`, {
                method: "DELETE",
            })

            if (res.ok) {
                toast({ title: "Deleted", description: "Class deleted successfully" })
                router.push("/dashboard/teacher/classes")
            } else {
                const result = await res.json()
                toast({ title: "Error", description: result.error || "Failed to delete class", variant: "destructive" })
                setShowDeleteDialog(false)
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
            setShowDeleteDialog(false)
        } finally {
            setDeleting(false)
        }
    }

    const handleRemoveStudent = async (studentId: string) => {
        try {
            const res = await fetch(`/api/teacher/classes/${classId}/students/${studentId}`, {
                method: "DELETE"
            })
            const result = await res.json()
            if (result.success) {
                toast({ title: "Success", description: "Student removed from class" })
                setStudents(prev => prev.filter(s => s.id !== studentId))
            } else {
                toast({ title: "Error", description: result.error || "Failed to remove student", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Connection failed", variant: "destructive" })
        }
    }

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-[#000] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-[#00E599] animate-spin" />
                    <p className="text-[11px] font-medium text-[#B5B5B5]">Loading data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 min-h-screen bg-[#000] p-6 relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E599]/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1C1C1C] pb-8">
                <div className="space-y-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.back()}
                        className="h-8 px-3 text-[#B5B5B5] hover:text-white hover:bg-white/5 rounded-lg group transition-all"
                    >
                        <ChevronLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[11px] font-medium">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Class Settings</h1>
                        <p className="text-[13px] text-[#B5B5B5] mt-1">
                            Session configuration and controls
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="bg-white hover:bg-white/90 text-black h-9 px-8 rounded-xl transition-all font-semibold text-sm active:scale-95 border-none shadow-xl"
                    >
                        {saving ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            "Confirm"
                        )}
                    </Button>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Forms */}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="bg-[#161616] border-[#1C1C1C] rounded-3xl overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-[#1C1C1C] bg-[#1C1C1C]/10 px-6 py-4">
                            <CardTitle className="text-sm font-bold text-white">Class Information</CardTitle>
                            <CardDescription className="text-[11px] text-[#B5B5B5] mt-1">Core details of your class</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label className="text-[11px] font-medium text-[#B5B5B5] ml-1">Class Name</Label>
                                    <Input
                                        className="h-10 bg-black/50 border-[#1C1C1C] focus:border-[#00E599]/50 text-white rounded-xl transition-all font-medium text-xs"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-[11px] font-medium text-[#B5B5B5] ml-1">Subject</Label>
                                    <Input
                                        className="h-10 bg-black/50 border-[#1C1C1C] focus:border-[#00E599]/50 text-white rounded-xl transition-all font-medium text-xs"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-[11px] font-medium text-[#B5B5B5] ml-1">Department</Label>
                                    <Input
                                        className="h-10 bg-black/50 border-[#1C1C1C] focus:border-[#00E599]/50 text-white rounded-xl transition-all font-medium text-xs"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-[11px] font-medium text-[#B5B5B5] ml-1">Semester</Label>
                                    <Select
                                        value={formData.semester}
                                        onValueChange={(v) => setFormData({ ...formData, semester: v })}
                                    >
                                        <SelectTrigger className="h-10 bg-black/50 border-[#1C1C1C] focus:ring-0 focus:border-[#00E599]/50 text-white rounded-xl transition-all font-medium text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white rounded-xl">
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                                <SelectItem key={s} value={s.toString()} className="focus:bg-white/5 focus:text-white rounded-lg text-xs">
                                                    Semester {s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                             <div className="space-y-2.5">
                                <Label className="text-[11px] font-medium text-[#B5B5B5] ml-1">Class Description</Label>
                                <Textarea
                                    className="bg-black/50 border-[#1C1C1C] focus:border-[#00E599]/50 text-white rounded-2xl transition-all font-medium min-h-[100px] resize-none p-4 text-xs"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#161616] border-[#1C1C1C] rounded-3xl overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-[#1C1C1C] bg-[#1C1C1C]/10 px-8 py-6">
                             <CardTitle className="text-sm font-bold text-white">Students</CardTitle>
                            <CardDescription className="text-[11px] text-[#B5B5B5] mt-1">Manage enrollments and capacity</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="relative flex-1 min-w-[240px]">
                                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B5B5B5]" />
                                    <Input 
                                        className="h-12 bg-black border-[#1C1C1C] pl-11 rounded-xl text-xs font-medium focus:border-white/20"
                                        placeholder="Filter by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-4 px-6 h-12 bg-black border border-[#1C1C1C] rounded-xl">
                                    <Label className="text-[11px] font-medium text-[#B5B5B5] leading-none">Limit</Label>
                                    <Input 
                                        type="number"
                                        className="w-16 bg-transparent border-none text-white font-black text-sm text-center p-0 h-auto focus:ring-0"
                                        value={formData.maxStudents}
                                        onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {loadingStudents ? (
                                     <div className="py-20 flex flex-col items-center gap-4">
                                        <RefreshCw className="w-6 h-6 text-[#00E599] animate-spin" />
                                        <p className="text-[11px] font-medium text-[#B5B5B5]">Loading students...</p>
                                    </div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="py-20 text-center bg-black/20 rounded-2xl border border-dashed border-[#1C1C1C]">
                                        <Users className="w-10 h-10 text-[#1C1C1C] mx-auto mb-4" />
                                        <p className="text-sm font-medium text-[#B5B5B5]">No students enrolled</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredStudents.map((student) => (
                                            <div key={student.id} className="group p-4 bg-black/40 border border-[#1C1C1C] rounded-2xl flex items-center justify-between hover:border-[#00E599]/20 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border border-[#1C1C1C]">
                                                        <AvatarImage src={student.image || undefined} />
                                                        <AvatarFallback className="bg-black text-[#00E599] font-bold">{getInitials(student.name)}</AvatarFallback>
                                                    </Avatar>
                                                     <div className="max-w-[120px]">
                                                        <p className="text-xs font-bold text-white truncate">{student.name}</p>
                                                        <p className="text-[11px] text-[#B5B5B5] font-medium truncate">{student.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 p-0 text-[#444] hover:text-[#00E599] rounded-lg"
                                                        onClick={() => {
                                                            setSelectedStudent(student)
                                                            setIsStudentModalOpen(true)
                                                        }}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#444] hover:text-[#00E599] rounded-lg">
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 p-0 text-[#444] hover:text-red-500 rounded-lg"
                                                        onClick={() => handleRemoveStudent(student.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Options */}
                <div className="lg:col-span-4 space-y-8">
                     <Card className="bg-[#161616] border-[#1C1C1C] rounded-3xl overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-[#1C1C1C] bg-[#1C1C1C]/10 px-8 py-6">
                             <CardTitle className="text-sm font-bold text-white">Visibility</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                             <div className="p-4 bg-black/40 border border-[#1C1C1C] rounded-2xl flex items-center justify-between">
                                  <div>
                                     <p className="text-[11px] font-bold text-white">Availability</p>
                                     <p className="text-[11px] text-[#B5B5B5] mt-0.5">Visible to students</p>
                                 </div>
                                 <Switch
                                    className="data-[state=checked]:bg-[#00E599] data-[state=unchecked]:bg-[#222]"
                                    checked={formData.isActive}
                                    onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
                                />
                            </div>

                            <Card className="bg-red-500/5 border-red-500/10 rounded-2xl overflow-hidden mt-8">
                                <CardHeader className="p-6 pb-2">
                                     <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        <span className="text-xs font-bold text-red-500">Delete Class</span>
                                    </div>
                                    <p className="text-[11px] font-medium text-[#744] leading-relaxed">
                                        This will permanently delete the class and all its data.
                                    </p>
                                </CardHeader>
                                <CardContent className="p-6 pt-2">
                                     <Button
                                        variant="destructive"
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="w-full h-9 bg-transparent border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all font-semibold text-xs"
                                    >
                                        Delete Class
                                    </Button>
                                </CardContent>
                            </Card>
                        </CardContent>
                     </Card>

                     <div className="p-8 rounded-3xl border border-[#1C1C1C] bg-[#161616]/30 space-y-6">
                          <div className="flex items-center gap-2">
                              <Badge className="bg-[#00E599]/10 text-[#00E599] border-none text-[8px] font-black px-2 py-0.5 rounded uppercase">Teacher Portal</Badge>
                          </div>
                           <div className="space-y-6">
                             <div className="space-y-1">
                                  <h4 className="text-[11px] font-bold text-white uppercase tracking-tight">Active Enrollment</h4>
                                  <p className="text-[10px] font-medium text-[#555] leading-relaxed">Students cannot join if status is set to inactive or capacity is reached.</p>
                             </div>
                             <div className="space-y-1">
                                  <h4 className="text-[11px] font-bold text-white uppercase tracking-tight">Data Integrity</h4>
                                  <p className="text-[10px] font-medium text-[#555] leading-relaxed">Deleting a class removes all grading history and submissions permanently.</p>
                             </div>
                          </div>
                     </div>
                </div>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-[#161616] border border-red-500/20 rounded-[2rem] p-8 max-w-md">
                    <AlertDialogHeader className="space-y-4">
                         <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2 text-red-500">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-bold text-white text-center tracking-tight">Confirm Delete</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-[#555] text-center leading-relaxed">
                            Permanently delete <span className="text-white font-bold">"{formData.name}"</span>? 
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                     <AlertDialogFooter className="flex-row gap-4 mt-8">
                        <AlertDialogCancel className="flex-1 h-10 bg-[#1C1C1C] border-none text-[#B5B5B5] hover:text-white rounded-xl font-semibold text-xs">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-xs transition-all"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Confirm Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <StudentDetailsModal 
                student={selectedStudent as any}
                isOpen={isStudentModalOpen}
                onClose={() => setIsStudentModalOpen(false)}
                onRemove={handleRemoveStudent}
            />
        </div>
    )
}
