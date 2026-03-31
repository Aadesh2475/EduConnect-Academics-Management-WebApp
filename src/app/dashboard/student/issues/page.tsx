"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RaiseIssueDialog } from "@/components/student/RaiseIssueDialog"
import { AlertTriangle, Clock, CheckCircle, FileText, BookOpen, Users, MessageSquare, RefreshCw, Plus, Trash2, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Issue {
  id: string; category: string; title: string; description: string
  status: string; priority: string; entityType: string | null; teacherNote: string | null
  createdAt: string
  class: { name: string; code: string } | null
}

const priorityBadge = (p: string) => {
  if (p === "HIGH") return "bg-red-500/10 text-red-400 border border-red-500/20"
  if (p === "MEDIUM") return "bg-amber-500/10 text-amber-400 border border-amber-500/20"
  return "bg-white/5 text-[#9A9A9A] border border-white/10"
}

const statusBadge = (s: string) => {
  if (s === "RESOLVED") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
  if (s === "OPEN") return "bg-red-500/10 text-red-400 border border-red-500/20"
  if (s === "IN_REVIEW") return "bg-blue-500/10 text-blue-400 border border-blue-500/20"
  return "bg-white/5 text-[#9A9A9A] border border-white/10"
}

const priorityLeftBorder = (issue: Issue) => {
  if (issue.status === "RESOLVED") return "border-l-emerald-500"
  if (issue.priority === "HIGH") return "border-l-red-500"
  if (issue.priority === "MEDIUM") return "border-l-amber-500"
  return "border-l-[#333]"
}

const categoryIcon = (cat: string) => {
  switch (cat) {
    case "ATTENDANCE": return <Clock className="w-3.5 h-3.5 text-[#9A9A9A]" />
    case "ASSIGNMENT": return <BookOpen className="w-3.5 h-3.5 text-[#9A9A9A]" />
    case "TUTOR": return <Users className="w-3.5 h-3.5 text-[#9A9A9A]" />
    case "MESSAGE": return <MessageSquare className="w-3.5 h-3.5 text-[#9A9A9A]" />
    default: return <FileText className="w-3.5 h-3.5 text-[#9A9A9A]" />
  }
}

export default function StudentIssuesPage() {
  const { toast } = useToast()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("all")
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/student/issues")
      const data = await res.json()
      if (data.success) setIssues(data.data)
    } finally { setLoading(false) }
  }

  const deleteIssue = async (issueId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return
    setDeleting(issueId)
    try {
      const res = await fetch(`/api/student/issues?issueId=${issueId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Issue Deleted", description: "Your report has been removed." })
        fetchIssues()
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete" })
      }
    } finally { setDeleting(null) }
  }

  useEffect(() => { fetchIssues() }, [])

  const categories = ["all", "ATTENDANCE", "ASSIGNMENT", "TUTOR", "MESSAGE", "GENERAL"]
  const filtered = tab === "all" ? issues : issues.filter(i => i.category === tab)

  const stats = [
    { label: "Total Raised", value: issues.length, icon: FileText, iconColor: "text-blue-400", iconBg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Open", value: issues.filter(i => i.status === "OPEN").length, icon: AlertTriangle, iconColor: "text-red-400", iconBg: "bg-red-500/10 border-red-500/20" },
    { label: "In Review", value: issues.filter(i => i.status === "IN_REVIEW").length, icon: Clock, iconColor: "text-blue-400", iconBg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Resolved", value: issues.filter(i => i.status === "RESOLVED").length, icon: CheckCircle, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10 border-emerald-500/20" },
  ]

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">My Reports</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">Issues and reports you have raised to your teachers</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIssues}
            className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <RaiseIssueDialog
            trigger={
              <Button size="sm" className="bg-white hover:bg-white/90 text-black font-semibold transition-all active:scale-95 border-none">
                <Plus className="w-4 h-4 mr-1.5" /> Raise Issue
              </Button>
            }
            onSubmitted={fetchIssues}
          />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, index) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="border-[#1C1C1C] shadow-none hover:border-[#252525] transition-all group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-[#9A9A9A] font-medium">{s.label}</p>
                    <p className="text-3xl font-bold mt-1 text-white">{s.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all group-hover:shadow-lg ${s.iconBg}`}>
                    <s.icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${s.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs + Issues */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1 bg-[#111] border border-[#1C1C1C] p-1 rounded-xl mb-4">
            {categories.map(cat => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="capitalize text-xs text-[#9A9A9A] rounded-lg data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-bold transition-all"
              >
                {cat === "all"
                  ? `All (${issues.length})`
                  : `${cat.charAt(0) + cat.slice(1).toLowerCase()} (${issues.filter(i => i.category === cat).length})`}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat} value={cat} className="mt-0">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-[#1F1F1F] border border-[#1C1C1C] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <Card className="border-[#1C1C1C] shadow-none">
                  <CardContent className="flex flex-col items-center py-16 gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border border-[#1C1C1C] flex items-center justify-center">
                      <FileText className="w-8 h-8 text-[#444]" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold">No reports found</p>
                      <p className="text-sm text-[#555] mt-1">No issues in this category yet</p>
                    </div>
                    <RaiseIssueDialog
                      defaultCategory={cat === "all" ? "GENERAL" : cat as any}
                      onSubmitted={fetchIssues}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filtered.map((issue, index) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`border-l-4 ${priorityLeftBorder(issue)} border-[#1C1C1C] shadow-none hover:bg-white/[0.02] transition-all`}>
                        <CardContent className="p-5">
                          {/* Title row */}
                          <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                            <div className="flex items-center gap-2">
                              {categoryIcon(issue.category)}
                              <p className="font-semibold text-white">{issue.title}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge className={`text-[10px] px-1.5 py-0 ${priorityBadge(issue.priority)}`}>
                                {issue.priority}
                              </Badge>
                              <Badge className={`text-[10px] px-1.5 py-0 ${statusBadge(issue.status)}`}>
                                {issue.status.replace("_", " ")}
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-[#555] hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                disabled={deleting === issue.id}
                                onClick={() => deleteIssue(issue.id)}
                              >
                                {deleting === issue.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-[#9A9A9A] line-clamp-2">{issue.description}</p>

                          {/* Teacher note */}
                          {issue.teacherNote && (
                            <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                              <p className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wider">Teacher Response</p>
                              <p className="text-xs text-blue-300">{issue.teacherNote}</p>
                            </div>
                          )}

                          {/* Footer meta */}
                          <div className="flex items-center gap-3 mt-3 text-xs text-[#555] flex-wrap">
                            {issue.class && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {issue.class.name}
                              </span>
                            )}
                            {issue.entityType && <span>📎 {issue.entityType}</span>}
                            <span className="ml-auto font-medium text-[#444]">
                              {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  )
}
