"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Calendar, FileText, CheckCircle2, Clock, Upload, ArrowRight, User, AlertTriangle, BookOpen } from "lucide-react"
import { RaiseIssueDialog } from "@/components/student/RaiseIssueDialog"

type Submission = {
  id: string
  content: string
  status: string
  grade: number | null
  feedback: string | null
  submittedAt: string
  gradedAt: string | null
}

type Assignment = {
  id: string
  title: string
  description: string
  instructions: string | null
  dueDate: string
  totalMarks: number
  isActive: boolean
  className: string
  classCode: string
  teacherName: string
  submission: Submission | null
}

export default function StudentAssignmentsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<Assignment[]>([])

  // Submission Drawer State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [submissionContent, setSubmissionContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/student/assignments")
      const data = await res.json()
      if (data.success) {
        setAssignments(data.data)
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to load assignments.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment || !submissionContent.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/student/assignments/${selectedAssignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: submissionContent })
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: "Success", description: "Assignment submitted successfully." })
        setIsSubmitOpen(false)
        setSubmissionContent("")
        fetchAssignments() // Refresh list
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Submission failed.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setSubmissionContent(assignment.submission?.content || "")
    setIsSubmitOpen(true)
  }

  if (loading || isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  const pendingAssignments = assignments.filter(a => !a.submission || a.submission.status === "DRAFT")
  const submittedAssignments = assignments.filter(a => a.submission && (a.submission.status === "SUBMITTED" || a.submission.status === "LATE"))
  const gradedAssignments = assignments.filter(a => a.submission && a.submission.status === "GRADED")

  const renderAssignmentCard = (assignment: Assignment, type: 'pending' | 'submitted' | 'graded') => {
    const dueDate = new Date(assignment.dueDate)
    const isOverdue = dueDate < new Date() && !assignment.submission

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={assignment.id}
      >
        <Card className={`flex flex-col h-full hover:shadow-lg transition-all duration-300 bg-[#161616] border-[#1C1C1C] hover:border-[#444] rounded-2xl overflow-hidden group relative`}>
          {isOverdue && type === 'pending' && (
            <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500/50" />
          )}
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-lg font-bold line-clamp-1 border-none bg-transparent text-white group-hover:text-white transition-colors">
                  {assignment.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-white bg-white/10 border border-white/20 px-2 py-1 rounded-md">{assignment.className}</span>
                  <span className="text-[#888] flex items-center">
                    <User className="w-3 h-3 mr-1" /> {assignment.teacherName}
                  </span>
                </div>
              </div>
              {type === 'graded' && assignment.submission && assignment.submission.grade !== null && (
                <div className="text-right shrink-0 bg-[#111111] px-3 py-2 rounded-xl border border-[#252525]">
                  <p className="text-[9px] text-[#888] font-bold mb-0.5 uppercase tracking-widest">Score</p>
                  <p className="text-lg font-bold text-white leading-none">
                    {assignment.submission.grade} <span className="text-sm font-medium text-[#555]">/ {assignment.totalMarks}</span>
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-4 px-6">
            <p className="text-sm text-[#9A9A9A] line-clamp-2 mb-6 leading-relaxed">
              {assignment.description}
            </p>

            <div className="space-y-2 mt-auto">
              <div className={`flex items-center text-xs font-medium bg-[#111111] px-3 py-2.5 rounded-lg border border-[#252525] ${isOverdue && type === 'pending' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-[#888]'}`}>
                <Calendar className={`w-3.5 h-3.5 mr-2 ${isOverdue && type === 'pending' ? 'text-red-400' : 'text-[#555]'}`} />
                <span>
                  Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {type !== 'pending' && assignment.submission && (
                <div className="flex items-center text-xs font-medium text-[#888] bg-[#111111] px-3 py-2.5 rounded-lg border border-[#252525]">
                  <Clock className="w-3.5 h-3.5 mr-2 text-white" />
                  <span>Submitted: {new Date(assignment.submission.submittedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-4 pb-5 px-6 border-t border-[#252525] bg-[#1A1A1A] flex flex-col gap-3">
            {type === 'pending' ? (
              <Button onClick={() => openSubmitDialog(assignment)} className="w-full bg-white hover:bg-gray-200 text-black font-bold h-11 rounded-xl transition-all active:scale-95 shadow-none group-hover:bg-white group-hover:text-black">
                {isOverdue ? 'Submit Late' : 'Start Task'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : type === 'submitted' ? (
              <Button onClick={() => openSubmitDialog(assignment)} variant="outline" className="w-full bg-transparent border-[#333] hover:border-white text-white font-bold h-11 rounded-xl transition-all active:scale-95 shadow-none hover:bg-white/5">
                Edit Submission
              </Button>
            ) : (
              <Button onClick={() => openSubmitDialog(assignment)} variant="outline" className="w-full bg-[#111111] border-[#333] hover:border-white text-white font-bold h-11 rounded-xl transition-all active:scale-95 shadow-none hover:bg-white/5">
                View Results
              </Button>
            )}

            <RaiseIssueDialog
              defaultCategory="ASSIGNMENT"
              entityId={assignment.id}
              entityType="Assignment"
              defaultTitle={`Issue with Assignment: ${assignment.title}`}
              trigger={
                <Button variant="ghost" size="sm" className="w-full text-xs text-[#888] hover:text-white hover:bg-white/5 border border-transparent rounded-lg h-9">
                  <AlertTriangle className="w-3.5 h-3.5 mr-2 opacity-70" /> Report Problem
                </Button>
              }
            />
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Assignments</h1>
          <p className="text-[#9A9A9A] text-sm mt-1">View and submit your class assignments.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-[#161616] border border-[#1C1C1C] p-1.5 rounded-xl h-12">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/10 border border-transparent transition-all px-5 sm:px-8 text-xs font-bold uppercase tracking-wider text-[#888]">
            To Do <Badge className="ml-2 bg-white text-black border-0">{pendingAssignments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="submitted" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/10 border border-transparent transition-all px-5 sm:px-8 text-xs font-bold uppercase tracking-wider text-[#888]">
            In Review
          </TabsTrigger>
          <TabsTrigger value="graded" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/10 border border-transparent transition-all px-5 sm:px-8 text-xs font-bold uppercase tracking-wider text-[#888]">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="m-0 mt-6">
          {pendingAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-[#161616] rounded-2xl border border-[#1C1C1C] shadow-none overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center mb-6 relative z-10 transition-transform hover:scale-110 duration-500">
                <CheckCircle2 className="w-8 h-8 text-[#555]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">You're all caught up!</h3>
              <p className="text-[#888] text-sm font-medium max-w-sm mx-auto relative z-10">No pending assignments at the moment. Excellent progress.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingAssignments.map(a => renderAssignmentCard(a, 'pending'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="m-0 mt-6">
          {submittedAssignments.length === 0 ? (
            <div className="py-24 text-center bg-[#161616] rounded-2xl border border-[#1C1C1C] shadow-none">
              <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-[#555]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Submissions In Review</h3>
              <p className="text-[#888] text-sm font-medium">No assignments are currently awaiting grading.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {submittedAssignments.map(a => renderAssignmentCard(a, 'submitted'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="graded" className="m-0 mt-6">
          {gradedAssignments.length === 0 ? (
            <div className="py-24 text-center bg-[#161616] rounded-2xl border border-[#1C1C1C] shadow-none">
              <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-[#555]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Graded Assignments</h3>
              <p className="text-[#888] text-sm font-medium">You don't have any graded assignments yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {gradedAssignments.map(a => renderAssignmentCard(a, 'graded'))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submission Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden p-0 bg-[#161616] border-[#1C1C1C] shadow-[0_8px_32px_rgba(0,0,0,0.6)] rounded-2xl flex flex-col">
          <DialogHeader className="p-6 border-b border-[#252525] bg-[#1A1A1A] shrink-0">
            <DialogTitle className="text-xl font-bold text-white border-none">{selectedAssignment?.title}</DialogTitle>
            <DialogDescription className="text-white bg-white/10 px-3 py-1.5 rounded-md inline-block text-[10px] font-bold uppercase tracking-widest mt-3 border border-white/20 w-fit">
              {selectedAssignment?.className} <span className="text-[#888] mx-2">•</span> <span className="text-[#9A9A9A]">Total Marks: {selectedAssignment?.totalMarks}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 overflow-y-auto w-full">
            {/* Instructions Section */}
            <div className="bg-[#111111] p-5 rounded-xl border border-[#252525]">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <FileText className="w-4 h-4 text-[#555]" /> Instructions
              </h4>
              <p className="text-sm text-[#9A9A9A] whitespace-pre-wrap leading-relaxed">
                {selectedAssignment?.instructions || selectedAssignment?.description || "No specific instructions provided."}
              </p>
            </div>

            {/* Display Feedback if Graded */}
            {selectedAssignment?.submission?.status === "GRADED" && (
              <div className="bg-[#1A1A1A] p-5 rounded-xl border border-[#252525]">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-white" /> Teacher Feedback
                  </h4>
                  <Badge className="bg-white text-black font-bold shadow-none border-0 text-xs px-3 py-1">
                    Score: {selectedAssignment.submission.grade} / {selectedAssignment.totalMarks}
                  </Badge>
                </div>
                <div className="bg-[#111111] p-4 rounded-lg border border-[#252525]">
                  <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                    {selectedAssignment.submission.feedback || <span className="italic text-[#555]">No written feedback provided.</span>}
                  </p>
                </div>
              </div>
            )}

            {/* Submission Form area */}
            {selectedAssignment?.submission?.status !== "GRADED" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <Label htmlFor="submission" className="font-bold text-white uppercase tracking-wider text-xs">Your Work</Label>
                    <span className="text-xs text-[#555] font-medium">Write your answers or provide links.</span>
                  </div>
                  <Textarea
                    id="submission"
                    placeholder="Type your submission here..."
                    className="min-h-[250px] p-5 font-mono text-sm bg-[#111111] text-white focus-visible:ring-0 focus-visible:border-[#555] placeholder:text-[#444] resize-y border border-[#252525] rounded-xl transition-all"
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter className="pt-6 mt-6 shrink-0 border-t border-[#252525]">
                  <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)} disabled={isSubmitting} className="border-transparent bg-transparent text-[#888] hover:bg-white/5 hover:text-white rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-white hover:bg-gray-200 text-black font-bold h-10 px-8 rounded-xl transition-all active:scale-95 border-none shadow-none" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {selectedAssignment?.submission ? 'Update Submission' : 'Submit Assignment'}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-3">
                <Label className="font-bold text-white uppercase tracking-wider text-xs">Your Submitted Work</Label>
                <div className="bg-[#111111] p-5 rounded-xl border border-[#252525] min-h-[150px] text-sm text-[#9A9A9A] whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedAssignment.submission.content}
                </div>
                <DialogFooter className="pt-6 mt-6 shrink-0 border-t border-[#252525]">
                  <Button variant="outline" onClick={() => setIsSubmitOpen(false)} className="bg-[#111111] border-[#252525] text-white hover:bg-white hover:text-black rounded-xl h-10 px-8 transition-colors">Close</Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
