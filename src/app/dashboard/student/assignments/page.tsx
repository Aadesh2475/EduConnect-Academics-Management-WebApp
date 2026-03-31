"use client"

import { useState, useEffect } from "react"
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
import { Loader2, Calendar, FileText, CheckCircle2, Clock, Upload, ArrowRight, User, AlertTriangle } from "lucide-react"
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      <Card key={assignment.id} className={`flex flex-col hover:shadow-lg transition-all duration-300 border-t-4 bg-white dark:bg-[#161616] border-[#1C1C1C] ${isOverdue && type === 'pending' ? 'border-t-rose-500' : 'border-t-[#00E599]'}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-lg font-bold line-clamp-1 border-none bg-transparent dark:text-white">{assignment.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1.5 text-[10px] font-bold uppercase tracking-wider">
                <span className="text-[#00E599] bg-[#00E599]/10 border border-[#00E599]/20 px-2 py-0.5 rounded-md">{assignment.className}</span>
                <span className="text-slate-400 dark:text-slate-500 flex items-center"><User className="w-3 h-3 mr-1" /> {assignment.teacherName}</span>
              </CardDescription>
            </div>
            {type === 'graded' && assignment.submission && assignment.submission.grade !== null && (
              <div className="text-right shrink-0 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <p className="text-[10px] text-[#00E599] font-bold mb-0.5 uppercase tracking-widest">Score</p>
                <p className="text-lg font-bold text-white leading-none">{assignment.submission.grade} <span className="text-sm font-medium text-[#444]">/ {assignment.totalMarks}</span></p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">{assignment.description}</p>

          <div className="space-y-2 mt-auto">
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md border border-[#1C1C1C]">
              <Calendar className={`w-4 h-4 mr-2 ${isOverdue && type === 'pending' ? 'text-rose-500' : 'text-slate-400'}`} />
              <span className={isOverdue && type === 'pending' ? 'text-rose-600 font-medium' : ''}>
                Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {type !== 'pending' && assignment.submission && (
              <div className="flex items-center text-[11px] text-[#888] font-medium bg-black/20 p-2 rounded-md border border-[#1C1C1C]">
                <Clock className="w-3.5 h-3.5 mr-2 text-[#00E599]" />
                <span>Submitted: {new Date(assignment.submission.submittedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-4 border-t border-slate-100 border-[#1C1C1C] bg-slate-50/50 bg-[#1F1F1F]/30 flex flex-col gap-2">
          {type === 'pending' ? (
            <Button onClick={() => openSubmitDialog(assignment)} className="w-full bg-white hover:bg-white/90 text-black font-semibold text-xs h-10 transition-all active:scale-95 border-none">
              {isOverdue ? 'Submit Late' : 'Start Task'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : type === 'submitted' ? (
            <Button onClick={() => openSubmitDialog(assignment)} className="w-full bg-white hover:bg-white/90 text-black font-semibold text-xs h-10 transition-all active:scale-95 border-none">
              Edit Submission
            </Button>
          ) : (
            <Button onClick={() => openSubmitDialog(assignment)} className="w-full bg-white hover:bg-white/90 text-black font-semibold text-xs h-10 transition-all active:scale-95 border-none">
              View Results
            </Button>
          )}

          <RaiseIssueDialog
            defaultCategory="ASSIGNMENT"
            entityId={assignment.id}
            entityType="Assignment"
            defaultTitle={`Issue with Assignment: ${assignment.title}`}
            trigger={
              <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-900">
                <AlertTriangle className="w-3 h-3 mr-1.5" /> Report Problem
              </Button>
            }
          />
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-8 bg-[#090909] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white border-none bg-transparent">Assignments</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">View and submit your class assignments.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-[#161616] border border-[#1C1C1C] p-1 rounded-xl shadow-sm h-12">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-[#00E599]/10 data-[state=active]:text-[#00E599] data-[state=active]:border-[#00E599]/20 border border-transparent transition-all px-6 text-xs font-bold uppercase tracking-wider">
            To Do <Badge className="ml-2 bg-[#00E599] text-black border-0">{pendingAssignments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="submitted" className="rounded-lg data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:border-[#1C1C1C] border border-transparent transition-all px-6 text-xs font-bold uppercase tracking-wider">
            In Review
          </TabsTrigger>
          <TabsTrigger value="graded" className="rounded-lg data-[state=active]:bg-[#00E599]/10 data-[state=active]:text-[#00E599] data-[state=active]:border-[#00E599]/20 border border-transparent transition-all px-6 text-xs font-bold uppercase tracking-wider">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="m-0">
          {pendingAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-[#161616] rounded-2xl border border-[#1C1C1C] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E599]/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="w-16 h-16 rounded-full bg-[#00E599]/5 border border-[#00E599]/10 flex items-center justify-center mb-6 relative z-10">
                <CheckCircle2 className="w-8 h-8 text-[#00E599]/40" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">You're all caught up!</h3>
              <p className="text-[#555] text-xs font-medium max-w-sm mx-auto relative z-10">No pending assignments at the moment. Excellent progress.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingAssignments.map(a => renderAssignmentCard(a, 'pending'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="m-0">
          {submittedAssignments.length === 0 ? (
            <div className="py-20 text-center bg-white bg-[#1F1F1F] rounded-2xl border border-slate-100 border-[#1C1C1C] shadow-sm">
              <p className="text-slate-500 dark:text-slate-400">No assignments are currently awaiting grading.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {submittedAssignments.map(a => renderAssignmentCard(a, 'submitted'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="graded" className="m-0">
          {gradedAssignments.length === 0 ? (
            <div className="py-20 text-center bg-white bg-[#1F1F1F] rounded-2xl border border-slate-100 border-[#1C1C1C] shadow-sm">
              <p className="text-slate-500 dark:text-slate-400">You don't have any graded assignments yet.</p>
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-[#090909] border-[#1C1C1C]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white border-none">{selectedAssignment?.title}</DialogTitle>
            <DialogDescription className="text-[#00E599] text-[10px] font-bold uppercase tracking-widest mt-1">
              {selectedAssignment?.className} • Total Marks: {selectedAssignment?.totalMarks}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-6">
            {/* Instructions Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 border-[#1C1C1C]">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Instructions
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {selectedAssignment?.instructions || selectedAssignment?.description || "No specific instructions provided."}
              </p>
            </div>

            {/* Display Feedback if Graded */}
            {selectedAssignment?.submission?.status === "GRADED" && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Teacher Feedback
                  </h4>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-0">
                    Score: {selectedAssignment.submission.grade} / {selectedAssignment.totalMarks}
                  </Badge>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap">
                  {selectedAssignment.submission.feedback || <span className="italic opacity-80">No written feedback provided.</span>}
                </p>
              </div>
            )}

            {/* Submission Form area */}
            {selectedAssignment?.submission?.status !== "GRADED" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <Label htmlFor="submission" className="font-semibold text-slate-900 dark:text-white">Your Work</Label>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Write your answers or provide links to your work.</span>
                  </div>
                  <Textarea
                    id="submission"
                    placeholder="Type your submission here..."
                    className="min-h-[200px] p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 dark:text-slate-200 resize-y border border-[#1C1C1C]"
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter className="pt-4 border-t border-slate-100 border-[#1C1C1C] mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-white hover:bg-white/90 text-black font-semibold h-10 px-8 transition-all active:scale-95 border-none" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {selectedAssignment?.submission ? 'Update' : 'Submit'}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-2">
                <Label className="font-semibold text-slate-900 dark:text-white">Your Submitted Work</Label>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 border-[#1C1C1C] min-h-[150px] text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                  {selectedAssignment.submission.content}
                </div>
                <DialogFooter className="pt-4 mt-6">
                  <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>Close</Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
