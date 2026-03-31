"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Plus, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DatetimePicker as DateTimePicker } from "@/components/ui/datetime-picker"
import { cn } from "@/lib/utils"

interface Question {
    id?: string
    question: string
    type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER"
    options: string[]
    correctAnswer: string
    marks: number
}

interface ClassOption {
    id: string
    name: string
    code: string
}

interface CreateExamDialogProps {
    examId?: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    classes: ClassOption[]
    onSuccess: () => void
}

export function CreateExamDialog({ examId, open, onOpenChange, classes, onSuccess }: CreateExamDialogProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [newExam, setNewExam] = useState({
        title: "",
        description: "",
        classId: "",
        type: "QUIZ" as const,
        duration: 60,
        totalMarks: 100,
        passingMarks: 40,
        startTime: "",
        endTime: "",
        shuffleQuestions: true,
        showResults: true,
    })

    // Question Builder State
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestion, setCurrentQuestion] = useState<Question>({
        question: "",
        type: "MCQ",
        options: ["", "", "", ""],
        correctAnswer: "",
        marks: 5
    })
    const [isAddingQuestion, setIsAddingQuestion] = useState(false)

    // Fetch exam data for editing
    useEffect(() => {
        if (open && examId) {
            setFetching(true)
            fetch(`/api/teacher/exams/${examId}`)
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        const data = res.data
                        setNewExam({
                            title: data.title,
                            description: data.description || "",
                            classId: data.classId,
                            type: data.type,
                            duration: data.duration,
                            totalMarks: data.totalMarks,
                            passingMarks: data.passingMarks || 0,
                            startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "",
                            endTime: data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "",
                            shuffleQuestions: data.shuffleQuestions,
                            showResults: data.showResults,
                        })
                        // Load questions if any (for creation mode if we ever switch back, or just to have them)
                        if (data.questions) {
                            setQuestions(data.questions.map((q: any) => ({
                                ...q,
                                options: q.options ? JSON.parse(q.options) : [],
                                correctAnswer: q.answer
                            })))
                        }
                    }
                })
                .catch(err => console.error("Failed to fetch exam", err))
                .finally(() => setFetching(false))
        } else if (open && !examId) {
            // Reset state for new exam
            setNewExam({
                title: "",
                description: "",
                classId: "",
                type: "QUIZ",
                duration: 60,
                totalMarks: 100,
                passingMarks: 40,
                startTime: "",
                endTime: "",
                shuffleQuestions: true,
                showResults: true,
            })
            setQuestions([])
        }
    }, [open, examId])

    const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null)

    const handleAddQuestion = () => {
        if (!currentQuestion.question || !currentQuestion.marks) {
            toast({ title: "Error", description: "Question and marks are required", variant: "destructive" })
            return
        }

        if (currentQuestion.type === "MCQ" && currentQuestion.options.some(o => !o)) {
            toast({ title: "Error", description: "All options must be filled for MCQ", variant: "destructive" })
            return
        }

        if (editingQuestionIdx !== null) {
            const updatedQuestions = [...questions]
            updatedQuestions[editingQuestionIdx] = currentQuestion
            setQuestions(updatedQuestions)
            setEditingQuestionIdx(null)
        } else {
            setQuestions([...questions, currentQuestion])
        }

        setCurrentQuestion({
            question: "",
            type: "MCQ",
            options: ["", "", "", ""],
            correctAnswer: "",
            marks: 5
        })
        setIsAddingQuestion(false)
    }

    const startEditingQuestion = (idx: number) => {
        setCurrentQuestion(questions[idx])
        setEditingQuestionIdx(idx)
        setIsAddingQuestion(true)
    }

    const handleSubmit = async () => {
        if (!newExam.title || !newExam.classId || !newExam.startTime || !newExam.endTime) {
            toast({
                title: "Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            })
            return
        }

        // Skip question validation for edit mode as questions are managed separately
        if (!examId && questions.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one question.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)
        try {
            const url = examId ? `/api/teacher/exams/${examId}` : "/api/teacher/exams"
            const method = examId ? "PATCH" : "POST"

            // processing...
            const payload: any = { ...newExam, questions }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            const result = await res.json()

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Exam ${examId ? "updated" : "created"} successfully!`,
                })
                if (!examId) {
                    setNewExam({
                        title: "",
                        description: "",
                        classId: "",
                        type: "QUIZ",
                        duration: 60,
                        totalMarks: 100,
                        passingMarks: 40,
                        startTime: "",
                        endTime: "",
                        shuffleQuestions: true,
                        showResults: true,
                    })
                    setQuestions([])
                }
                onSuccess()
                onOpenChange(false)
            } else {
                toast({
                    title: "Error",
                    description: result.error || `Failed to ${examId ? "update" : "create"} exam`,
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to ${examId ? "update" : "create"} exam`,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#161616] border-[#1C1C1C] sm:rounded-xl">
                <DialogHeader className="px-1 text-left">
                    <DialogTitle className="text-xl font-bold text-white">{examId ? "Edit Exam" : "Create New Exam"}</DialogTitle>
                    <DialogDescription className="text-[#9A9A9A]">
                        {examId ? "Update exam details and questions" : "Set up a new exam or quiz with questions"}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {fetching && <div className="text-center">Loading exam data...</div>}
                    {!fetching && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#9A9A9A] font-medium">Title *</Label>
                                    <Input
                                        value={newExam.title}
                                        onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                                        placeholder="Exam title"
                                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-white/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#9A9A9A] font-medium">Class *</Label>
                                    <Select
                                        value={newExam.classId}
                                        onValueChange={(value) => setNewExam({ ...newExam, classId: value })}
                                    >
                                        <SelectTrigger className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20">
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1F1F1F] border-[#1C1C1C] text-white">
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id} className="hover:bg-white/5 cursor-pointer">{c.name} ({c.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#9A9A9A] font-medium">Description</Label>
                                <Textarea
                                    value={newExam.description}
                                    onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                                    placeholder="Instructions for students..."
                                    className="bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-white/20 min-h-[100px] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#9A9A9A] font-medium">Type</Label>
                                    <Select
                                        value={newExam.type}
                                        onValueChange={(value: any) => setNewExam({ ...newExam, type: value })}
                                    >
                                        <SelectTrigger className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1F1F1F] border-[#1C1C1C] text-white">
                                            <SelectItem value="QUIZ">Quiz</SelectItem>
                                            <SelectItem value="MIDTERM">Midterm</SelectItem>
                                            <SelectItem value="FINAL">Final</SelectItem>
                                            <SelectItem value="PRACTICE">Practice</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#9A9A9A] font-medium">Duration (min)</Label>
                                    <Input
                                        type="number"
                                        value={newExam.duration}
                                        onChange={(e) => setNewExam({ ...newExam, duration: parseInt(e.target.value) })}
                                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#9A9A9A] font-medium">Total Marks</Label>
                                    <Input
                                        type="number"
                                        value={newExam.totalMarks}
                                        onChange={(e) => setNewExam({ ...newExam, totalMarks: parseInt(e.target.value) })}
                                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#9A9A9A] font-medium">Passing Marks</Label>
                                    <Input
                                        type="number"
                                        value={newExam.passingMarks}
                                        onChange={(e) => setNewExam({ ...newExam, passingMarks: parseInt(e.target.value) })}
                                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#9A9A9A] font-medium">Start Date *</Label>
                                    <DateTimePicker
                                        date={newExam.startTime ? new Date(newExam.startTime) : undefined}
                                        setDate={(date) => {
                                            if (date) {
                                                setNewExam({ ...newExam, startTime: date.toISOString() })
                                            } else {
                                                setNewExam({ ...newExam, startTime: "" })
                                            }
                                        }}
                                        placeholder="Pick start date & time"
                                        className="w-full bg-[#1F1F1F] border-[#1C1C1C] text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#9A9A9A] font-medium">End Date *</Label>
                                    <DateTimePicker
                                        date={newExam.endTime ? new Date(newExam.endTime) : undefined}
                                        setDate={(date) => {
                                            if (date) {
                                                setNewExam({ ...newExam, endTime: date.toISOString() })
                                            } else {
                                                setNewExam({ ...newExam, endTime: "" })
                                            }
                                        }}
                                        placeholder="Pick end date & time"
                                        className="w-full bg-[#1F1F1F] border-[#1C1C1C] text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-[#1C1C1C]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-white font-medium">Shuffle Questions</Label>
                                        <p className="text-xs text-[#9A9A9A]">Randomize question order for each student</p>
                                    </div>
                                    <Switch
                                        checked={newExam.shuffleQuestions}
                                        onCheckedChange={(v) => setNewExam({ ...newExam, shuffleQuestions: v })}
                                        className="data-[state=checked]:bg-white"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-white font-medium">Show Results</Label>
                                        <p className="text-xs text-[#9A9A9A]">Allow students to see results after submission</p>
                                    </div>
                                    <Switch
                                        checked={newExam.showResults}
                                        onCheckedChange={(v) => setNewExam({ ...newExam, showResults: v })}
                                        className="data-[state=checked]:bg-white"
                                    />
                                </div>
                            </div>

                            {/* Questions Section */}
                            <div className="border-t border-[#1C1C1C] pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white">Questions ({questions.length})</h3>
                                        <Button 
                                            size="sm" 
                                            onClick={() => setIsAddingQuestion(true)}
                                            className="bg-white hover:bg-white/90 text-black font-semibold rounded-lg border-none shadow-sm h-9 px-4 transition-all active:scale-95"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Question
                                        </Button>
                                    </div>

                                    {isAddingQuestion && (
                                        <Card className="mb-4 border-[#252525] bg-[#1F1F1F]">
                                            <CardContent className="pt-4 space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[#9A9A9A] font-medium">Question Text</Label>
                                                    <Textarea
                                                        value={currentQuestion.question}
                                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                                        placeholder="Enter question text..."
                                                        className="bg-[#161616] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-white/20"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[#9A9A9A] font-medium">Type</Label>
                                                        <Select
                                                            value={currentQuestion.type}
                                                            onValueChange={(value: any) => setCurrentQuestion({ ...currentQuestion, type: value })}
                                                        >
                                                            <SelectTrigger className="bg-[#161616] border-[#1C1C1C] text-white focus:ring-white/20">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                                                                <SelectItem value="MCQ" className="hover:bg-white/5 cursor-pointer">Multiple Choice</SelectItem>
                                                                <SelectItem value="TRUE_FALSE" className="hover:bg-white/5 cursor-pointer">True/False</SelectItem>
                                                                <SelectItem value="SHORT_ANSWER" className="hover:bg-white/5 cursor-pointer">Short Answer</SelectItem>
                                                                <SelectItem value="LONG_ANSWER" className="hover:bg-white/5 cursor-pointer">Long Answer</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[#9A9A9A] font-medium">Marks</Label>
                                                        <Input
                                                            type="number"
                                                            value={currentQuestion.marks}
                                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })}
                                                            className="bg-[#161616] border-[#1C1C1C] text-white focus:ring-white/20"
                                                        />
                                                    </div>
                                                </div>

                                                {currentQuestion.type === "MCQ" && (
                                                    <div className="space-y-2">
                                                        <Label className="text-[#9A9A9A] font-medium">Options</Label>
                                                        {currentQuestion.options.map((option, idx) => (
                                                            <div key={idx} className="flex gap-2">
                                                                <Input
                                                                    value={option}
                                                                    onChange={(e) => {
                                                                        const newOptions = [...currentQuestion.options]
                                                                        newOptions[idx] = e.target.value
                                                                        setCurrentQuestion({ ...currentQuestion, options: newOptions })
                                                                    }}
                                                                    placeholder={`Option ${idx + 1}`}
                                                                    className="bg-[#161616] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-white/20"
                                                                />
                                                                <input
                                                                    type="radio"
                                                                    name="correctAnswer"
                                                                    checked={currentQuestion.correctAnswer === option && option !== ""}
                                                                    onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: option })}
                                                                    className="mt-3 accent-white"
                                                                    aria-label={`Select option ${idx + 1} as correct answer`}
                                                                />
                                                            </div>
                                                        ))}
                                                        <p className="text-xs text-[#9A9A9A]">Select the correct radio button for the right answer.</p>
                                                    </div>
                                                )}

                                                {currentQuestion.type === "TRUE_FALSE" && (
                                                    <div className="space-y-2">
                                                        <Label className="text-[#9A9A9A] font-medium">Correct Answer</Label>
                                                        <Select
                                                            value={currentQuestion.correctAnswer}
                                                            onValueChange={(value) => setCurrentQuestion({ ...currentQuestion, correctAnswer: value })}
                                                        >
                                                            <SelectTrigger className="bg-[#161616] border-[#1C1C1C] text-white focus:ring-white/20">
                                                                <SelectValue placeholder="Select correct answer" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                                                                <SelectItem value="True" className="hover:bg-white/5 cursor-pointer">True</SelectItem>
                                                                <SelectItem value="False" className="hover:bg-white/5 cursor-pointer">False</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" onClick={() => { setIsAddingQuestion(false); setEditingQuestionIdx(null); }} className="text-[#9A9A9A] hover:bg-white/5">Cancel</Button>
                                                    <Button 
                                                        onClick={handleAddQuestion}
                                                        className="bg-white hover:bg-white/90 text-black font-semibold rounded-lg border-none shadow-sm transition-all active:scale-95 px-6 h-9"
                                                    >
                                                        {editingQuestionIdx !== null ? "Confirm" : "Add"}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {questions.map((q, idx) => (
                                            <div key={idx} className="flex items-start justify-between p-4 bg-[#1F1F1F] border border-[#1C1C1C] rounded-xl shadow-sm hover:shadow-md transition-all group">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="secondary" className={cn(
                                                            "text-[10px] px-2 py-0 font-bold border",
                                                            q.type === 'MCQ' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                                q.type === 'TRUE_FALSE' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                                    "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                                        )}>{q.type}</Badge>
                                                        <span className="text-xs font-semibold text-[#666666]">Question {idx + 1}</span>
                                                    </div>
                                                    <p className="font-bold text-white mb-2 leading-relaxed">{q.question}</p>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[11px] font-medium text-[#9A9A9A] bg-[#161616] border border-[#1C1C1C] px-2 py-0.5 rounded-full">{q.marks} Marks</span>
                                                        <span className="text-[11px] font-bold text-[#9A9A9A]">Answer: {q.correctAnswer}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[#9A9A9A] hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => startEditingQuestion(idx)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[#9A9A9A] hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                        </>
                    )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0 border-t border-[#1C1C1C] pt-4 mt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white rounded-xl">Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading || fetching}
                        className="bg-white hover:bg-white/90 text-black font-semibold px-8 h-9 rounded-xl border-none shadow-lg transition-all active:scale-95"
                    >
                        {loading ? "Saving..." : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}
