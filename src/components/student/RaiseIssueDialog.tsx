"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Loader2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export type IssueCategory = "ATTENDANCE" | "ASSIGNMENT" | "TUTOR" | "MESSAGE" | "GENERAL"

interface RaiseIssueDialogProps {
  defaultCategory?: IssueCategory
  defaultTitle?: string
  defaultDescription?: string
  classId?: string
  teacherId?: string
  entityId?: string
  entityType?: string
  trigger?: React.ReactNode
  onSubmitted?: () => void
}

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  ATTENDANCE: "Attendance Issue",
  ASSIGNMENT: "Assignment Issue",
  TUTOR: "Tutor / Teaching Issue",
  MESSAGE: "Message / Communication Issue",
  GENERAL: "General Issue"
}

export function RaiseIssueDialog({
  defaultCategory = "GENERAL",
  defaultTitle = "",
  defaultDescription = "",
  classId,
  teacherId,
  entityId,
  entityType,
  trigger,
  onSubmitted
}: RaiseIssueDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [category, setCategory] = useState<IssueCategory>(defaultCategory)
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState(defaultDescription)
  const [priority, setPriority] = useState("MEDIUM")

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast({ title: "Required fields", description: "Please fill in title and description", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/student/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, description, classId, teacherId, entityId, entityType, priority })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Issue Reported", description: "Your teacher has been notified." })
        setOpen(false)
        setTitle(defaultTitle)
        setDescription(defaultDescription)
        setCategory(defaultCategory)
        setPriority("MEDIUM")
        onSubmitted?.()
      } else {
        toast({ title: "Error", description: data.error || "Failed to submit", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to submit report", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Report Issue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-[#0C0C0C] border-[#1C1C1C] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            Raise an Issue / Report
          </DialogTitle>
          <DialogDescription className="text-[#9A9A9A]">
            Your teacher will be notified and can respond to your report.
            {entityType && entityId && (
              <span className="block mt-1 text-xs">
                Related to: <strong className="text-white">{entityType}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Category</Label>
            <Select value={category} onValueChange={v => setCategory(v as IssueCategory)}>
              <SelectTrigger className="bg-[#1F1F1F] border-[#1C1C1C] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                {(Object.entries(CATEGORY_LABELS) as [IssueCategory, string][]).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-[#1F1F1F] border-[#1C1C1C] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High — Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Title</Label>
            <Input
              placeholder="Brief summary of the issue..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#555] focus:border-[#333]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Description</Label>
            <Textarea
              placeholder="Describe the issue in detail. What happened? What should have happened?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#555] focus:border-[#333] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-[#1C1C1C] pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-white hover:bg-white/90 text-black font-semibold transition-all active:scale-95 border-none"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
              : <><AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> Submit Report</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
