"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertTriangle, Search, Clock, CheckCircle, XCircle, Eye,
    BookOpen, Users, MessageSquare, Loader2, RefreshCw, FileText,
    Trash2, Send
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface StudentIssue {
    id: string; category: string; title: string; description: string
    status: string; priority: string; entityType: string | null; teacherNote: string | null
    createdAt: string; resolvedAt: string | null
    student: { id: string; user: { id: string; name: string; email: string; image: string | null } }
    class: { name: string; code: string } | null
}

interface Summary { categoryCounts: Record<string, number>; statusCounts: Record<string, number> }

const CATEGORIES = ["all", "ATTENDANCE", "ASSIGNMENT", "TUTOR", "MESSAGE", "GENERAL"]
const STATUSES = ["all", "OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]

const categoryIcon = (cat: string) => {
    switch (cat) {
        case "ATTENDANCE": return <Clock className="w-3.5 h-3.5" />
        case "ASSIGNMENT": return <BookOpen className="w-3.5 h-3.5" />
        case "TUTOR": return <Users className="w-3.5 h-3.5" />
        case "MESSAGE": return <MessageSquare className="w-3.5 h-3.5" />
        default: return <FileText className="w-3.5 h-3.5" />
    }
}

const priorityColor = (p: string) => {
    if (p === "HIGH") return "bg-red-500/15 text-red-400 border-red-500/20 border"
    if (p === "MEDIUM") return "bg-amber-500/15 text-amber-400 border-amber-500/20 border"
    return "bg-[#252525] text-[#9A9A9A] border-[#333] border"
}

const statusColor = (s: string) => {
    if (s === "RESOLVED") return "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20 border"
    if (s === "OPEN") return "bg-red-500/15 text-red-400 border-red-500/20 border"
    if (s === "IN_REVIEW") return "bg-blue-500/15 text-blue-400 border-blue-500/20 border"
    return "bg-[#252525] text-[#9A9A9A] border-[#333] border"
}

const categoryColor = (cat: string) => {
    switch (cat) {
        case "ATTENDANCE": return "bg-purple-500/15 text-purple-400 border-purple-500/20 border"
        case "ASSIGNMENT": return "bg-blue-500/15 text-blue-400 border-blue-500/20 border"
        case "TUTOR": return "bg-orange-500/15 text-orange-400 border-orange-500/20 border"
        case "MESSAGE": return "bg-teal-500/15 text-teal-400 border-teal-500/20 border"
        default: return "bg-[#252525] text-[#9A9A9A] border-[#333] border"
    }
}

export default function TeacherReportsPage() {
    const { toast } = useToast()
    const router = useRouter()
    const [issues, setIssues] = useState<StudentIssue[]>([])
    const [summary, setSummary] = useState<Summary>({ categoryCounts: {}, statusCounts: {} })
    const [loading, setLoading] = useState(true)
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [selectedIssue, setSelectedIssue] = useState<StudentIssue | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [resolveNote, setResolveNote] = useState("")
    const [resolving, setResolving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const fetchIssues = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (categoryFilter !== "all") params.set("category", categoryFilter)
            if (statusFilter !== "all") params.set("status", statusFilter)
            const res = await fetch(`/api/teacher/reports?${params}`)
            const data = await res.json()
            if (data.success) {
                setIssues(data.data.issues)
                setSummary({ categoryCounts: data.data.categoryCounts, statusCounts: data.data.statusCounts })
            }
        } finally { setLoading(false) }
    }, [categoryFilter, statusFilter])

    useEffect(() => { fetchIssues() }, [fetchIssues])

    const updateIssue = async (issueId: string, status: string, note?: string) => {
        setResolving(true)
        try {
            const res = await fetch(`/api/teacher/reports/${issueId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, teacherNote: note || resolveNote })
            })
            const data = await res.json()
            if (data.success) {
                toast({ title: "Issue Updated", description: `Status set to ${status}` })
                setDialogOpen(false)
                setResolveNote("")
                fetchIssues()
            }
        } finally { setResolving(false) }
    }

    const deleteIssue = async (issueId: string) => {
        if (!confirm("Are you sure you want to delete this report? This action cannot be undone.")) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/teacher/reports/${issueId}/delete`, { method: "DELETE" })
            const data = await res.json()
            if (data.success) {
                toast({ title: "Report Deleted", description: "The student report has been removed." })
                setDialogOpen(false)
                fetchIssues()
            } else {
                toast({ title: "Error", description: data.error || "Failed to delete report", variant: "destructive" })
            }
        } finally { setDeleting(false) }
    }

    const messageStudent = (studentUserId: string) => {
        router.push(`/dashboard/teacher/messages?userId=${studentUserId}`)
    }

    const openDetail = (issue: StudentIssue) => {
        setSelectedIssue(issue)
        setResolveNote(issue.teacherNote || "")
        setDialogOpen(true)
    }

    const filtered = issues.filter(i => {
        if (!search) return true
        const q = search.toLowerCase()
        return i.title.toLowerCase().includes(q) || i.student.user.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    })

    const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

    const summaryStats = [
        { label: "Total Reports", value: issues.length, icon: FileText, color: "text-blue-600" },
        { label: "Open", value: summary.statusCounts["OPEN"] || 0, icon: AlertTriangle, color: "text-red-500" },
        { label: "In Review", value: summary.statusCounts["IN_REVIEW"] || 0, icon: Eye, color: "text-blue-500" },
        { label: "Resolved", value: summary.statusCounts["RESOLVED"] || 0, icon: CheckCircle, color: "text-green-500" },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Student Reports</h1>
                    <p className="text-[#9A9A9A] mt-1">Issues raised by students in your classes</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchIssues} className="self-start">
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryStats.map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <s.icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
                            <div>
                                <p className="text-2xl font-bold text-white">{s.value}</p>
                                <p className="text-xs text-[#9A9A9A]">{s.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Category tabs */}
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
                        {CATEGORIES.map(cat => (
                            <TabsTrigger key={cat} value={cat} className="capitalize text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                {cat === "all" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                                {cat !== "all" && summary.categoryCounts[cat] ? ` (${summary.categoryCounts[cat]})` : ""}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="flex gap-2 sm:ml-auto">
                        <div className="relative flex-1 sm:w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 bg-[#161616] border-[#1C1C1C] text-sm" />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-36 bg-[#161616] border-[#1C1C1C] text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1F1F1F] border-[#1C1C1C]">
                                {STATUSES.map(s => <SelectItem key={s} value={s} className="text-sm capitalize">{s === "all" ? "All Status" : s.replace("_", " ")}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {CATEGORIES.map(cat => (
                    <TabsContent key={cat} value={cat}>
                        {loading ? (
                            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                        ) : filtered.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center py-16 gap-3">
                                    <FileText className="w-10 h-10 text-[#555] mx-auto mb-2" />
                                    <p className="text-[#9A9A9A]">No reports found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map(issue => (
                                    <Card key={issue.id} className={`border-l-4 ${issue.status === "RESOLVED" ? "border-l-green-500" : issue.priority === "HIGH" ? "border-l-red-500" : issue.status === "IN_REVIEW" ? "border-l-blue-500" : "border-l-yellow-500"} bg-[#1F1F1F] border-[#1C1C1C] dark:border-l-current`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10 flex-shrink-0">
                                                    <AvatarImage src={issue.student.user.image || undefined} />
                                                    <AvatarFallback className="text-xs">{getInitials(issue.student.user.name)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                                        <div>
                                                            <p className="font-semibold text-white">{issue.title}</p>
                                                            <p className="text-xs text-[#9A9A9A]">{issue.student.user.name} · {issue.student.user.email}</p>
                                                        </div>
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            <Badge className={`text-[10px] gap-1 ${categoryColor(issue.category)}`}>
                                                                {categoryIcon(issue.category)} {issue.category}
                                                            </Badge>
                                                            <Badge className={`text-[10px] ${priorityColor(issue.priority)}`}>{issue.priority}</Badge>
                                                            <Badge className={`text-[10px] ${statusColor(issue.status)}`}>{issue.status.replace("_", " ")}</Badge>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-[#9A9A9A] mt-2 line-clamp-2">{issue.description}</p>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                                            {issue.class && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{issue.class.code}</span>}
                                                            <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                                                            {issue.entityType && <span className="text-blue-500">📎 {issue.entityType}</span>}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {issue.status === "OPEN" && (
                                                                <Button size="sm" variant="outline" className="text-xs h-7 border-[#252525] text-[#D4D4D4] hover:text-white" onClick={() => updateIssue(issue.id, "IN_REVIEW")}>
                                                                    Mark In Review
                                                                </Button>
                                                            )}
                                                            <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700" onClick={() => openDetail(issue)}>
                                                                <Eye className="w-3 h-3 mr-1" /> View & Respond
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Issue Detail Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-[#1F1F1F] border-[#1C1C1C]">
                    {selectedIssue && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={selectedIssue.student.user.image || undefined} />
                                        <AvatarFallback>{getInitials(selectedIssue.student.user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <DialogTitle className="text-white">{selectedIssue.title}</DialogTitle>
                                        <p className="text-xs text-[#9A9A9A]">{selectedIssue.student.user.name} · {selectedIssue.student.user.email}</p>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                                <div className="flex gap-2 flex-wrap">
                                    <Badge className={`text-xs gap-1 ${categoryColor(selectedIssue.category)}`}>
                                        {categoryIcon(selectedIssue.category)} {selectedIssue.category}
                                    </Badge>
                                    <Badge className={`text-xs ${priorityColor(selectedIssue.priority)}`}>{selectedIssue.priority} Priority</Badge>
                                    <Badge className={`text-xs ${statusColor(selectedIssue.status)}`}>{selectedIssue.status.replace("_", " ")}</Badge>
                                    {selectedIssue.class && <Badge variant="outline" className="text-xs border-[#252525] text-[#D4D4D4]">{selectedIssue.class.name}</Badge>}
                                </div>

                                {selectedIssue.entityType && (
                                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
                                        📎 Related to: <strong>{selectedIssue.entityType}</strong>
                                    </div>
                                )}

                                <div>
                                    <Label className="text-xs font-medium text-[#9A9A9A] uppercase tracking-wider">Issue Description</Label>
                                    <div className="mt-1.5 p-3 rounded-lg bg-[#161616] border border-[#252525] text-sm text-[#D4D4D4] whitespace-pre-wrap">
                                        {selectedIssue.description}
                                    </div>
                                </div>

                                <div className="text-xs text-gray-400">
                                    Raised {formatDistanceToNow(new Date(selectedIssue.createdAt), { addSuffix: true })}
                                    {selectedIssue.resolvedAt && ` · Resolved ${formatDistanceToNow(new Date(selectedIssue.resolvedAt), { addSuffix: true })}`}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[#D4D4D4]">Your Response / Resolution Note</Label>
                                    <Textarea
                                        placeholder="Explain the resolution, actions taken, or feedback for the student..."
                                        value={resolveNote}
                                        onChange={e => setResolveNote(e.target.value)}
                                        rows={3}
                                        className="bg-[#161616] border-[#1C1C1C]"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="flex-wrap gap-2 sm:justify-between w-full">
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => messageStudent(selectedIssue.student.user.id)}>
                                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Message Student
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" disabled={deleting} onClick={() => deleteIssue(selectedIssue.id)}>
                                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                                        Delete
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    {selectedIssue.status !== "RESOLVED" && selectedIssue.status !== "CLOSED" && (
                                        <>
                                            {selectedIssue.status === "OPEN" && (
                                                <Button variant="outline" size="sm" className="border-[#252525] text-[#D4D4D4] hover:text-white" disabled={resolving} onClick={() => updateIssue(selectedIssue.id, "IN_REVIEW")}>
                                                    Mark In Review
                                                </Button>
                                            )}
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={resolving} onClick={() => updateIssue(selectedIssue.id, "RESOLVED")}>
                                                {resolving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                                                Mark Resolved
                                            </Button>
                                        </>
                                    )}
                                    {resolveNote !== (selectedIssue.teacherNote || "") && (
                                        <Button size="sm" variant="outline" disabled={resolving} className="border-[#252525] text-[#D4D4D4] hover:text-white" onClick={() => updateIssue(selectedIssue.id, selectedIssue.status)}>
                                            {resolving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                            Save Note
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
