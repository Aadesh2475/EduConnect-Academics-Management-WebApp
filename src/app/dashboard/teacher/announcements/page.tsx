"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Megaphone,
  Plus,
  Calendar,
  Users,
  Edit2,
  Trash2,
  Eye,
  Send,
  Clock,
  BookOpen,
  Pin
} from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  classId?: string
  isGlobal: boolean
  priority: string
  createdAt: string
  class?: {
    name: string
    code: string
  }
}

export default function TeacherAnnouncementsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    classes: [] as string[],
    isGlobal: false,
    isPinned: false,
  })

  const [availableClasses, setAvailableClasses] = useState<{ id: string, name: string, code: string }[]>([])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/teacher/announcements")
      const data = await res.json()
      if (data.success) {
        setAnnouncements(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes?role=TEACHER")
      const data = await res.json()
      if (data.classes) {
        setAvailableClasses(data.classes.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code
        })))
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
    fetchClasses()
  }, [])

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!newAnnouncement.isGlobal && newAnnouncement.classes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one class or make it a global announcement.",
        variant: "destructive",
      })
      return
    }

    try {
      const payload = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        classIds: newAnnouncement.classes,
        isGlobal: newAnnouncement.isGlobal,
        priority: newAnnouncement.isPinned ? "HIGH" : "NORMAL",
      }

      const res = await fetch("/api/teacher/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: "Announcement posted", description: "Your announcement has been published." })
        setNewAnnouncement({ title: "", content: "", classes: [], isGlobal: false, isPinned: false })
        setIsCreateOpen(false)
        fetchAnnouncements()
      } else {
        toast({ title: "Error", description: data.error || "Failed to post announcement", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/teacher/announcements/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Announcement deleted", description: "The announcement has been removed.", variant: "destructive" })
        fetchAnnouncements()
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete announcement", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    }
  }

  const handleTogglePin = (id: string) => {
    // Schema doesn't support pinning yet, so this is mock for now
    toast({ title: "Coming Soon", description: "Pinning functionality will be available in the next update." })
  }

  const toggleClass = (classCode: string) => {
    if (newAnnouncement.classes.includes(classCode)) {
      setNewAnnouncement({
        ...newAnnouncement,
        classes: newAnnouncement.classes.filter(c => c !== classCode),
      })
    } else {
      setNewAnnouncement({
        ...newAnnouncement,
        classes: [...newAnnouncement.classes, classCode],
      })
    }
  }

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 min-h-screen bg-[#000] -m-6 p-8 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E599]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1C1C1C] pb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Announcements</h1>
          <p className="text-[13px] text-[#555] font-medium uppercase tracking-widest mt-2">
            Create and manage class-wide communication
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 px-4 bg-white hover:bg-white/90 text-black font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all active:scale-95 border-none">
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-[#000] border-[#1C1C1C] p-0 overflow-hidden rounded-[2.5rem]">
            <div className="p-8 bg-[#A855F7]/10 border-b border-[#1C1C1C] relative">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Megaphone className="w-16 h-16 text-[#A855F7]" />
              </div>
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-xl font-bold text-white tracking-tight">Post Announcement</DialogTitle>
                <DialogDescription className="text-[11px] font-bold text-[#555] uppercase tracking-widest mt-1">
                  Publish important updates to your students
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-bold text-[#555] uppercase tracking-widest px-1">Title *</Label>
                <Input
                  id="title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="Essential Topic Title"
                  className="h-12 bg-[#080808] border-[#1C1C1C] focus:border-[#A855F7]/40 text-sm p-4 rounded-xl transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content" className="text-[10px] font-bold text-[#555] uppercase tracking-widest px-1">Message Content *</Label>
                <Textarea
                  id="content"
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Provide detailed instructions or updates here..."
                  className="min-h-[160px] bg-[#080808] border-[#1C1C1C] focus:border-[#A855F7]/40 text-sm leading-relaxed p-4 rounded-xl resize-none transition-all"
                />
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-[#080808] border border-[#1C1C1C]">
                <Label className="text-[10px] font-bold text-[#555] uppercase tracking-widest block mb-1">Target Audience</Label>
                <div className="flex items-center space-x-3 mb-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <Checkbox
                    id="global"
                    checked={newAnnouncement.isGlobal}
                    onCheckedChange={(checked) => setNewAnnouncement({
                      ...newAnnouncement,
                      isGlobal: checked as boolean,
                      classes: checked ? [] : newAnnouncement.classes,
                    })}
                    className="border-white/20 data-[state=checked]:bg-[#A855F7] data-[state=checked]:border-[#A855F7]"
                  />
                  <label htmlFor="global" className="text-xs font-bold text-white uppercase tracking-tight cursor-pointer">
                    Broadcast to All Students
                  </label>
                </div>
                {!newAnnouncement.isGlobal && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableClasses.map((cls) => (
                      <div key={cls.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 group">
                        <Checkbox
                          id={cls.id}
                          checked={newAnnouncement.classes.includes(cls.id)}
                          onCheckedChange={() => toggleClass(cls.id)}
                          className="border-white/20 data-[state=checked]:bg-[#A855F7] data-[state=checked]:border-[#A855F7]"
                        />
                        <label htmlFor={cls.id} className="text-[11px] font-medium text-[#B5B5B5] group-hover:text-white transition-colors cursor-pointer capitalize">
                          {cls.name.toLowerCase()}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 p-1">
                <Checkbox
                  id="pinned"
                  checked={newAnnouncement.isPinned}
                  onCheckedChange={(checked) => setNewAnnouncement({
                    ...newAnnouncement,
                    isPinned: checked as boolean,
                  })}
                  className="border-white/20 data-[state=checked]:bg-[#FB923C] data-[state=checked]:border-[#FB923C]"
                />
                <label htmlFor="pinned" className="text-xs font-bold text-[#555] uppercase tracking-wide cursor-pointer transition-colors hover:text-[#B5B5B5]">
                  Mark as High Priority (Pinned)
                </label>
              </div>
            </div>
            <DialogFooter className="p-8 pt-0 flex gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1 bg-transparent border-[#1C1C1C] hover:bg-white/5 text-white font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl">Discard</Button>
              <Button onClick={handleCreateAnnouncement} className="flex-1 bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-[0_4px_15px_rgba(255,255,255,0.1)]">
                <Send className="w-4 h-4 mr-2" />
                Publish Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#111] border-[#1C1C1C] rounded-[2rem] overflow-hidden group hover:border-[#00E599]/30 transition-all">
          <CardContent className="p-8">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-[#00E599]/10 border border-[#00E599]/20 group-hover:scale-110 transition-transform">
                <Megaphone className="w-6 h-6 text-[#00E599]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white tracking-tight">{announcements.length}</p>
                <p className="text-[11px] font-bold text-[#555] mt-1 uppercase tracking-widest">Total Announcements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#1C1C1C] rounded-[2rem] overflow-hidden group hover:border-[#A855F7]/30 transition-all">
          <CardContent className="p-8">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-[#A855F7]/10 border border-[#A855F7]/20 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-[#A855F7]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white tracking-tight">
                  {availableClasses.length}
                </p>
                <p className="text-[11px] font-bold text-[#555] mt-1 uppercase tracking-widest">Active Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#1C1C1C] rounded-[2rem] overflow-hidden group hover:border-[#3B82F6]/30 transition-all">
          <CardContent className="p-8">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white tracking-tight">
                  {announcements.filter(a => a.isGlobal).length}
                </p>
                <p className="text-[11px] font-bold text-[#555] mt-1 uppercase tracking-widest">Global Broadcasts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#111] border-[#1C1C1C] rounded-[2rem] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-full -mr-12 -mt-12 pointer-events-none" />
        <CardHeader className="p-8 border-b border-[#1C1C1C]">
          <CardTitle className="flex items-center gap-3 text-white text-sm font-bold uppercase tracking-widest">
            <Megaphone className="w-4 h-4 text-[#A855F7]" />
            Post History
          </CardTitle>
          <CardDescription className="text-[11px] text-[#555] font-medium uppercase tracking-tighter mt-1">
            Review and manage published communications
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          {sortedAnnouncements.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-6">
                <Megaphone className="w-10 h-10 text-[#222]" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Zero Activity Detected</h3>
              <p className="text-[11px] font-bold text-[#555] uppercase tracking-widest mt-2">Create your first broadcast to engage your students</p>
            </div>
          ) : (
            sortedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={cn(
                  "p-6 rounded-[1.5rem] border transition-all duration-300 group relative overflow-hidden",
                  announcement.priority === 'HIGH' 
                    ? "bg-[#FB923C]/5 border-[#FB923C]/20 hover:border-[#FB923C]/40" 
                    : "bg-[#000]/40 border-white/5 hover:border-white/10 hover:bg-[#000]/60"
                )}
              >
                {announcement.priority === 'HIGH' && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FB923C]" />
                )}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-white tracking-tight group-hover:text-[#A855F7] transition-colors">{announcement.title}</h3>
                      {announcement.priority === 'HIGH' && (
                        <Badge className="bg-[#FB923C]/20 text-[#FB923C] border-0 text-[9px] font-bold tracking-widest uppercase py-0 px-2 h-5">URGENT</Badge>
                      )}
                    </div>
                    <p className="text-[13px] text-[#B5B5B5] leading-relaxed line-clamp-2">{announcement.content}</p>
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                        <Clock className="w-3 h-3 text-[#555]" />
                        <span className="text-[10px] text-[#555] font-bold uppercase tracking-widest">
                          {new Date(announcement.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {announcement.isGlobal ? (
                          <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-0 text-[9px] font-bold tracking-widest uppercase px-3">GLOBAL ACCESS</Badge>
                        ) : (
                          announcement.class && (
                            <Badge className="bg-[#A855F7]/10 text-[#A855F7] border-0 text-[9px] font-bold tracking-widest uppercase px-3">{announcement.class.name}</Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-start opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 text-[#555] hover:text-[#FB923C]"
                      onClick={() => handleTogglePin(announcement.id)}
                    >
                      <Pin className={cn("w-4 h-4", announcement.priority === 'HIGH' && "fill-[#FB923C] text-[#FB923C]")} />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 text-[#555] hover:text-[#00E599]"
                          onClick={() => setSelectedAnnouncement(announcement)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-[#000] border-[#1C1C1C] p-0 overflow-hidden rounded-[2.5rem]">
                        <div className="p-8 bg-white/[0.02] border-b border-[#1C1C1C]">
                           <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white tracking-tight">{selectedAnnouncement?.title || announcement.title}</DialogTitle>
                            <DialogDescription className="text-[11px] font-bold text-[#555] uppercase tracking-widest mt-2 flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5" />
                              Published {new Date(announcement.createdAt).toLocaleDateString("en-US", {
                                weekday: "long", month: "long", day: "numeric", year: "numeric"
                              })}
                            </DialogDescription>
                          </DialogHeader>
                        </div>
                        <div className="p-8 space-y-8">
                          <p className="text-base text-[#B5B5B5] leading-relaxed whitespace-pre-wrap">{announcement.content}</p>
                          <div className="flex items-center gap-4 pt-6 border-t border-[#1C1C1C]">
                            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Target Audience:</p>
                            {announcement.isGlobal ? (
                              <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-0 text-[10px] font-bold tracking-widest px-4">ALL REGISTERED STUDENTS</Badge>
                            ) : (
                              announcement.class && (
                                <Badge className="bg-[#A855F7]/10 text-[#A855F7] border-0 text-[10px] font-bold tracking-widest px-4">{announcement.class.name.toUpperCase()}</Badge>
                              )
                            )}
                          </div>
                        </div>
                        <DialogFooter className="p-8 pt-0">
                          <Button variant="outline" className="w-full bg-transparent border-[#1C1C1C] hover:bg-white/5 text-white font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl" onClick={() => setSelectedAnnouncement(null)}>Close Viewer</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-red-500/10 text-[#555] hover:text-red-500"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
