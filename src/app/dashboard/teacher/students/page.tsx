"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
} from "@/components/ui/dialog"
import {
  Users,
  Search,
  Mail,
  BookOpen,
  BarChart3,
  Calendar,
  MessageSquare,
  Eye,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Star,
  Save,
  Loader2,
  Award,
  ShieldCheck,
  Medal,
  Trophy
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  userId: string
  name: string
  email: string
  image?: string
  enrollmentNo: string
  department: string
  semester: string
  classes: string[]
  attendanceRate: number
  performance: number
  progress: number
  lastActive: string
  rating?: number
  feedback?: string
}

export default function TeacherStudentsPage() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const { toast } = useToast()

  // Rating state
  const [ratingVal, setRatingVal] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState("")
  const [savingRating, setSavingRating] = useState(false)

  // Certificate state
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false)
  const [issuingCertificate, setIssuingCertificate] = useState(false)
  const [certClassId, setCertClassId] = useState("")
  const [certType, setCertType] = useState("COMPLETION")
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/teacher/students")
        const data = await res.json()
        if (data.success) {
          setStudents(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch students:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
    fetchStudents()

    const fetchTeacherClasses = async () => {
      try {
        const res = await fetch("/api/teacher/classes")
        const data = await res.json()
        if (data.success) {
          setTeacherClasses(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch teacher classes:", error)
      }
    }
    fetchTeacherClasses()
  }, [])

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const getRemark = (performance: number) => {
    if (performance >= 80) return { text: "Excellent", color: "text-[#D4D4D4] bg-white/5 border-white/10" };
    if (performance >= 50) return { text: "Average", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    return { text: "Attention", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.enrollmentNo?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = classFilter === "all" || student.classes.includes(classFilter)
    return matchesSearch && matchesClass
  })

  const classOptions = [...new Set(students.flatMap(s => s.classes))]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1C1C1C] pb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Students</h1>
          <p className="text-[13px] text-[#B5B5B5] mt-2">Manage student records and performance tracking</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{students.length}</p>
                <p className="text-[13px] text-[#B5B5B5] mt-1">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{students.filter(s => s.performance >= 80).length}</p>
                <p className="text-[13px] text-[#B5B5B5] mt-1">Excellent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <CheckCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {students.length > 0
                    ? Math.round(students.reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / students.length)
                    : 0}%
                </p>
                <p className="text-[13px] text-[#B5B5B5] mt-1">Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <Calendar className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{students.filter(s => (s.attendanceRate || 0) < 75).length}</p>
                <p className="text-[13px] text-[#B5B5B5] mt-1">Low Track</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9A9A9A] w-4 h-4" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1F1F1F] border-[#1C1C1C] text-white focus:border-white/30 transition-colors"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-[#1F1F1F] border-[#1C1C1C] text-white">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                <SelectItem value="all">All Classes</SelectItem>
                {classOptions.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-purple-400" />
            Student Directory
          </CardTitle>
          <CardDescription className="text-[#9A9A9A] font-medium">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1C1C1C]">
                  <th className="text-left py-4 px-4 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Student</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Classes</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Perf.</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Attendance</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Progress</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Remark</th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  return (
                    <tr key={student.id} className="border-b border-[#1C1C1C] last:border-0 hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-[#1C1C1C] rounded-full">
                            <AvatarImage src={student.image} />
                            <AvatarFallback className="bg-[#1F1F1F] text-white font-bold">{getInitials(student.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-white group-hover:text-white transition-colors">{student.name}</p>
                            <p className="text-xs text-[#9A9A9A] font-medium tracking-tight whitespace-nowrap">{student.enrollmentNo || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {student.classes.map(cls => (
                            <Badge key={cls} variant="outline" className="text-[10px] bg-[#1F1F1F] border-[#1C1C1C] text-[#D4D4D4] px-2 py-0">{cls}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-white">
                          {student.performance}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-2 py-0 border-transparent font-bold",
                            (student.attendanceRate || 0) >= 85
                              ? "bg-[#FFFFFF]/10 text-[#FFFFFF]"
                              : "bg-rose-500/10 text-rose-400"
                          )}
                        >
                          {student.attendanceRate}%
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="w-full max-w-[80px] mx-auto space-y-1">
                          <Progress value={student.progress} className="h-1.5 bg-[#1F1F1F]" />
                          <span className="text-[10px] text-[#9A9A9A] font-bold">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border", getRemark(student.performance).color)}>
                          {getRemark(student.performance).text}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedStudent(student)}
                                className="h-8 w-8 p-0 text-[#9A9A9A] hover:text-white hover:bg-white/5 rounded-lg transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent
                              onOpenAutoFocus={(e) => {
                                if (student) {
                                  setRatingVal(student.rating || 0);
                                  setFeedbackText(student.feedback || "");
                                }
                              }}
                              className="max-w-2xl bg-[#161616] border border-[#1C1C1C] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-xl"
                            >
                              <DialogHeader>
                                <DialogTitle className="text-white text-xl font-bold">Student Details</DialogTitle>
                                <DialogDescription className="text-[#9A9A9A] font-medium">
                                  Detailed information about {selectedStudent?.name || student.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 py-4">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-24 w-24 border-2 border-[#1C1C1C] rounded-full shadow-lg">
                                    <AvatarImage src={student.image} />
                                    <AvatarFallback className="text-3xl font-bold bg-[#1F1F1F] text-white">{getInitials(student.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-1.5">
                                    <h3 className="text-2xl font-bold text-white">{student.name}</h3>
                                    <div className="flex items-center gap-2 text-[#9A9A9A] font-medium italic">
                                      <Mail className="w-4 h-4" />
                                      {student.email}
                                    </div>
                                    <Badge variant="outline" className="bg-[#1F1F1F] border-[#1C1C1C] text-white font-bold text-[10px] tracking-widest uppercase px-2 py-0.5">{student.enrollmentNo}</Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="p-4 rounded-xl bg-[#1F1F1F] border border-[#1C1C1C] shadow-sm">
                                    <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Performance</p>
                                    <p className="text-2xl font-bold text-white uppercase tracking-tight transition-opacity duration-300">{student.performance}%</p>
                                  </div>
                                  <div className="p-4 rounded-xl bg-[#1F1F1F] border border-[#1C1C1C] shadow-sm">
                                    <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Attendance</p>
                                    <p className="text-2xl font-bold text-white uppercase tracking-tight">{student.attendanceRate}%</p>
                                  </div>
                                  <div className="p-4 rounded-xl bg-[#1F1F1F] border border-[#1C1C1C] shadow-sm">
                                    <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Progress</p>
                                    <p className="text-2xl font-bold text-white uppercase tracking-tight">{student.progress}%</p>
                                  </div>
                                  <div className="p-4 rounded-xl bg-[#1F1F1F] border border-[#1C1C1C] shadow-sm">
                                    <p className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider mb-1">Remark</p>
                                    <p className={cn("text-lg font-bold tracking-tight uppercase", getRemark(student.performance).color.split(' ')[0])}>
                                      {getRemark(student.performance).text}
                                    </p>
                                  </div>
                                </div>

                                <div className="p-5 rounded-xl bg-[#1F1F1F] border border-[#1C1C1C] shadow-sm">
                                  <p className="text-xs font-bold text-[#9A9A9A] uppercase tracking-wider mb-3">Enrolled Classes</p>
                                  <div className="flex gap-2.5 flex-wrap">
                                    {student.classes.map(cls => (
                                      <Badge key={cls} variant="secondary" className="bg-[#1F1F1F] text-white border-transparent hover:bg-white/10 transition-colors font-semibold px-2.5 py-0.5">{cls}</Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Rating & Feedback Section */}
                                <div className="space-y-4 pt-6 border-t border-[#1C1C1C]">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-white flex items-center gap-2">
                                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                      Assessment & Feedback
                                    </h4>
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={cn(
                                            "w-7 h-7 cursor-pointer transition-all duration-200 transform hover:scale-125",
                                            star <= (hoverRating || ratingVal) ? "text-yellow-500 fill-yellow-500" : "text-[#1C1C1C]"
                                          )}
                                          onMouseEnter={() => setHoverRating(star)}
                                          onMouseLeave={() => setHoverRating(0)}
                                          onClick={() => setRatingVal(star)}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-2.5">
                                    <Label className="text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Teacher's Private Feedback/Comments</Label>
                                    <Textarea
                                      placeholder="Provide context for this rating. This will be visible to the student."
                                      value={feedbackText}
                                      onChange={(e) => setFeedbackText(e.target.value)}
                                      className="min-h-[120px] bg-[#1F1F1F] border-[#1C1C1C] text-[#D4D4D4] focus:border-white/30 transition-colors rounded-xl"
                                    />
                                  </div>

                                  <Button 
                                    onClick={async () => {
                                      if (!student || ratingVal === 0) return;
                                      setSavingRating(true);
                                      try {
                                        const res = await fetch("/api/teacher/analytics/student-rating", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ 
                                            studentId: student.id, 
                                            rating: ratingVal, 
                                            feedback: feedbackText 
                                          }),
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                          toast({ title: "Success", description: "Rating saved successfully" });
                                          setStudents(prev => prev.map(s => s.id === student.id ? { ...s, rating: ratingVal, feedback: feedbackText } : s));
                                        } else {
                                          toast({ title: "Error", description: data.error, variant: "destructive" });
                                        }
                                      } catch (error) {
                                        toast({ title: "Error", description: "Failed to save rating", variant: "destructive" });
                                      } finally {
                                        setSavingRating(false);
                                      }
                                    }}
                                    disabled={savingRating || ratingVal === 0}
                                    className="w-full h-9 bg-white hover:bg-white/90 text-black font-semibold rounded-xl transition-all shadow-lg border-none text-sm"
                                  >
                                    {savingRating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                    {student?.rating ? "Update Rating & Feedback" : "Save Rating & Feedback"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                            </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#9A9A9A] hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsCertificateDialogOpen(true);
                            }}
                          >
                            <Award className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#9A9A9A] hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            onClick={() => window.location.href = `/dashboard/teacher/messages?userId=${student.userId}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Issuance Dialog */}
      <Dialog open={isCertificateDialogOpen} onOpenChange={setIsCertificateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#161616] border border-[#1C1C1C] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-xl">
              <Award className="w-5 h-5 text-white" />
              Issue Academic Certificate
            </DialogTitle>
            <DialogDescription className="text-[#9A9A9A] font-medium">
              Award {selectedStudent?.name} for their outstanding accomplishments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Select Class</Label>
              <Select value={certClassId} onValueChange={setCertClassId}>
                <SelectTrigger className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:border-white/30 transition-colors rounded-xl">
                  <SelectValue placeholder="Choose class..." />
                </SelectTrigger>
                <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                  {teacherClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id} className="focus:bg-white/5">{cls.name} ({cls.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Certificate Category</Label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "COMPLETION", label: "Completion", icon: CheckCircle, color: "text-[#FFFFFF]" },
                  { id: "HONOR", label: "Honor Roll", icon: Medal, color: "text-blue-400" },
                  { id: "EXCELLENCE", label: "Excellence", icon: Trophy, color: "text-yellow-500" },
                ].map((type) => (
                  <Button
                    key={type.id}
                    variant={certType === type.id ? "default" : "outline"}
                    className={cn(
                      "flex flex-col gap-1.5 h-auto py-3 px-1 text-[10px] font-bold rounded-xl transition-all",
                      certType === type.id 
                        ? "bg-white text-black border-transparent shadow-lg transform scale-105" 
                        : "bg-[#1F1F1F] border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5"
                    )}
                    onClick={() => setCertType(type.id)}
                  >
                    <type.icon className={cn("w-5 h-5", certType === type.id ? "text-indigo-600" : type.color)} />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Grade/Distinction (Optional)</Label>
              <Input 
                placeholder="e.g. A+, High Distinction" 
                className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:border-white/30 transition-colors rounded-xl"
                onChange={(e) => setFeedbackText(e.target.value)} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#1C1C1C]">
            <Button variant="ghost" onClick={() => setIsCertificateDialogOpen(false)} className="text-[#9A9A9A] hover:text-white hover:bg-white/5 font-bold rounded-xl h-9">Cancel</Button>
            <Button 
              className="bg-white hover:bg-white/90 text-black font-semibold rounded-xl px-4 h-9 transition-all shadow-lg border-none text-sm"
              disabled={issuingCertificate || !certClassId}
              onClick={async () => {
                if (!selectedStudent || !certClassId) return;
                setIssuingCertificate(true);
                try {
                  const res = await fetch("/api/teacher/certificates/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      studentId: selectedStudent.id,
                      classId: certClassId,
                      templateType: certType,
                      grade: feedbackText, // using the input value
                    }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast({ title: "Success", description: "Certificate issued successfully!" });
                    setIsCertificateDialogOpen(false);
                    setCertClassId("");
                    setFeedbackText("");
                  } else {
                    toast({ title: "Error", description: data.error, variant: "destructive" });
                  }
                } catch (error) {
                  toast({ title: "Error", description: "Failed to issue certificate", variant: "destructive" });
                } finally {
                  setIssuingCertificate(false);
                }
              }}
            >
              {issuingCertificate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Award className="w-4 h-4 mr-2" />}
              Issue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
