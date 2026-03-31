"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Search, Send, Plus, Users, MoreVertical, Trash2, RefreshCw,
  BookOpen, MessageSquare, Copy, Flag, UserPlus, CheckCheck,
  HelpCircle, Shield, PenSquare, Lock, Zap, Eye, EyeOff,
  ChevronRight, PhoneOff, Loader2, X, AlertTriangle, UserCheck
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface ChatRoom {
  id: string; name: string; type: "DIRECT" | "GROUP" | "CLASS"
  classId?: string | null
  members: { id: string; name: string; image?: string | null; role?: string }[]
  lastMessage?: { content: string; senderName: string; createdAt: string } | null
  unreadCount: number; updatedAt: string
}
interface Message {
  id: string; content: string; senderId: string; senderName: string
  senderImage?: string | null; isMe: boolean; createdAt: string
}
interface Student { id: string; name: string; email: string; image?: string | null; classes: string[] }
interface TeacherClass { id: string; name: string; code: string }

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}
function formatTime(d: string) {
  const date = new Date(d); const now = new Date()
  const days = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

export default function TeacherMessagesPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get("userId")
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMsgOpen, setNewMsgOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupStudents, setGroupStudents] = useState<Student[]>([])
  const [groupStudentsLoading, setGroupStudentsLoading] = useState(false)
  const [groupSelected, setGroupSelected] = useState<Set<string>>(new Set())
  const [groupSearch, setGroupSearch] = useState("")
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [reportMsgId, setReportMsgId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)
  const [deleteConvOpen, setDeleteConvOpen] = useState(false)
  const [deletingConv, setDeletingConv] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [createConvOpen, setCreateConvOpen] = useState(false)
  const [viewMembersOpen, setViewMembersOpen] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const selectedRoomRef = useRef<ChatRoom | null>(null)
  const fetchRoomsRef = useRef<((silent?: boolean) => Promise<void>) | null>(null)
  const fetchMessagesRef = useRef<((roomId: string, silent?: boolean) => Promise<void>) | null>(null)

  const fetchRooms = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch("/api/teacher/messages", { cache: "no-store" })
      const data = await res.json()
      if (data.success) {
        setRooms(data.data)
        if (selectedRoomRef.current) {
          const updated = data.data.find((r: ChatRoom) => r.id === selectedRoomRef.current!.id)
          if (updated) setSelectedRoom(updated)
        }
      }
    } catch { if (!silent) toast({ title: "Error", description: "Failed to load", variant: "destructive" }) }
    finally { setLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchMessages = useCallback(async (roomId: string, silent = false) => {
    if (!silent) setMsgLoading(true)
    try {
      const res = await fetch(`/api/teacher/messages/${roomId}`, { cache: "no-store" })
      const data = await res.json()
      if (data.success) setMessages(data.data.messages)
    } catch { /* silent */ }
    finally { setMsgLoading(false) }
  }, [])

  useEffect(() => { fetchRoomsRef.current = fetchRooms }, [fetchRooms])
  useEffect(() => { fetchMessagesRef.current = fetchMessages }, [fetchMessages])
  useEffect(() => { fetchRooms() }, [fetchRooms])
  useEffect(() => { selectedRoomRef.current = selectedRoom }, [selectedRoom])
  useEffect(() => {
    if (!selectedRoom) return
    fetchMessages(selectedRoom.id); fetchRooms(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.id])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])
  useEffect(() => {
    const tick = () => { const r = selectedRoomRef.current; if (r) fetchMessagesRef.current?.(r.id, true); fetchRoomsRef.current?.(true) }
    const start = () => { if (!pollRef.current) pollRef.current = setInterval(tick, 10000) }
    const stop = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
    const onVis = () => document.hidden ? stop() : start()
    document.addEventListener("visibilitychange", onVis); if (!document.hidden) start()
    return () => { document.removeEventListener("visibilitychange", onVis); stop() }
  }, [])

  useEffect(() => {
    const initChat = async () => {
      if (targetUserId && rooms.length > 0 && !selectedRoom) {
        // Find if a direct room already exists with this user
        const existingRoom = rooms.find(r => r.type === "DIRECT" && r.members.some(m => m.id === targetUserId))
        if (existingRoom) {
          setSelectedRoom(existingRoom)
        } else {
          // If room doesn't exist, start a new direct chat
          await startDirect(targetUserId)
        }
      }
    }
    initChat()
  }, [targetUserId, rooms, selectedRoom])

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedRoom || sending) return
    const content = newMessage.trim(); setNewMessage(""); setSending(true)
    const temp: Message = { id: `tmp-${Date.now()}`, content, senderId: "me", senderName: "You", isMe: true, createdAt: new Date().toISOString() }
    setMessages((p) => [...p, temp])
    try {
      const res = await fetch(`/api/teacher/messages/${selectedRoom.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) })
      const data = await res.json()
      if (data.success) { setMessages((p) => p.map((m) => m.id === temp.id ? data.data : m)); fetchRooms(true) }
      else setMessages((p) => p.filter((m) => m.id !== temp.id))
    } catch { setMessages((p) => p.filter((m) => m.id !== temp.id)) }
    finally { setSending(false) }
  }
  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedRoom) return
    setMessages((p) => p.filter((m) => m.id !== msgId))
    await fetch(`/api/teacher/messages/${selectedRoom.id}?messageId=${msgId}`, { method: "DELETE" })
  }
  const handleDeleteConversation = async () => {
    if (!selectedRoom) return; setDeletingConv(true)
    try {
      const res = await fetch(`/api/teacher/messages/${selectedRoom.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) { setSelectedRoom(null); setMessages([]); fetchRooms(); toast({ title: "Deleted" }) }
      else toast({ title: "Error", description: data.error, variant: "destructive" })
    } catch { toast({ title: "Error", variant: "destructive" }) }
    finally { setDeletingConv(false); setDeleteConvOpen(false) }
  }
  const handleCopy = (c: string) => { navigator.clipboard.writeText(c); toast({ title: "Copied" }) }
  const handleReport = async () => {
    if (!reportMsgId || !reportReason.trim() || !selectedRoom) return; setSubmittingReport(true)
    try {
      const res = await fetch(`/api/teacher/messages/${selectedRoom.id}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: reportMsgId, reason: reportReason.trim() }) })
      const data = await res.json()
      toast({ title: data.success ? "Reported" : "Error", description: data.message || data.error, variant: data.success ? "default" : "destructive" })
      if (data.success) { setReportMsgId(null); setReportReason("") }
    } catch { toast({ title: "Error", variant: "destructive" }) }
    finally { setSubmittingReport(false) }
  }

  const openStudentPicker = async () => {
    setNewMsgOpen(true); setStudentsLoading(true)
    const d = await (await fetch("/api/teacher/messages/students")).json()
    if (d.success) setStudents(d.data); setStudentsLoading(false)
  }
  const startDirect = async (studentId: string) => {
    const d = await (await fetch("/api/teacher/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_direct", recipientId: studentId }) })).json()
    if (d.success) { setNewMsgOpen(false); setCreateConvOpen(false); await fetchRooms(); const d2 = await (await fetch("/api/teacher/messages", { cache: "no-store" })).json(); const r = d2.data?.find((x: ChatRoom) => x.id === d.data.roomId); if (r) setSelectedRoom(r) }
  }
  const openClassDialog = async () => {
    setClassDialogOpen(true); setClassesLoading(true)
    const d = await (await fetch("/api/teacher/classes")).json()
    if (d.success) setTeacherClasses(d.data); setClassesLoading(false)
  }
  const startClassChat = async (classId: string) => {
    const d = await (await fetch("/api/teacher/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_class", classId }) })).json()
    if (d.success) { setClassDialogOpen(false); setCreateConvOpen(false); await fetchRooms(); const d2 = await (await fetch("/api/teacher/messages", { cache: "no-store" })).json(); const r = d2.data?.find((x: ChatRoom) => x.id === d.data.roomId); if (r) setSelectedRoom(r) }
  }
  const openGroupDialog = async () => {
    setGroupDialogOpen(true); setGroupStudentsLoading(true); setGroupSelected(new Set()); setGroupName("")
    const d = await (await fetch("/api/teacher/messages/students")).json()
    if (d.success) setGroupStudents(d.data); setGroupStudentsLoading(false)
  }
  const toggleGroupMember = (id: string) => { setGroupSelected((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s }) }
  const createGroup = async () => {
    if (!groupName.trim() || groupSelected.size === 0) return; setCreatingGroup(true)
    try {
      const d = await (await fetch("/api/teacher/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_group", name: groupName.trim(), memberIds: Array.from(groupSelected) }) })).json()
      if (d.success) { setGroupDialogOpen(false); setCreateConvOpen(false); await fetchRooms(); const d2 = await (await fetch("/api/teacher/messages", { cache: "no-store" })).json(); const r = d2.data?.find((x: ChatRoom) => x.id === d.data.roomId); if (r) setSelectedRoom(r); toast({ title: `Group "${groupName}" created` }) }
      else toast({ title: "Error", description: d.error, variant: "destructive" })
    } catch { toast({ title: "Error", variant: "destructive" }) }
    finally { setCreatingGroup(false) }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedRoom) return; setRemovingMemberId(memberId)
    try {
      const res = await fetch("/api/teacher/messages/members/remove", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId: selectedRoom.id, memberId }) })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Member removed" });
        await fetchRooms();
        const d2 = await (await fetch("/api/teacher/messages", { cache: "no-store" })).json();
        const r = d2.data?.find((x: ChatRoom) => x.id === selectedRoom.id);
        if (r) setSelectedRoom(r);
      } else toast({ title: "Error", description: data.error, variant: "destructive" })
    } catch { toast({ title: "Error", variant: "destructive" }) }
    finally { setRemovingMemberId(null) }
  }

  const handleMessagePrivately = async (memberUserId: string) => {
    setViewMembersOpen(false); setCreateConvOpen(false);
    // Find if the student mapping exists in `students` list or just directly use backend action
    const d = await (await fetch("/api/teacher/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_direct", recipientId: memberUserId }) })).json()
    if (d.success) { await fetchRooms(); const d2 = await (await fetch("/api/teacher/messages", { cache: "no-store" })).json(); const r = d2.data?.find((x: ChatRoom) => x.id === d.data.roomId); if (r) setSelectedRoom(r) }
  }

  const filteredRooms = rooms.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredStudents = students.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase()))
  const filteredGroupStudents = groupStudents.filter((s) => s.name.toLowerCase().includes(groupSearch.toLowerCase()) || s.email.toLowerCase().includes(groupSearch.toLowerCase()))

  const HELP_ITEMS = [
    { q: "How do I start a conversation?", a: "Click 'New Conversation' at the bottom of the sidebar or the + button at the top. Choose Direct Message, Create Group, or Class Chat." },
    { q: "How do I create a group?", a: "Choose 'Create Group', give it a name, and use the checkboxes to pick students from any of your classes. Students from different classes can be mixed." },
    { q: "How do I delete a message?", a: "Hover over any message you sent, click the ⋮ menu, then Delete. The message is removed for everyone immediately." },
    { q: "How do I report a message?", a: "Hover over any message, click ⋮, then Report. Describe the reason and submit. The admin team will review it." },
    { q: "How often do messages refresh?", a: "Every 10 seconds automatically. Polling pauses when the browser tab is hidden to save resources." },
    { q: "Who is notified when I send a message?", a: "All other members of the conversation receive an in-app notification with a 60-character preview and a link to open the chat." },
  ]
  const PRIVACY_ITEMS = [
    { icon: Lock, color: "text-blue-600 bg-blue-50 dark:bg-blue-950", title: "Encrypted Transport", body: "All messages are sent over TLS 1.3. Data at rest is stored in an encrypted, access-controlled database." },
    { icon: Eye, color: "text-purple-600 bg-purple-50 dark:bg-purple-950", title: "Who Can See Messages", body: "Direct messages are private between participants. Group/class chats are visible only to their members. Admins see reports, not message content." },
    { icon: EyeOff, color: "text-orange-600 bg-orange-50 dark:bg-orange-950", title: "Permanent Deletion", body: "Deleted messages are permanently removed from the database and cannot be recovered by anyone, including admins." },
    { icon: Zap, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950", title: "Smart Notifications", body: "Notifications are sent only to conversation members. Previews are limited to 60 characters." },
    { icon: Shield, color: "text-green-600 bg-green-50 dark:bg-green-950", title: "Reporting & Moderation", body: "Reported messages include reporter name, sender name, and content for admin review. Abuse is handled swiftly." },
    { icon: PhoneOff, color: "text-red-600 bg-red-50 dark:bg-red-950", title: "Data Retention", body: "Messages are retained for the academic year. Teachers can delete conversations. Students can leave group chats at any time." },
  ]

  return (
    <div className="flex flex-col bg-[#000] h-[calc(100vh-4rem)]">
      <Card className="flex-1 overflow-hidden rounded-none border-0 bg-transparent">
        <div className="grid h-full grid-cols-[320px_1fr]">

          {/* Sidebar */}
          <div className="border-r border-[#1C1C1C] flex flex-col h-full bg-[#161616]">
            <div className="p-4 border-b border-[#1C1C1C] space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Messages</h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 text-[#444] hover:text-[#00E599] transition-colors" onClick={() => fetchRooms()}><RefreshCw className="w-3.5 h-3.5" /></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon" className="h-8 w-8 bg-[#00E599] hover:bg-[#00E599]/90 text-white border-0 shadow-[0_0_15px_rgba(0,229,153,0.2)]"><Plus className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-[#1C1C1C]">
                      <DropdownMenuItem className="text-xs font-semibold focus:bg-white/5 focus:text-[#00E599]" onClick={openStudentPicker}><MessageSquare className="w-4 h-4 mr-2" />Direct Message</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-semibold focus:bg-white/5 focus:text-[#00E599]" onClick={openGroupDialog}><UserPlus className="w-4 h-4 mr-2" />Create Group</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-semibold focus:bg-white/5 focus:text-[#00E599]" onClick={openClassDialog}><BookOpen className="w-4 h-4 mr-2" />Class Chat</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5B5B5] w-3.5 h-3.5" />
                <Input placeholder="Search messages..." value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-xs bg-[#000] border-[#1C1C1C] focus:border-white/20 text-white placeholder:text-[#333] transition-all" />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin w-5 h-5 text-[#00E599]" /></div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-[#1C1C1C] flex items-center justify-center mx-auto">
                        <MessageSquare className="w-6 h-6 text-[#B5B5B5]" />
                    </div>
                    <p className="text-[#B5B5B5] text-[11px] font-medium text-center mt-2">No conversations found</p>
                    <Button size="sm" variant="outline" className="text-[11px] font-semibold h-8 border-[#1C1C1C] hover:bg-white/5 text-white" onClick={() => setCreateConvOpen(true)}><Plus className="w-3 h-3 mr-1" />New Conversation</Button>
                  </div>
                ) : filteredRooms.map((room) => (
                  <button key={room.id} onClick={() => setSelectedRoom(room)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group relative overflow-hidden ${selectedRoom?.id === room.id ? "bg-[#00E599]/10 border border-[#00E599]/20" : "hover:bg-white/5 border border-transparent"}`}>
                    {selectedRoom?.id === room.id && <div className="absolute top-0 left-0 w-1 h-full bg-[#00E599]" />}
                    {room.type === "DIRECT"
                      ? <Avatar className="h-10 w-10 shrink-0 border border-[#1C1C1C] group-hover:border-[#00E599]/30 transition-all"><AvatarImage src={room.members[0]?.image || ""} /><AvatarFallback className="text-xs bg-[#000] text-[#00E599] font-bold">{getInitials(room.name)}</AvatarFallback></Avatar>
                      : <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#1C1C1C] group-hover:border-[#00E599]/30 transition-all ${room.type === "CLASS" ? "bg-gradient-to-br from-[#3b82f6]/20 to-[#3b82f6]/5" : "bg-gradient-to-br from-[#00E599]/20 to-[#00E599]/5"}`}><Users className={`w-4 h-4 ${room.type === "CLASS" ? "text-[#3b82f6]" : "text-[#00E599]"}`} /></div>
                    }
            <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${selectedRoom?.id === room.id ? "text-white" : "text-[#B5B5B5] group-hover:text-white"}`}>{room.name}</p>
                        <span className="text-[10px] text-[#B5B5B5] font-medium shrink-0">{room.lastMessage ? formatTime(room.lastMessage.createdAt) : ""}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className="text-[10px] text-[#B5B5B5] truncate font-medium">{room.lastMessage ? `${room.lastMessage.senderName}: ${room.lastMessage.content}` : "No messages yet"}</p>
                        {room.unreadCount > 0 && <Badge className="h-4 min-w-[16px] px-1 text-[8px] shrink-0 bg-[#00E599] text-black border-0 font-bold">{room.unreadCount}</Badge>}
                      </div>
                    </div>
                  </button>
                 ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-[#1C1C1C] p-2 shrink-0 space-y-1">
              <button onClick={() => setCreateConvOpen(true)} className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-[#B5B5B5] hover:text-white group">
                <PenSquare className="w-4 h-4 shrink-0 transition-colors group-hover:text-white" /><span>New Chat</span>
              </button>
              <button onClick={() => setHelpOpen(true)} className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-[#B5B5B5] hover:text-white group">
                <HelpCircle className="w-4 h-4 shrink-0 transition-colors group-hover:text-white" /><span>Support</span>
              </button>
              <button onClick={() => setPrivacyOpen(true)} className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-[#B5B5B5] hover:text-white group">
                <Shield className="w-4 h-4 shrink-0 transition-colors group-hover:text-white" /><span>Privacy</span>
              </button>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex flex-col h-full bg-[#000]">
            {selectedRoom ? (
              <>
                <div className="px-6 py-4 border-b border-[#1C1C1C] flex items-center justify-between shrink-0 bg-[#080808]/50 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    {selectedRoom.type === "DIRECT"
                      ? <Avatar className="h-10 w-10 border border-[#1C1C1C]"><AvatarImage src={selectedRoom.members[0]?.image || ""} /><AvatarFallback className="text-xs bg-black text-[#00E599] font-bold">{getInitials(selectedRoom.name)}</AvatarFallback></Avatar>
                      : <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-[#1C1C1C] ${selectedRoom.type === "CLASS" ? "bg-[#3b82f6]/10" : "bg-[#00E599]/10"}`}><Users className={`w-5 h-5 ${selectedRoom.type === "CLASS" ? "text-[#3b82f6]" : "text-[#00E599]"}`} /></div>}
                    <div>
                      <p className="font-bold text-sm text-white">{selectedRoom.name}</p>
                      <p className="text-[11px] text-[#B5B5B5] font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00E599]" />
                        {selectedRoom.type === "DIRECT" ? "Direct Messaging" : `${selectedRoom.members.length + 1} Members`}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5 text-[#444] hover:text-white"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-[#1C1C1C]">
                      {selectedRoom.type !== "DIRECT" && (
                        <DropdownMenuItem className="text-xs font-semibold focus:bg-white/5" onClick={() => setViewMembersOpen(true)}>
                          <Users className="w-4 h-4 mr-2 text-[#00E599]" />
                          View Members
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-xs font-semibold text-[#F87171] focus:bg-[#F87171]/10 focus:text-[#F87171]" onClick={() => setDeleteConvOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Delete Chat</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <ScrollArea className="flex-1 p-6 relative overflow-hidden bg-[linear-gradient(#ffffff02_1px,_transparent_1px),_linear-gradient(90deg,_#ffffff02_1px,_transparent_1px)] bg-[length:32px_32px]">
                  {msgLoading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin w-8 h-8 text-[#00E599]" /></div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-center space-y-4 relative z-10">
                        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-[#1C1C1C] flex items-center justify-center">
                            <Lock className="w-8 h-8 text-[#B5B5B5]" />
                        </div>
                        <p className="text-[#B5B5B5] text-[11px] font-medium">Starting a new conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-6 pb-4 relative z-10">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"} group`}>
                          <div className={`flex items-end gap-3 max-w-[80%] ${msg.isMe ? "flex-row-reverse" : ""}`}>
                            {!msg.isMe && (
                                <Avatar className="h-8 w-8 shrink-0 mb-1 border border-[#1C1C1C]">
                                    <AvatarImage src={msg.senderImage || ""} />
                                    <AvatarFallback className="text-[10px] bg-black text-[#00E599] font-bold">{getInitials(msg.senderName)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className="flex flex-col gap-1">
                                {!msg.isMe && selectedRoom.type !== "DIRECT" && <p className="text-[11px] font-medium text-[#B5B5B5] ml-2 mb-0.5">{msg.senderName}</p>}
                                <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-normal shadow-2xl ${msg.isMe
                                ? "bg-gradient-to-br from-[#00E599] to-[#059669] text-black rounded-br-none shadow-[0_0_20px_rgba(0,229,153,0.1)]"
                                : "bg-[#161616] border border-[#1C1C1C] text-[#CCC] rounded-bl-none"
                                }`}>
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${msg.isMe ? "text-black/60" : "text-[#B5B5B5]"}`}>
                                    <span className="text-[10px] font-medium">{formatTime(msg.createdAt)}</span>
                                    {msg.isMe && <CheckCheck className="w-3.5 h-3.5" />}
                                </div>
                                </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 text-[#444] hover:text-[#00E599] shrink-0 mb-1"><MoreVertical className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align={msg.isMe ? "end" : "start"} className="bg-[#0A0A0A] border-[#1C1C1C] min-w-[120px]">
                                <DropdownMenuItem className="text-xs font-semibold focus:bg-white/5" onClick={() => handleCopy(msg.content)}><Copy className="w-3.5 h-3.5 mr-2 text-[#00E599]" />Copy</DropdownMenuItem>
                                {!msg.isMe && <DropdownMenuItem className="text-xs font-semibold focus:bg-white/5" onClick={() => { setReportMsgId(msg.id); setReportReason("") }}><Flag className="w-3.5 h-3.5 mr-2 text-[#F87171]" />Report</DropdownMenuItem>}
                                {msg.isMe && (<><DropdownMenuSeparator className="bg-[#1C1C1C]" /><DropdownMenuItem className="text-xs font-semibold text-[#F87171] focus:bg-[#F87171]/10 focus:text-[#F87171]" onClick={() => handleDeleteMessage(msg.id)}><Trash2 className="w-3.5 h-3.5 mr-2" />Erase</DropdownMenuItem></>)}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t border-[#1C1C1C] shrink-0 bg-[#080808]">
                  <div className="flex gap-3">
                    <Input 
                        placeholder="Type a message..." 
                        value={newMessage} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)} 
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }} 
                        className="flex-1 bg-[#000] border-[#1C1C1C] focus:border-[#00E599]/40 text-sm text-white h-12 px-4 rounded-xl transition-all" 
                        disabled={sending} 
                    />
                    <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending} className="h-12 w-12 bg-[#00E599] hover:bg-[#00E599]/90 text-black rounded-xl shadow-[0_0_20px_rgba(0,229,153,0.15)] transition-all transform active:scale-95">
                        <Send className="w-5 h-5 text-black" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3 opacity-20">
                    <Lock className="w-2.5 h-2.5 text-[#00E599]" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-white">End-to-end encrypted</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#000] relative overflow-hidden bg-[radial-gradient(#00E599_0.5px,_transparent_0.5px)] bg-[length:24px_24px]">
                <div className="text-center space-y-6 max-w-sm relative z-10">
                  <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-[#1C1C1C] flex items-center justify-center mx-auto shadow-2xl transform hover:rotate-6 transition-all duration-500 group">
                    <MessageSquare className="w-10 h-10 text-[#B5B5B5] group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-white tracking-tight">Messages</h3>
                    <p className="text-[#B5B5B5] text-sm leading-relaxed font-medium">Select a conversation or start a new one with a student.</p>
                  </div>
                  <Button onClick={() => setCreateConvOpen(true)} className="bg-white hover:bg-white/90 text-black font-semibold text-sm h-11 px-8 rounded-xl shadow-2xl transition-all active:scale-95">
                    <Plus className="w-4 h-4 mr-2" /> Start Chat
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

        {/* Dialogs */}
        <Dialog open={createConvOpen} onOpenChange={setCreateConvOpen}>
          <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-md">
            <div className="p-6 border-b border-[#1C1C1C] bg-[#1C1C1C]/30">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white">New Conversation</DialogTitle>
                <DialogDescription className="text-[11px] font-medium text-[#B5B5B5]">Select conversation type</DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <Button variant="outline" className="w-full justify-start h-16 border-[#1C1C1C] bg-[#161616] hover:bg-white/5 hover:border-white/20 group transition-all" onClick={() => { setCreateConvOpen(false); openStudentPicker() }}>
                <div className="w-10 h-10 rounded-xl bg-black border border-[#1C1C1C] flex items-center justify-center mr-4 group-hover:border-white/20"><MessageSquare className="w-5 h-5 text-[#B5B5B5] group-hover:text-white" /></div>
                <div className="text-left"><p className="text-sm font-bold text-white">Direct Chat</p><p className="text-[11px] text-[#B5B5B5]">Private student session</p></div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-16 border-[#1C1C1C] bg-[#161616] hover:bg-white/5 hover:border-white/20 group transition-all" onClick={() => { setCreateConvOpen(false); openGroupDialog() }}>
                <div className="w-10 h-10 rounded-xl bg-black border border-[#1C1C1C] flex items-center justify-center mr-4 group-hover:border-white/20"><UserPlus className="w-5 h-5 text-[#B5B5B5] group-hover:text-white" /></div>
                <div className="text-left"><p className="text-sm font-bold text-white">Group Conversation</p><p className="text-[11px] text-[#B5B5B5]">Collaborative session</p></div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-16 border-[#1C1C1C] bg-[#161616] hover:bg-white/5 hover:border-white/20 group transition-all" onClick={() => { setCreateConvOpen(false); openClassDialog() }}>
                <div className="w-10 h-10 rounded-xl bg-black border border-[#1C1C1C] flex items-center justify-center mr-4 group-hover:border-white/20"><BookOpen className="w-5 h-5 text-[#B5B5B5] group-hover:text-[#3b82f6]" /></div>
                <div className="text-left"><p className="text-sm font-bold text-white">Class Broadcast</p><p className="text-[11px] text-[#B5B5B5]">Announce to all students</p></div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Direct Message - Student Picker */}
        <Dialog open={newMsgOpen} onOpenChange={setNewMsgOpen}>
          <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-lg">
            <div className="p-6 border-b border-[#1C1C1C] bg-[#1C1C1C]/30 flex items-center justify-between">
                <div>
                    <DialogTitle className="text-lg font-bold text-white">Select Student</DialogTitle>
                    <DialogDescription className="text-[11px] font-medium text-[#B5B5B5]">Connect to secure session</DialogDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#444] hover:bg-white/5" onClick={() => setNewMsgOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-4 border-b border-[#1C1C1C] bg-[#000]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5B5B5] w-4 h-4" />
                    <Input placeholder="Search students..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-10 bg-[#161616] border-[#1C1C1C] text-sm h-11" />
                </div>
            </div>
            <ScrollArea className="h-[350px]">
              <div className="p-2 space-y-1">
                {studentsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin w-6 h-6 text-[#00E599]" /></div>
                ) : filteredStudents.map((student) => (
                  <button key={student.id} onClick={() => startDirect(student.id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-[#1C1C1C] transition-all group text-left">
                    <Avatar className="h-10 w-10 border border-[#1C1C1C] group-hover:border-white/20 transition-all"><AvatarImage src={student.image || ""} /><AvatarFallback className="bg-black text-[#00E599] font-bold text-xs">{getInitials(student.name)}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white group-hover:text-white transition-colors">{student.name}</p>
                      <p className="text-[11px] text-[#B5B5B5] font-medium">{student.email}</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-black border border-[#1C1C1C] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><MessageSquare className="w-3.5 h-3.5 text-[#00E599]" /></div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Create Group Dialog */}
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-lg">
            <div className="p-6 border-b border-[#1C1C1C] bg-[#1C1C1C]/30">
                <DialogTitle className="text-lg font-bold text-white">Create Group</DialogTitle>
                <DialogDescription className="text-[11px] font-medium text-[#B5B5B5]">Establish collaborative session</DialogDescription>
            </div>
            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B5B5B5]">Group Name</label>
                    <Input placeholder="Enter conversation name..." value={groupName} onChange={(e) => setGroupName(e.target.value)} className="bg-black border-[#1C1C1C] h-11 focus:border-white/20" />
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#555]">Select Members ({groupSelected.size})</label>
                        <div className="relative w-40">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#444] w-3 h-3" />
                            <Input placeholder="Search students..." value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} className="pl-7 bg-black border-[#1C1C1C] h-8 text-xs" />
                        </div>
                    </div>
                    <ScrollArea className="h-[250px] rounded-xl border border-[#1C1C1C] bg-black/50 overflow-hidden">
                        <div className="p-2 space-y-1">
                            {filteredGroupStudents.map((student) => (
                                <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
                                    <Checkbox id={`student-${student.id}`} checked={groupSelected.has(student.id)} onCheckedChange={() => toggleGroupMember(student.id)} className="border-[#1C1C1C] data-[state=checked]:bg-white data-[state=checked]:text-black" />
                                    <Avatar className="h-8 w-8 border border-[#1C1C1C]"><AvatarImage src={student.image || ""} /><AvatarFallback className="bg-black text-[#00E599] font-bold text-xs">{getInitials(student.name)}</AvatarFallback></Avatar>
                                    <label htmlFor={`student-${student.id}`} className="text-xs font-medium text-white cursor-pointer flex-1">{student.name}</label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
            <DialogFooter className="p-6 bg-black/50 border-t border-[#1C1C1C]">
                <Button variant="ghost" onClick={() => setGroupDialogOpen(false)} className="text-sm font-semibold text-[#B5B5B5] hover:text-white">Cancel</Button>
                <Button onClick={createGroup} disabled={!groupName.trim() || groupSelected.size === 0 || creatingGroup} className="bg-white hover:bg-white/90 text-black text-sm font-bold px-8 shadow-2xl transition-all">
                    {creatingGroup ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Users className="w-4 h-4 mr-2" />} Create Group
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Class Chat Dialog */}
        <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
          <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-md">
            <div className="p-6 border-b border-[#1C1C1C] bg-[#1C1C1C]/30">
                <DialogTitle className="text-lg font-bold text-white">Class Broadcast</DialogTitle>
                <DialogDescription className="text-[11px] font-medium text-[#B5B5B5]">Public session for academic sync</DialogDescription>
            </div>
            <ScrollArea className="max-h-[350px]">
                <div className="p-4 space-y-2">
                    {classesLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin w-6 h-6 text-[#3b82f6]" /></div>
                    ) : teacherClasses.length === 0 ? (
                        <div className="text-center py-12"><p className="text-[#444] text-[10px] font-black uppercase tracking-widest">No classes found</p></div>
                    ) : teacherClasses.map((cls) => (
                        <button key={cls.id} onClick={() => startClassChat(cls.id)} className="w-full flex items-center justify-between p-4 rounded-xl border border-[#1C1C1C] bg-[#161616] hover:bg-white/5 hover:border-[#3b82f6]/40 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-black border border-[#1C1C1C] flex items-center justify-center group-hover:border-[#3b82f6]/30 transition-all"><BookOpen className="w-5 h-5 text-[#3b82f6]" /></div>
                                <div className="text-left text-white">
                                    <p className="text-sm font-bold group-hover:text-white transition-colors">{cls.name}</p>
                                    <p className="text-[11px] text-[#B5B5B5] font-medium mt-1">{cls.code}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#444] group-hover:text-[#3b82f6]" />
                        </button>
                    ))}
                </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={!!reportMsgId} onOpenChange={(open) => !open && setReportMsgId(null)}>
          <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-md">
            <div className="p-6 border-b border-[#1C1C1C] bg-red-500/5">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-red-500">Report Content</DialogTitle>
                <DialogDescription className="text-[11px] font-medium text-[#B5B5B5]">Report message for review</DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#B5B5B5]">Violation description</label>
                <Textarea 
                  placeholder="Explain the violation..." 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value)} 
                  className="bg-black border-[#1C1C1C] focus:border-red-500/20 h-24 placeholder:text-[#333] text-sm text-white"
                />
              </div>
            </div>
            <DialogFooter className="p-6 bg-black/50 border-t border-[#1C1C1C]">
              <Button variant="ghost" onClick={() => setReportMsgId(null)} className="text-sm font-semibold text-[#B5B5B5] hover:text-white">Cancel</Button>
              <Button onClick={handleReport} disabled={!reportReason.trim() || submittingReport} className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-8">
                {submittingReport ? <Loader2 className="animate-spin w-4 h-4 mr-2 text-white" /> : <AlertTriangle className="w-4 h-4 mr-2" />} Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Conversation Dialog */}
        <Dialog open={deleteConvOpen} onOpenChange={setDeleteConvOpen}>
          <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-sm">
            <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">Delete Chat?</h3>
                    <p className="text-[#B5B5B5] text-sm leading-relaxed">Permanently erase this conversation? This cannot be undone.</p>
                </div>
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setDeleteConvOpen(false)} className="flex-1 border-[#1C1C1C] bg-[#161616] text-[#B5B5B5] font-semibold text-sm hover:bg-white/5 hover:text-white">Cancel</Button>
                    <Button onClick={handleDeleteConversation} disabled={deletingConv} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-2xl transition-all">
                        {deletingConv ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Delete Chat"}
                    </Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Members Dialog */}
        <Dialog open={viewMembersOpen} onOpenChange={setViewMembersOpen}>
          <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-md">
            <div className="p-6 border-b border-[#1C1C1C] bg-[#1C1C1C]/30">
                <DialogTitle className="text-lg font-bold text-white">Chat Members</DialogTitle>
                <DialogDescription className="text-[11px] font-medium text-[#B5B5B5]">{(selectedRoom?.members?.length || 0) + 1} Members in this chat</DialogDescription>
            </div>
            <ScrollArea className="max-h-[400px]">
                <div className="p-4 space-y-1">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#00E599]/5 border border-[#00E599]/10">
                        <div className="relative">
                            <Avatar className="h-10 w-10 border border-[#00E599]/30"><AvatarImage src="" /><AvatarFallback className="bg-black text-[#00E599] font-bold text-xs">TH</AvatarFallback></Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black border border-[#00E599]/30 flex items-center justify-center"><UserCheck className="w-2.5 h-2.5 text-[#00E599]" /></div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-white flex items-center gap-2">You <Badge className="bg-[#00E599] text-black text-[8px] border-0 h-3.5 px-1 font-bold">HOST</Badge></p>
                            <p className="text-[10px] text-[#00E599]/60 font-medium whitespace-nowrap">Authorized Teacher</p>
                        </div>
                    </div>
                    {selectedRoom?.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:bg-white/5 hover:border-[#1C1C1C] transition-all group">
                            <Avatar className="h-10 w-10 border border-[#1C1C1C] group-hover:border-[#00E599]/30 transition-all"><AvatarImage src={member.image || ""} /><AvatarFallback className="bg-black text-[#00E599] font-bold text-xs">{getInitials(member.name)}</AvatarFallback></Avatar>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-white group-hover:text-white transition-colors">{member.name}</p>
                                <p className="text-[11px] text-[#B5B5B5] font-medium truncate">{member.role === 'STUDENT' ? 'Student' : 'Member'}</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-[#444] hover:text-white transition-all"><MoreVertical className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-[#1C1C1C]">
                                    <DropdownMenuItem className="text-xs font-semibold focus:bg-white/5" onClick={() => handleMessagePrivately(member.id)}><MessageSquare className="w-4 h-4 mr-2 text-[#00E599]" />Message Privately</DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[#1C1C1C]" />
                                    <DropdownMenuItem className="text-xs font-semibold text-[#F87171] focus:bg-[#F87171]/10 focus:text-[#F87171]" onClick={() => handleRemoveMember(member.id)}>
                                        <Trash2 className="w-4 h-4 mr-2" />Remove Member
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Support Dialog */}
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-md">
            <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-[#1C1C1C] flex items-center justify-center mx-auto shadow-2xl">
                    <HelpCircle className="w-8 h-8 text-[#B5B5B5]" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">System Support</h3>
                    <p className="text-[#B5B5B5] text-sm leading-relaxed px-4">Contact our transmission team for immediate technical and academic assistance.</p>
                </div>
                <div className="space-y-3 pt-2">
                    <Button className="w-full bg-white hover:bg-white/90 text-black font-bold text-sm h-12">Contact Support</Button>
                    <Button variant="outline" className="w-full border-[#1C1C1C] bg-[#161616] text-[#B5B5B5] font-semibold text-sm h-12 hover:bg-white/5 hover:text-white" onClick={() => setHelpOpen(false)}>Done</Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Privacy Dialog */}
        <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
          <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-md">
            <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-[#1C1C1C] flex items-center justify-center mx-auto shadow-2xl">
                    <Shield className="w-8 h-8 text-[#B5B5B5]" />
                </div>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white">Privacy Standard</h3>
                        <p className="text-[#B5B5B5] text-sm font-medium">End-to-End Encryption protocol</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#161616] border border-[#1C1C1C] text-left space-y-3">
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-lg bg-black/50 border border-[#1C1C1C] flex items-center justify-center shrink-0"><Lock className="w-3 h-3 text-[#00E599]" /></div>
                            <p className="text-[10px] text-[#CCC] leading-relaxed">Signals are encrypted at the source and decrypted only by authorized target entities.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-lg bg-black/50 border border-[#1C1C1C] flex items-center justify-center shrink-0"><EyeOff className="w-3 h-3 text-[#00E599]" /></div>
                            <p className="text-[10px] text-[#CCC] leading-relaxed">System administrators have zero-visibility into private signal transmissions.</p>
                        </div>
                    </div>
                </div>
                <Button className="w-full bg-white hover:bg-white/90 text-black font-bold text-sm h-12" onClick={() => setPrivacyOpen(false)}>Secure Connection</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  )
}
