"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  Play,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Settings,
  Copy,
  ChevronRight,
  BookOpen,
} from "lucide-react"
import { CreateExamDialog } from "@/components/dashboard/teacher/create-exam-dialog"
import { ExamResultsDialog } from "@/components/dashboard/teacher/exam-results-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { SkeletonTable } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn, formatDate } from "@/lib/utils"


interface Exam {
  id: string
  title: string
  description?: string
  type: "QUIZ" | "MIDTERM" | "FINAL" | "PRACTICE"
  classId: string
  className: string
  classCode: string
  duration: number
  totalMarks: number
  passingMarks?: number
  startTime: string
  endTime: string
  questionsCount: number
  isActive: boolean
  status: string
  stats: {
    totalStudents: number
    totalAttempts: number
    completedAttempts: number
    notAttempted: number
    averageScore: number | null
    attemptRate: number
  }
}

interface Question {
  id: string
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER"
  question: string
  options?: string[]
  answer: string
  marks: number
  explanation?: string
}

export default function TeacherExamsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false)
  const [showAddQuestionDialog, setShowAddQuestionDialog] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [teacherClassesList, setTeacherClassesList] = useState<{ id: string, name: string, code: string }[]>([])
  const [newQuestion, setNewQuestion] = useState<{
    type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER"
    question: string
    options: string[]
    answer: string
    marks: string
    explanation: string
  }>({
    type: "MCQ",
    question: "",
    options: ["", "", "", ""],
    answer: "",
    marks: "5",
    explanation: "",
  })



  const [showResultsDialog, setShowResultsDialog] = useState(false)

  const fetchExams = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/teacher/exams")
      const data = await res.json()
      if (data.success) {
        setExams(data.data)
      } else {
        toast({ title: "Error", description: data.error || "Failed to fetch exams", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch exams", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/teacher/classes")
      const data = await res.json()
      if (data.success) {
        setTeacherClassesList(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch classes", error)
    }
  }

  const handleDeleteExam = async (examId: string) => {
    try {
      const res = await fetch(`/api/teacher/exams/${examId}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Exam deleted successfully",
        })
        fetchExams()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete exam",
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

  const handleStopExam = async (examId: string) => {
    try {
      const res = await fetch(`/api/teacher/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endTime: new Date().toISOString() })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Exam stopped successfully" })
        fetchExams()
      } else {
        toast({ title: "Error", description: data.error || "Failed to stop exam", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to stop exam", variant: "destructive" })
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedExam) return
    try {
      const res = await fetch(`/api/teacher/exams/${selectedExam.id}/questions/${questionId}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        setQuestions(prev => prev.filter(q => q.id !== questionId))
        toast({ title: "Success", description: "Question deleted" })
        fetchExams() // Refresh total marks
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete question", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete question", variant: "destructive" })
    }
  }

  useEffect(() => {
    fetchExams()
    fetchClasses()
  }, [])

  const handleAddQuestion = async () => {
    if (!selectedExam) return
    if (!newQuestion.question || !newQuestion.answer) {
      toast({ title: "Error", description: "Please fill question and answer", variant: "destructive" })
      return
    }

    try {
      const res = await fetch(`/api/teacher/exams/${selectedExam.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      })
      const data = await res.json()

      if (data.success) {

        setQuestions(prev => [...prev, {
          id: data.data.id,
          ...newQuestion,
          marks: parseInt(newQuestion.marks),
        }])

        toast({ title: "Success", description: "Question added" })
        setNewQuestion({
          type: "MCQ", question: "", options: ["", "", "", ""],
          answer: "", marks: "5", explanation: "",
        })
      } else {
        toast({ title: "Error", description: data.error || "Failed to add question", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    }
  }

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.className.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || e.type === typeFilter
    return matchesSearch && matchesType
  })

  const getExamStatus = (exam: Exam) => {
    const now = new Date()
    const start = new Date(exam.startTime)
    const end = new Date(exam.endTime)

    if (now < start) return { status: "UPCOMING", color: "bg-[#1F1F1F] text-[#00E599] border-[#00E599]/20" }
    if (now > end) return { status: "ENDED", color: "bg-[#1F1F1F] text-[#9A9A9A] border-[#1C1C1C]" }
    return { status: "ACTIVE", color: "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20" }
  }

  const stats = {
    total: exams.length,
    active: exams.filter(e => e.status === "ACTIVE" || e.status === "ONGOING").length,
    upcoming: exams.filter(e => e.status === "UPCOMING").length,
    totalQuestions: exams.reduce((acc, e) => acc + (e.questionsCount || 0), 0),
  }

  return (
    <div className="space-y-8 min-h-screen bg-[#000] -m-6 p-8 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E599]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1C1C1C] pb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Examinations</h1>
          <p className="text-[13px] text-[#B5B5B5] mt-2">
            Manage all evaluations and assessment sessions
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="h-9 px-4 bg-white hover:bg-white/90 text-black font-semibold rounded-xl shadow-lg transition-all active:scale-95 border-none text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
      </div>

      <div className="relative z-10 space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: ClipboardCheck },
          { label: "Active", value: stats.active, icon: Play },
          { label: "Scheduled", value: stats.upcoming, icon: Calendar },
          { label: "Question Pool", value: stats.totalQuestions, icon: BookOpen },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden group hover:border-[#00E599]/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[13px] text-[#B5B5B5] group-hover:text-white transition-colors">{stat.label}</p>
                    <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-black/40 border border-[#1C1C1C] flex items-center justify-center text-[#00E599] transition-all group-hover:scale-110 group-hover:bg-[#00E599]/5">
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#444] w-4 h-4" />
              <Input
                placeholder="Find session..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 bg-black/40 border-[#1C1C1C] text-white placeholder:text-[#555] rounded-xl focus:border-[#00E599]/50 transition-all text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10 bg-black/40 border-[#1C1C1C] text-white rounded-xl focus:border-[#00E599]/50 text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                <SelectItem value="all" className="focus:bg-[#00E599]/10">All Exams</SelectItem>
                <SelectItem value="QUIZ" className="focus:bg-[#00E599]/10">Quiz</SelectItem>
                <SelectItem value="MIDTERM" className="focus:bg-[#00E599]/10">Midterm</SelectItem>
                <SelectItem value="FINAL" className="focus:bg-[#00E599]/10">Final Exam</SelectItem>
                <SelectItem value="PRACTICE" className="focus:bg-[#00E599]/10">Practice Test</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exams List */}
      {loading ? (
        <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-[#161616] border border-[#1C1C1C] rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam, index) => {
            const { status, color } = getExamStatus(exam)
            const completionRate = exam.stats.completedAttempts / exam.stats.totalStudents * 100 || 0

            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group relative bg-[#161616] border-[#1C1C1C] rounded-2xl overflow-hidden hover:border-[#00E599]/30 transition-all">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#00E599]/0 group-hover:to-[#00E599]/5 transition-all duration-500" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-black border border-[#1C1C1C] flex items-center justify-center shrink-0 text-[#00E599] group-hover:scale-110 transition-transform">
                            <ClipboardCheck className="w-6 h-6" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-lg font-bold text-white group-hover:text-[#00E599] transition-colors">{exam.title}</h3>
                              <div className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold border", color)}>
                                {status === "ACTIVE" ? "Active" : status === "UPCOMING" ? "Upcoming" : "Ended"}
                              </div>
                              <Badge variant="outline" className="text-[10px] font-bold border-[#1C1C1C] text-[#555]">{exam.type}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-medium text-[#555]">
                              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-[#1C1C1C]">
                                <BookOpen className="w-3 h-3" />
                                <span>{exam.className}</span>
                              </div>
                              <div className="px-2 py-0.5 rounded-md border border-[#1C1C1C] font-mono text-[10px] text-[#555]">
                                {exam.classCode}
                              </div>
                            </div>
                            {exam.description && (
                              <p className="text-[13px] text-[#444] font-medium line-clamp-1 mt-1">{exam.description}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-10">
                        <div className="flex gap-8">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Duration</p>
                            <p className="text-sm font-bold text-white">{exam.duration}m</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Questions</p>
                            <p className="text-sm font-bold text-white">{exam.questionsCount}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest text-right">Max Score</p>
                            <p className="text-sm font-bold text-white text-right">{exam.totalMarks}pt</p>
                          </div>
                        </div>

                        <div className="w-40 space-y-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-[#555]">Completions</span>
                            <span className="text-white">{exam.stats.completedAttempts} / {exam.stats.totalStudents}</span>
                          </div>
                          <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-[#1C1C1C]">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${completionRate}%` }}
                                className="h-full bg-gradient-to-r from-[#00E599]/40 to-[#00E599]"
                             />
                          </div>
                          {exam.stats.averageScore && (
                            <div className="flex items-center justify-end gap-1.5">
                                <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Avg Score</span>
                                <span className="text-xs font-bold text-[#00E599]">{exam.stats.averageScore}%</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            onClick={() => { setSelectedExam(exam); setShowQuestionsDialog(true) }}
                            className="h-10 px-6 bg-white hover:bg-white/90 text-black font-semibold rounded-xl text-sm transition-all active:scale-95 border-none"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-[#444] hover:bg-[#1C1C1C] rounded-xl">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#161616] border-[#1C1C1C] text-white min-w-[160px] rounded-xl overflow-hidden p-1 shadow-2xl">
                              <DropdownMenuItem onClick={() => {
                                setSelectedExam(exam)
                                setShowCreateDialog(true)
                              }} className="flex items-center gap-2 px-3 py-2 text-sm font-medium focus:bg-[#00E599]/10 focus:text-white cursor-pointer rounded-lg">
                                <Edit className="h-3.5 w-3.5 text-[#00E599]" />
                                Edit
                              </DropdownMenuItem>
                              {status === "ACTIVE" && (
                                <DropdownMenuItem onClick={() => {
                                  if (window.confirm("Stop this exam? Students will no longer be able to attempt it.")) {
                                    handleStopExam(exam.id)
                                  }
                                }} className="flex items-center gap-2 px-3 py-2 text-sm font-medium focus:bg-orange-500/10 focus:text-white cursor-pointer rounded-lg">
                                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                                  End
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => { setSelectedExam(exam); setShowResultsDialog(true) }} className="flex items-center gap-2 px-3 py-2 text-sm font-medium focus:bg-[#00E599] focus:text-black cursor-pointer rounded-lg">
                                <Users className="h-3.5 w-3.5 text-white" />
                                Results
                              </DropdownMenuItem>
                              <div className="h-px bg-[#1C1C1C] my-1" />
                              <DropdownMenuItem
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium focus:bg-red-500/10 text-red-500 cursor-pointer rounded-lg"
                                onClick={() => {
                                  if (window.confirm("Delete this exam?")) {
                                    handleDeleteExam(exam.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
      </div>

      <CreateExamDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) setSelectedExam(null)
        }}
        examId={selectedExam?.id}
        classes={teacherClassesList}
        onSuccess={fetchExams}
      />

      <ExamManagementDialog
        open={showQuestionsDialog}
        onOpenChange={setShowQuestionsDialog}
        exam={selectedExam}
        onUpdate={fetchExams}
      />

      <CreateExamDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) setSelectedExam(null)
        }}
        examId={selectedExam?.id}
        classes={teacherClassesList}
        onSuccess={fetchExams}
      />
    </div>
  )
}

function ExamManagementDialog({ open, onOpenChange, exam, onUpdate }: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  exam: Exam | null,
  onUpdate: () => void 
}) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("questions")
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<any[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: "MCQ",
    question: "",
    options: ["", "", "", ""],
    answer: "",
    marks: 5,
    explanation: ""
  })

  const fetchData = async () => {
    if (!exam) return
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/exams/${exam.id}`)
      const data = await res.json()
      if (data.success) {
        setQuestions(data.data.questions || [])
        setResults(data.data.results || [])
      }
    } catch (error) {
      console.error("Failed to fetch exam data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && exam) {
      fetchData()
    }
  }, [open, exam])

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Delete this question?")) return
    try {
      const res = await fetch(`/api/teacher/exams/${exam?.id}/questions/${id}`, { method: "DELETE" })
      if ((await res.json()).success) {
        toast({ title: "Success", description: "Question deleted" })
        fetchData()
        onUpdate()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete question", variant: "destructive" })
    }
  }

  const handleUpsertQuestion = async (q: Partial<Question>) => {
    const isEdit = !!q.id
    const url = isEdit 
      ? `/api/teacher/exams/${exam?.id}/questions/${q.id}`
      : `/api/teacher/exams/${exam?.id}/questions`
    
    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q)
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: `Question ${isEdit ? "updated" : "added"}` })
        setEditingQuestion(null)
        setShowAddForm(false)
        fetchData()
        onUpdate()
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Operation failed", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-[#161616] border-[#1C1C1C] rounded-3xl p-0 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-[#1C1C1C] bg-[#000]/20">
          <DialogHeader className="flex flex-row justify-between items-start space-y-0">
            <div>
              <DialogTitle className="text-2xl font-bold text-white tracking-tight">{exam?.title}</DialogTitle>
              <DialogDescription className="text-xs text-[#555] font-medium mt-1">
                Manage questions and view results for {exam?.className}
              </DialogDescription>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="outline" className="bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20">
                  {exam?.className}
                </Badge>
                <span className="text-xs text-[#555] font-medium">• {exam?.duration} mins</span>
                <span className="text-xs text-[#555] font-medium">• {exam?.totalMarks} marks</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Status</p>
              <Badge className={cn(
                "font-bold",
                exam?.status === "ENDED" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20"
              )}>
                {exam?.status}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 bg-[#000]/10">
            <TabsList className="bg-transparent border-b border-[#1C1C1C] w-full justify-start rounded-none h-12 gap-8">
              <TabsTrigger value="questions" className="data-[state=active]:bg-transparent data-[state=active]:text-[#00E599] data-[state=active]:border-b-2 data-[state=active]:border-[#00E599] rounded-none px-0 text-sm font-bold text-[#555]">
                Questions
              </TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-transparent data-[state=active]:text-[#00E599] data-[state=active]:border-b-2 data-[state=active]:border-[#00E599] rounded-none px-0 text-sm font-bold text-[#555]">
                Results & Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <TabsContent value="questions" className="m-0 space-y-6">
              {!showAddForm && !editingQuestion && (
                <div className="flex justify-between items-center bg-[#1C1C1C]/30 p-4 rounded-2xl border border-[#1C1C1C]">
                  <div>
                    <p className="text-sm font-bold text-white">{questions.length} Questions</p>
                    <p className="text-xs text-[#555]">Manage and edit your exam question pool</p>
                  </div>
                  <Button onClick={() => setShowAddForm(true)} size="sm" className="bg-white hover:bg-white/90 text-black font-bold h-9 rounded-xl">
                    <Plus className="w-4 h-4 mr-2" /> Add New
                  </Button>
                </div>
              )}

              {(showAddForm || editingQuestion) && (
                <Card className="bg-black/40 border-[#00E599]/30 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-white">{editingQuestion ? "Edit Question" : "New Question"}</h4>
                      <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setEditingQuestion(null) }} className="text-[#555] hover:text-white">Cancel</Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Type</Label>
                        <Select 
                          value={editingQuestion?.type || newQuestion.type} 
                          onValueChange={(v: any) => editingQuestion ? setEditingQuestion({...editingQuestion, type: v}) : setNewQuestion({...newQuestion, type: v})}
                        >
                          <SelectTrigger className="bg-[#1F1F1F] border-[#1C1C1C] text-white rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                            <SelectItem value="MCQ">Multiple Choice</SelectItem>
                            <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                            <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Marks</Label>
                        <Input 
                          type="number" 
                          value={editingQuestion?.marks || newQuestion.marks} 
                          onChange={(e) => editingQuestion ? setEditingQuestion({...editingQuestion, marks: parseInt(e.target.value)}) : setNewQuestion({...newQuestion, marks: parseInt(e.target.value)})}
                          className="bg-[#1F1F1F] border-[#1C1C1C] text-white rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Question</Label>
                      <Textarea 
                        value={editingQuestion?.question || newQuestion.question} 
                        onChange={(e) => editingQuestion ? setEditingQuestion({...editingQuestion, question: e.target.value}) : setNewQuestion({...newQuestion, question: e.target.value})}
                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white rounded-xl min-h-[100px]"
                        placeholder="Type your question here..."
                      />
                    </div>

                    {(editingQuestion?.type === "MCQ" || newQuestion.type === "MCQ") && (
                      <div className="space-y-4">
                        <Label className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Options</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-[#00E599] font-bold w-4">{String.fromCharCode(65+i)}</span>
                              <Input 
                                value={editingQuestion ? (Array.isArray(editingQuestion.options) ? editingQuestion.options[i] : (typeof editingQuestion.options === 'string' ? JSON.parse(editingQuestion.options)[i] : "")) : newQuestion.options?.[i]} 
                                onChange={(e) => {
                                  if (editingQuestion) {
                                    const rawOpts = editingQuestion.options || ["","","",""]
                                    const opts = [...(Array.isArray(rawOpts) ? rawOpts : (typeof rawOpts === 'string' ? JSON.parse(rawOpts) : ["","","",""]))]
                                    opts[i] = e.target.value
                                    setEditingQuestion({...editingQuestion, options: opts})
                                  } else {
                                    const opts = [...(newQuestion.options || ["","","",""])]
                                    opts[i] = e.target.value
                                    setNewQuestion({...newQuestion, options: opts})
                                  }
                                }}
                                className="bg-[#1F1F1F] border-[#1C1C1C] text-white rounded-xl"
                                placeholder={`Option ${i+1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Correct Answer</Label>
                      <Input 
                        value={editingQuestion?.answer || newQuestion.answer} 
                        onChange={(e) => editingQuestion ? setEditingQuestion({...editingQuestion, answer: e.target.value}) : setNewQuestion({...newQuestion, answer: e.target.value})}
                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white rounded-xl"
                        placeholder="Exact answer for validation"
                      />
                    </div>

                    <Button 
                      onClick={() => handleUpsertQuestion(editingQuestion || newQuestion)} 
                      className="w-full bg-[#00E599] hover:bg-[#00C589] text-black font-bold h-11 rounded-xl mt-4"
                    >
                      {editingQuestion ? "Update Question" : "Save Question"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {questions.map((q, i) => (
                  <Card key={q.id} className="bg-[#1C1C1C]/40 border-[#1C1C1C] rounded-2xl overflow-hidden group hover:border-[#00E599]/30 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-[10px] font-bold text-[#00E599] border border-[#1C1C1C]">
                              {i + 1}
                            </span>
                            <Badge variant="outline" className="text-[9px] font-bold border-[#1C1C1C] text-[#555] uppercase tracking-widest">{q.type}</Badge>
                            <span className="text-[10px] font-bold text-[#00E599]">{q.marks} Marks</span>
                          </div>
                          <p className="text-white font-bold leading-relaxed">{q.question}</p>
                          
                          {q.options && (
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt: string, idx: number) => (
                                <div key={idx} className={cn(
                                  "p-3 rounded-xl border text-[13px] font-medium transition-all",
                                  opt === q.answer ? "bg-[#00E599]/10 border-[#00E599]/30 text-[#00E599]" : "bg-black border-[#1C1C1C] text-[#555]"
                                )}>
                                  <span className="mr-2 opacity-50 font-mono">{String.fromCharCode(65 + idx)}.</span> {opt}
                                </div>
                              ))}
                            </div>
                          )}
                          {!q.options && (
                             <div className="p-3 rounded-xl bg-[#00E599]/5 border border-[#00E599]/20 text-[13px] font-bold text-[#00E599]">
                                Correct: {q.answer}
                             </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setEditingQuestion(q)}
                            className="h-9 w-9 text-[#555] hover:text-[#00E599] hover:bg-[#00E599]/10 rounded-xl"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="h-9 w-9 text-[#555] hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="results" className="m-0 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-[#1C1C1C]/40 border-[#1C1C1C] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Attempted</p>
                  <p className="text-xl font-bold text-white">{results.filter(r => r.status === "ATTEMPTED").length} / {results.length}</p>
                </Card>
                <Card className="bg-[#1C1C1C]/40 border-[#1C1C1C] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Pass Rate</p>
                  <p className="text-xl font-bold text-[#00E599]">
                    {results.length > 0 ? Math.round((results.filter(r => r.status_classified === "PASS").length / results.length) * 100) : 0}%
                  </p>
                </Card>
                <Card className="bg-[#1C1C1C]/40 border-[#1C1C1C] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">Avg Score</p>
                  <p className="text-xl font-bold text-white">
                    {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.filter(r => r.status === "ATTEMPTED").length || 1) : 0}%
                  </p>
                </Card>
              </div>

              <div className="rounded-2xl border border-[#1C1C1C] bg-black overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#1C1C1C]/50">
                    <TableRow className="border-[#1C1C1C] hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold text-[#555] uppercase tracking-widest py-4">Student</TableHead>
                      <TableHead className="text-[10px] font-bold text-[#555] uppercase tracking-widest text-center">Score</TableHead>
                      <TableHead className="text-[10px] font-bold text-[#555] uppercase tracking-widest text-center">Result</TableHead>
                      <TableHead className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20 text-[#444] text-xs font-bold uppercase tracking-widest">No attempted results found</TableCell></TableRow>
                    ) : results.map((result) => (
                      <TableRow key={result.studentId} className="border-[#1C1C1C] hover:bg-[#161616] transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 rounded-lg border border-[#1C1C1C]">
                              <AvatarImage src={result.image} />
                              <AvatarFallback className="bg-[#1F1F1F] text-[#00E599] text-[10px]">{result.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-white">{result.name}</p>
                              <p className="text-[10px] text-[#555] font-mono">{result.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <p className="text-sm font-bold text-white">{result.score}/{exam?.totalMarks}</p>
                          <p className="text-[10px] font-bold text-[#555]">{Math.round(result.percentage)}%</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                             "text-[9px] font-bold uppercase tracking-widest px-2",
                             result.status_classified === "PASS" ? "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20" :
                             result.status_classified === "ATKT" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                             result.status_classified === "FAIL" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                             "bg-[#1C1C1C] text-[#555] border-[#1C1C1C]"
                          )}>
                            {result.status === "ATTEMPTED" ? result.status_classified : "PENDING"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[12px] font-medium text-[#888] italic">
                          {result.remarks || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-6 border-t border-[#1C1C1C] bg-[#000]/20">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#1C1C1C] text-[#555] hover:text-white hover:bg-[#1C1C1C] px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest">
            Close Panel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

