"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  FileText,
  Plus,
  Calendar,
  Clock,
  Users,
  Edit2,
  Trash2,
  Eye,
  BarChart3,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { CreateExamDialog } from "@/components/dashboard/teacher/create-exam-dialog"
import { ExamResultsDialog } from "@/components/dashboard/teacher/exam-results-dialog"
import { ExternalExamDialog } from "@/components/dashboard/teacher/external-exam-dialog"
import { formatDate } from "@/lib/utils"

interface Question {
  question: string
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER"
  options: string[]
  correctAnswer: string
  marks: number
}

interface Exam {
  id: string
  title: string
  description?: string
  className: string
  classCode: string
  classId: string
  type: "QUIZ" | "MIDTERM" | "FINAL" | "PRACTICE"
  duration: number
  totalMarks: number
  questionsCount: number
  startDate: string
  endDate: string // For API compatibility, this is actually startTime/endTime
  startTime: string
  endTime: string
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "DRAFT"
  stats?: {
    totalStudents: number
    totalAttempts: number
    completedAttempts: number
    averageScore: number | null
  }
}

interface ClassOption {
  id: string
  name: string
  code: string
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-[#1F1F1F] text-[#B5B5B5] border-[#1C1C1C]",
  UPCOMING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ONGOING: "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20",
  COMPLETED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

const typeColors: Record<string, string> = {
  QUIZ: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  MIDTERM: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  FINAL: "bg-red-500/10 text-red-400 border-red-500/20",
  PRACTICE: "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20",
}

export default function TeacherExaminationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [isResultsOpen, setIsResultsOpen] = useState(false)
  const [isExternalOpen, setIsExternalOpen] = useState(false)
  const [externalExams, setExternalExams] = useState<any[]>([])
  const [selectedExternalReport, setSelectedExternalReport] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState("digital")


  const fetchData = async () => {
    try {
      setLoading(true)
      const [examsRes, classesRes] = await Promise.all([
        fetch("/api/teacher/exams"),
        fetch("/api/teacher/classes")
      ])

      if (examsRes.ok) {
        const result = await examsRes.json()
        setExams(result.data || [])
      }

      const externalRes = await fetch("/api/teacher/exams/external")
      if (externalRes.ok) {
        const result = await externalRes.json()
        setExternalExams(result.data || [])
      }

      if (classesRes.ok) {
        const result = await classesRes.json()
        setClasses(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return

    try {
      const res = await fetch(`/api/teacher/exams/${id}`, {
        method: "DELETE"
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: "Exam deleted",
          description: "The exam has been removed.",
          variant: "success",
        })
        setExams(exams.filter(e => e.id !== id))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete exam",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete exam",
        variant: "destructive",
      })
    }
  }

  const handleDeleteExternal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this external exam report?")) return

    try {
      const res = await fetch(`/api/teacher/exams/external/${id}`, {
        method: "DELETE"
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: "Report deleted",
          description: "The external exam report has been removed.",
          variant: "success",
        })
        setExternalExams(externalExams.filter(e => e.id !== id))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete report",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      })
    }
  }

  const filteredExams = exams.filter(exam =>
    selectedStatus === "all" || (exam.status as string) === selectedStatus
  )

  const upcomingExams = exams.filter(e => e.status === "UPCOMING")
  const activeExams = exams.filter(e => e.status === "ONGOING")
  const completedExams = exams.filter(e => e.status === "COMPLETED")

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
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Examinations</h1>
          <p className="text-[13px] text-[#B5B5B5] mt-2">Create and manage digital and external assessments</p>
        </div>
        <CreateExamDialog
          examId={selectedExamId}
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          classes={classes}
          onSuccess={fetchData}
        />
        <ExamResultsDialog
          open={isResultsOpen}
          onOpenChange={setIsResultsOpen}
          examId={selectedExamId}
        />
        <ExternalExamDialog
          open={isExternalOpen}
          onOpenChange={setIsExternalOpen}
          classes={classes}
          onSuccess={fetchData}
          report={selectedExternalReport}
        />
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 px-4 rounded-xl border-[#1C1C1C] bg-[#1F1F1F] text-[#B5B5B5] hover:bg-white/5 font-semibold text-sm" onClick={() => { setSelectedExternalReport(null); setIsExternalOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            External Marks
          </Button>
          <Button className="h-9 px-4 rounded-xl bg-white hover:bg-white/90 text-black font-semibold border-none text-sm" onClick={() => { setSelectedExamId(null); setIsCreateOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Exam
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1F1F1F] border border-[#1C1C1C]">
                <FileText className="w-5 h-5 text-[#B5B5B5]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{exams.length}</p>
                <p className="text-[13px] text-[#B5B5B5] mt-1">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{upcomingExams.length}</p>
                <p className="text-[13px] text-[#B5B5B5] mt-1">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#00E599]/10 border border-[#00E599]/20">
                <CheckCircle className="w-5 h-5 text-[#00E599]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{activeExams.length}</p>
                <p className="text-[13px] text-[#B5B5B5] mt-1">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{completedExams.length}</p>
                <p className="text-[13px] text-[#B5B5B5] mt-1">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="digital">Digital Exams</TabsTrigger>
          <TabsTrigger value="external">External Exams</TabsTrigger>
        </TabsList>

        <TabsContent value="digital" className="space-y-6 mt-6">
          {/* Filter */}
          <Card>
            <CardContent className="pt-6">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

      {/* Exams List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Exams & Quizzes
          </CardTitle>
          <CardDescription>
            {filteredExams.length} exam{filteredExams.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExams.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No exams found</h3>
              <p className="text-gray-500">Create your first exam to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-lg border hover:bg-gray-50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                        <Badge className={statusColors[exam.status]}>{exam.status}</Badge>
                        <Badge className={typeColors[exam.type]}>{exam.type}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Badge variant="outline">{exam.classCode}</Badge>
                          {exam.className}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exam.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {exam.questionsCount} questions
                        </span>
                        <span>{exam.totalMarks} marks</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(exam.startTime).toLocaleString()} - {new Date(exam.endTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {exam.stats && (
                        <div className="text-right hidden md:block">
                          <p className="text-sm font-medium text-gray-900">{exam.stats.totalAttempts}/{exam.stats.totalStudents} attempts</p>
                          {exam.stats.averageScore && (
                            <p className="text-xs text-gray-500">Avg: {exam.stats.averageScore}%</p>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedExamId(exam.id); setIsResultsOpen(true) }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Results
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/teacher/exams?examId=${exam.id}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(exam.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                External Exam Reports
              </CardTitle>
              <CardDescription>
                Manual entries for physical exams and end-sem assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {externalExams.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No external reports</h3>
                  <p className="text-gray-500">Upload marks for physical exams</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {externalExams.map((report) => (
                    <Card key={report.id} className="overflow-hidden border-orange-100 hover:border-orange-200 transition-colors">
                      <div className="h-1 bg-orange-500" />
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-50">
                            {report.examType}
                          </Badge>
                          <span className="text-sm font-bold text-orange-600">
                            {report.percentage}%
                          </span>
                        </div>
                        <CardTitle className="text-lg mt-2">{report.testName || "Physical Exam"}</CardTitle>
                        <CardDescription>{report.class.name} ({report.class.code})</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                              {report.student.user.image ? (
                                <img src={report.student.user.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{report.student.user.name}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span>Score: <strong>{report.obtainedMarks}</strong> / {report.totalMarks}</span>
                          </div>

                          {report.note && (
                            <p className="text-xs text-gray-500 italic line-clamp-2">
                              "{report.note}"
                            </p>
                          )}
                          
                          <div className="flex justify-end gap-2 pt-2 border-t">
                             <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 h-8"
                              onClick={() => { setSelectedExternalReport(report); setIsExternalOpen(true) }}
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                              onClick={() => handleDeleteExternal(report.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
