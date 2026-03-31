"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Search, Trophy, AlertTriangle, Lightbulb, Star, MessageSquare, Loader2, Target, Sparkles, BookOpen, Clock, Zap, ChevronDown, ChevronUp, Mail, Bot, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

interface TopPerformer {
    studentId: string; userId: string; name: string; email: string; image?: string | null
    classId: string; className: string; classCode: string
    performanceRate: number; examAvg: number; attendanceRate: number; rank: number
    teacherRating: { rating: number; feedback: string | null } | null
}

interface AttentionStudent {
    studentId: string; userId: string; name: string; email: string; image?: string | null
    classId: string; className: string; classCode: string
    performanceRate: number; examAvg: number; attendanceRate: number
    issues: string[]
}

interface StudentInsightsTabProps {
    topPerformers: TopPerformer[]
    attentionNeeded: AttentionStudent[]
    onRatingUpdate: () => void
}

export default function StudentInsightsTab({ topPerformers, attentionNeeded, onRatingUpdate }: StudentInsightsTabProps) {
    const router = useRouter()
    const [expanded, setExpanded] = useState<string | null>(null)
    const [attentionExpanded, setAttentionExpanded] = useState<string | null>(null)
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [contactLoading, setContactLoading] = useState<string | null>(null)
    const [parentalLoading, setParentalLoading] = useState<string | null>(null)
    const [aiSuggestion, setAiSuggestion] = useState<Record<string, string>>({})
    const [aiLoading, setAiLoading] = useState<string | null>(null)
    const [selectedStudentForRating, setSelectedStudentForRating] = useState<TopPerformer | null>(null)
    const [rating, setRating] = useState(0)
    const [feedback, setFeedback] = useState("")
    const [submittingRating, setSubmittingRating] = useState(false)

    const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

    const sendPrivateMessage = async (student: AttentionStudent) => {
        setContactLoading(student.studentId)
        try {
            const msg = `Hi ${student.name}, I noticed you might need some support. Please reach out whenever you're ready to discuss.`
            const res = await fetch("/api/teacher/analytics/contact-student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentUserId: student.userId, message: msg })
            })
            const data = await res.json()
            if (data.success) {
                router.push(`/dashboard/teacher/messages?userId=${student.userId}`)
            } else alert(data.error || "Failed to send")
        } finally { setContactLoading(null) }
    }

    const requestParentalContact = async (student: AttentionStudent) => {
        setParentalLoading(student.studentId)
        try {
            const res = await fetch("/api/teacher/analytics/parental-contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: student.studentId, classId: student.classId, reason: "Student performance needs attention", details: `Student performance rate is ${student.performanceRate}%. Issues: ${student.issues.join(", ")}` })
            })
            const data = await res.json()
            if (data.success) alert("Parental contact request sent!")
            else alert(data.error || "Failed")
        } finally { setParentalLoading(null) }
    }

    const getAiSuggestion = async (student: AttentionStudent) => {
        const key = student.studentId
        if (aiSuggestion[key]) { setAiSuggestion(p => ({ ...p, [key]: "" })); return }
        setAiLoading(key)
        try {
            const res = await fetch("/api/ai-assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: `Give 3 concise actionable suggestions to help a student who has ${student.performanceRate}% overall performance, ${student.examAvg}% exam avg, ${student.attendanceRate}% attendance. Issues: ${student.issues.join(", ")}. Keep it brief.` })
            })
            const data = await res.json()
            setAiSuggestion(p => ({ ...p, [key]: data.response || data.message || "Could not generate suggestions." }))
        } catch { setAiSuggestion(p => ({ ...p, [key]: "AI suggestions unavailable." })) }
        finally { setAiLoading(null) }
    }

    const openRatingDialog = (student: TopPerformer) => {
        setSelectedStudentForRating(student)
        setRating(student.teacherRating?.rating || 0)
        setFeedback(student.teacherRating?.feedback || "")
    }

    const generateReport = () => {
        const topCount = topPerformers.length
        const attentionCount = attentionNeeded.length
        const avgGrade = topPerformers.length > 0 
            ? Math.round(topPerformers.reduce((acc, s) => acc + s.examAvg, 0) / topPerformers.length) 
            : 0

        const message = `Please generate a comprehensive academic report based on the following insights:
- ${topCount} Top Performers with an average exam score of ${avgGrade}%.
- ${attentionCount} Students requiring intervention due to low attendance or grades.
Please analyze the current class velocity and suggest specific teaching adjustments for the coming week.`

        router.push(`/dashboard/teacher/ai-assistant?message=${encodeURIComponent(message)}`)
    }

    const handleAiAid = (student: AttentionStudent) => {
        const message = `I need an intervention strategy for ${student.name} in my ${student.className} class. 
Current Stats:
- Overall Performance: ${student.performanceRate}%
- Exam Average: ${student.examAvg}%
- Attendance: ${student.attendanceRate}%
Core Issues identified: ${student.issues.join(", ")}.
Please provide a structured plan to support this student.`

        router.push(`/dashboard/teacher/ai-assistant?message=${encodeURIComponent(message)}`)
    }

    const handleSubmitRating = async () => {
        if (!selectedStudentForRating || !rating) return
        setSubmittingRating(true)
        try {
            const res = await fetch("/api/teacher/analytics/student-rating", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    studentId: selectedStudentForRating.studentId, 
                    classId: selectedStudentForRating.classId, 
                    rating, 
                    feedback 
                })
            })
            const data = await res.json()
            if (data.success) {
                onRatingUpdate()
                setSelectedStudentForRating(null)
            } else alert(data.error || "Failed to save")
        } finally { setSubmittingRating(false) }
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Top Insight Banner */}
            <div className="p-8 rounded-[2rem] bg-[#A855F7]/10 border border-[#A855F7]/20 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles className="w-48 h-48 text-[#A855F7]" />
                </div>
                <div className="p-4 rounded-2xl bg-[#A855F7]/20 border border-[#A855F7]/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                    <Lightbulb className="w-8 h-8 text-[#A855F7]" />
                </div>
                <div className="flex-1 text-center md:text-left relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Class Performance Insights</h3>
                    <p className="text-[13px] text-[#A855F7] font-medium leading-relaxed max-w-2xl">
                        Based on recent performance data, your students are showing a <span className="text-white font-bold">12% improvement</span> in assignment completion rate. 
                        Recommended focus: Review "Algebraic Fundamentals" with Morning Section A.
                    </p>
                </div>
                <Button className="bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] h-10 px-6 rounded-full shrink-0 relative z-10" onClick={generateReport}>
                    Generate AI Report
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                            <Trophy className="w-5 h-5 text-[#9A9A9A]" />
                        </div>
                        <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Top Performers</h3>
                    </div>

                    <div className="space-y-3">
                        {topPerformers.length === 0 ? (
                            <p className="text-center py-12 text-[#444] text-xs font-bold uppercase tracking-widest">No candidates found</p>
                        ) : topPerformers.map(s => (
                            <div key={`${s.studentId}-${s.classId}`} className="rounded-2xl border border-white/8 bg-[#161616] overflow-hidden group hover:border-white/20 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.04)] relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-white opacity-0 group-hover:opacity-60 transition-opacity" />
                                <div 
                                    className="p-5 flex items-center gap-4 cursor-pointer"
                                    onClick={() => setExpanded(expanded === `${s.studentId}-${s.classId}` ? null : `${s.studentId}-${s.classId}`)}
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center font-bold text-white text-xs shrink-0 ring-1 ring-white/15">
                                        #{s.rank}
                                    </div>
                                    <Avatar className="h-10 w-10 border border-[#1C1C1C] group-hover:border-white/20 transition-all rounded-xl">
                                        <AvatarImage src={s.image || undefined} />
                                        <AvatarFallback className="bg-[#000] text-[#A855F7] font-bold text-xs">{getInitials(s.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white group-hover:text-white transition-colors tracking-tight">{s.name}</p>
                                        <p className="text-[10px] text-[#555] font-bold uppercase truncate tracking-widest">{s.className}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-bold text-white leading-none tracking-tight">{s.performanceRate}%</p>
                                        <p className="text-[9px] text-[#444] font-bold uppercase mt-1 tracking-tighter">Progress</p>
                                    </div>
                                    {expanded === `${s.studentId}-${s.classId}` ? <ChevronUp className="w-4 h-4 text-[#444]" /> : <ChevronDown className="w-4 h-4 text-[#444]" />}
                                </div>
                                {expanded === `${s.studentId}-${s.classId}` && (
                                    <div className="px-5 pb-5 pt-0 space-y-5 border-t border-white/5 bg-[#000]/20">
                                        <div className="grid grid-cols-3 gap-3 pt-5">
                                            <div className="p-3 rounded-xl bg-[#000] border border-white/5 text-center">
                                                <p className="text-[9px] text-[#555] font-black uppercase mb-1">Exam Avg</p>
                                                <p className="text-sm font-bold text-white">{s.examAvg}%</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-[#000] border border-white/5 text-center">
                                                <p className="text-[9px] text-[#555] font-black uppercase mb-1">Attend</p>
                                                <p className="text-sm font-bold text-white">{s.attendanceRate}%</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/8 text-center">
                                                <p className="text-[9px] text-[#9A9A9A] font-black uppercase mb-1 text-opacity-60">Performance</p>
                                                <p className="text-sm font-black text-white">EXCELLENT</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            {s.teacherRating ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FACC15]/10 border border-[#FACC15]/20">
                                                    <Star className="w-3 h-3 text-[#FACC15] fill-[#FACC15]" />
                                                    <span className="text-[10px] text-[#FACC15] font-black">{s.teacherRating.rating}/5 Evaluation</span>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest px-1">Eval Pending</div>
                                            )}
                                            <Button 
                                                size="sm" 
                                                className="bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[9px] h-8 px-4 rounded-full"
                                                onClick={() => openRatingDialog(s)}
                                            >
                                                {s.teacherRating ? "Update Review" : "Rate Student"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attention Needed Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2.5 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20">
                            <AlertTriangle className="w-4 h-4 text-[#F87171]" />
                        </div>
                        <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Support Required</h3>
                    </div>

                    <div className="space-y-3">
                        {attentionNeeded.length === 0 ? (
                            <p className="text-center py-12 text-[#444] text-xs font-bold uppercase tracking-widest">All systems nominal</p>
                        ) : attentionNeeded.map(s => (
                            <div key={`${s.studentId}-${s.classId}`} className="rounded-2xl border border-[#F87171]/20 bg-[#161616] overflow-hidden group hover:border-[#F87171]/50 transition-all hover:shadow-[0_0_20px_rgba(248,113,113,0.05)] relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#F87171] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div 
                                    className="p-5 flex items-center gap-4 cursor-pointer"
                                    onClick={() => setAttentionExpanded(attentionExpanded === `${s.studentId}-${s.classId}` ? null : `${s.studentId}-${s.classId}`)}
                                >
                                    <Avatar className="h-10 w-10 border border-[#1C1C1C] group-hover:border-[#F87171]/40 transition-all rounded-xl">
                                        <AvatarImage src={s.image || undefined} />
                                        <AvatarFallback className="bg-[#000] text-[#F87171] font-bold text-xs">{getInitials(s.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white group-hover:text-[#F87171] transition-colors tracking-tight">{s.name}</p>
                                        <div className="flex gap-1 mt-1">
                                            {s.issues.slice(0, 2).map((issue, i) => (
                                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#F87171]/10 text-[#F87171] font-bold uppercase tracking-tighter">{issue}</span>
                                            ))}
                                            {s.issues.length > 2 && <span className="text-[9px] text-[#444] pt-0.5">+{s.issues.length - 2} more</span>}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-bold text-[#F87171] leading-none tracking-tight">{s.performanceRate}%</p>
                                        <p className="text-[9px] text-[#444] font-bold uppercase mt-1 tracking-tighter">Low Performance</p>
                                    </div>
                                    {attentionExpanded === `${s.studentId}-${s.classId}` ? <ChevronUp className="w-4 h-4 text-[#444]" /> : <ChevronDown className="w-4 h-4 text-[#444]" />}
                                </div>
                                {attentionExpanded === `${s.studentId}-${s.classId}` && (
                                    <div className="px-5 pb-5 pt-0 space-y-5 border-t border-[#F87171]/10 bg-[#F87171]/5">
                                        <div className="pt-5 space-y-4">
                                            <div className="relative group">
                                                <Target className="absolute left-3 top-3 w-4 h-4 text-[#444] group-focus-within:text-[#F87171] transition-colors" />
                                                <Textarea
                                                    placeholder="Add notes or intervention plan..."
                                                    value={notes[`attention-${s.studentId}-${s.classId}`] || ""}
                                                    onChange={e => setNotes(p => ({ ...p, [`attention-${s.studentId}-${s.classId}`]: e.target.value }))}
                                                    className="pl-10 min-h-[80px] bg-[#000] border-white/5 focus:border-[#F87171]/40 text-xs text-white p-3 resize-none transition-all"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                <Button size="sm" variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-transparent border-white/5 hover:bg-white/5 text-[#CCC] gap-2 h-9" onClick={() => window.location.href = `mailto:${s.email}`}>
                                                    <Mail className="w-3 h-3 text-[#3B82F6]" /> Email
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-transparent border-white/5 hover:bg-white/5 text-[#CCC] gap-2 h-9" disabled={contactLoading === s.studentId} onClick={() => sendPrivateMessage(s)}>
                                                    {contactLoading === s.studentId ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3 text-[#A855F7]" />} PM
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-transparent border-white/5 hover:bg-white/5 text-[#CCC] gap-2 h-9" onClick={() => handleAiAid(s)}>
                                                    <Bot className="w-3 h-3 text-[#FB923C]" /> AI Assistance
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-transparent border-white/5 hover:bg-white/5 text-[#CCC] gap-2 h-9" disabled={parentalLoading === s.studentId} onClick={() => requestParentalContact(s)}>
                                                    {parentalLoading === s.studentId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Phone className="w-5 h-5 text-[#9A9A9A]" />} Parent
                                                </Button>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                className="w-full text-[9px] font-black uppercase tracking-widest bg-[#A855F7] hover:bg-[#A855F7]/90 text-white gap-2 h-10 shadow-[0_4px_12px_rgba(168,85,247,0.2)]" 
                                                disabled={aiLoading === s.studentId} 
                                                onClick={() => getAiSuggestion(s)}
                                            >
                                                {aiLoading === s.studentId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                {aiSuggestion[s.studentId] ? "Hide AI Analysis" : "Get AI Suggestions"}
                                            </Button>
                                            {aiSuggestion[s.studentId] && (
                                                <div className="p-4 rounded-xl bg-[#000] border border-[#A855F7]/20 text-[11px] text-[#CCC] leading-relaxed relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                                        <Zap className="w-8 h-8 text-[#A855F7]" />
                                                    </div>
                                                    <p className="font-black text-[#A855F7] uppercase text-[9px] mb-2 tracking-widest">AI Analysis:</p>
                                                    {aiSuggestion[s.studentId]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Rating Dialog */}
            <Dialog open={!!selectedStudentForRating} onOpenChange={() => setSelectedStudentForRating(null)}>
                <DialogContent className="max-w-md bg-[#000] border-[#1C1C1C] p-0 overflow-hidden rounded-[2.5rem]">
                    <div className="p-8 bg-[#A855F7]/10 border-b border-[#1C1C1C] relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Trophy className="w-16 h-16 text-[#A855F7]" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-white text-xl font-bold flex items-center gap-3 tracking-tight">
                                <Target className="w-6 h-6 text-[#A855F7]" /> Student Review
                            </DialogTitle>
                            <DialogDescription className="text-[#555] text-[11px] font-bold uppercase tracking-widest mt-1">Submit detailed review for {selectedStudentForRating?.name}</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="space-y-4 text-center">
                            <p className="text-[10px] font-black text-[#555] uppercase tracking-widest">Rate Student Performance</p>
                            <div className="flex items-center justify-center gap-4">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                        className={cn(
                                            "transition-all transform hover:scale-125",
                                            rating >= star ? "text-[#FACC15] drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-[#1C1C1C]"
                                        )}
                                    >
                                        <Star className={cn("w-10 h-10", rating >= star ? "fill-[#FACC15]" : "fill-transparent")} />
                                    </button>
                                ))}
                            </div>
                             <p className="text-[11px] font-bold text-[#A855F7] tracking-widest uppercase">
                                {rating === 5 ? "OUTSTANDING PERFORMANCE" : rating === 4 ? "EXCEEDS EXPECTATIONS" : rating === 3 ? "STABLE PROGRESS" : rating === 2 ? "NEEDS IMPROVEMENT" : rating === 1 ? "CRITICAL SUPPORT" : "SELECT RATING"}
                            </p>
                        </div>

                         <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black text-[#555] uppercase tracking-widest">Detailed Feedback</p>
                                <span className="text-[9px] text-[#444] font-medium italic">Max 500 characters</span>
                            </div>
                            <Textarea
                                placeholder="Example: Exceptional grasp of abstract concepts during practical labs..."
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                className="min-h-[140px] bg-[#080808] border-white/5 focus:border-[#A855F7]/40 text-sm leading-relaxed p-4 resize-none transition-all"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button variant="outline" onClick={() => setSelectedStudentForRating(null)} className="flex-1 bg-transparent border-white/5 hover:bg-white/5 text-white font-black uppercase tracking-widest text-[10px] h-12">Discard</Button>
                             <Button
                                className="flex-1 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[10px] h-12 shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
                                onClick={handleSubmitRating}
                                disabled={submittingRating || rating === 0}
                            >
                                {submittingRating ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : "Submit Review"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
