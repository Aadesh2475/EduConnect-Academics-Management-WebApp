"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Search, Send, Plus, Users, MoreVertical, Trash2,
  MessageSquare, Copy, Flag, CheckCheck, Lock,
  HelpCircle, Shield, PenSquare, Zap, Eye, EyeOff, PhoneOff,
  X, Loader2, ChevronRight, AlertTriangle
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
interface Teacher { id: string; name: string; email: string; image?: string | null; classes: string[] }

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

export default function StudentMessagesPage() {
  const { toast } = useToast()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMsgOpen, setNewMsgOpen] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacherSearch, setTeacherSearch] = useState("")
  const [teachersLoading, setTeachersLoading] = useState(false)
  const [reportMsgId, setReportMsgId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)
  const [deleteConvOpen, setDeleteConvOpen] = useState(false)
  const [deletingConv, setDeletingConv] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const selectedRoomRef = useRef<ChatRoom | null>(null)
  const fetchRoomsRef = useRef<((silent?: boolean) => Promise<void>) | null>(null)
  const fetchMessagesRef = useRef<((roomId: string, silent?: boolean) => Promise<void>) | null>(null)

  const fetchRooms = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch("/api/student/messages", { cache: "no-store" })
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
      const res = await fetch(`/api/student/messages/${roomId}`, { cache: "no-store" })
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

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedRoom || sending) return
    const content = newMessage.trim(); setNewMessage(""); setSending(true)
    const temp: Message = { id: `tmp-${Date.now()}`, content, senderId: "me", senderName: "You", isMe: true, createdAt: new Date().toISOString() }
    setMessages((p) => [...p, temp])
    try {
      const res = await fetch(`/api/student/messages/${selectedRoom.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) })
      const data = await res.json()
      if (data.success) { setMessages((p) => p.map((m) => m.id === temp.id ? data.data : m)); fetchRooms(true) }
      else setMessages((p) => p.filter((m) => m.id !== temp.id))
    } catch { setMessages((p) => p.filter((m) => m.id !== temp.id)) }
    finally { setSending(false) }
  }
  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedRoom) return
    setMessages((p) => p.filter((m) => m.id !== msgId))
    await fetch(`/api/student/messages/${selectedRoom.id}?messageId=${msgId}`, { method: "DELETE" })
  }
  const handleDeleteConversation = async () => {
    if (!selectedRoom) return; setDeletingConv(true)
    try {
      const res = await fetch(`/api/student/messages/${selectedRoom.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) { setSelectedRoom(null); setMessages([]); fetchRooms(); toast({ title: selectedRoom.type === "DIRECT" ? "Conversation deleted" : "Left group" }) }
      else toast({ title: "Error", description: data.error, variant: "destructive" })
    } catch { toast({ title: "Error", variant: "destructive" }) }
    finally { setDeletingConv(false); setDeleteConvOpen(false) }
  }
  const handleCopy = (c: string) => { navigator.clipboard.writeText(c); toast({ title: "Copied" }) }
  const handleReport = async () => {
    if (!reportMsgId || !reportReason.trim() || !selectedRoom) return; setSubmittingReport(true)
    try {
      const res = await fetch(`/api/student/messages/${selectedRoom.id}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: reportMsgId, reason: reportReason.trim() }) })
      const data = await res.json()
      toast({ title: data.success ? "Reported" : "Error", description: data.message || data.error, variant: data.success ? "default" : "destructive" })
      if (data.success) { setReportMsgId(null); setReportReason("") }
    } catch { toast({ title: "Error", variant: "destructive" }) }
    finally { setSubmittingReport(false) }
  }

  const openTeacherPicker = async () => {
    setNewMsgOpen(true); setTeachersLoading(true)
    const d = await (await fetch("/api/student/messages/teachers")).json()
    if (d.success) setTeachers(d.data); setTeachersLoading(false)
  }
  const startChat = async (teacherId: string) => {
    const d = await (await fetch("/api/student/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_direct", recipientId: teacherId }) })).json()
    if (d.success) { setNewMsgOpen(false); await fetchRooms(); const d2 = await (await fetch("/api/student/messages", { cache: "no-store" })).json(); const r = d2.data?.find((x: ChatRoom) => x.id === d.data.roomId); if (r) setSelectedRoom(r) }
  }

  const filteredRooms = rooms.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredTeachers = teachers.filter((t) => t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || t.email.toLowerCase().includes(teacherSearch.toLowerCase()))

  const HELP_ITEMS = [
    { q: "How do I message a teacher?", a: "Click the + button or 'New Conversation' at the bottom of the sidebar. A list of your enrolled teachers will appear — click one to start chatting." },
    { q: "Can I see all my conversations?", a: "Yes. All your direct messages and group/class chats appear in the left sidebar, ordered by most recent activity." },
    { q: "How do I delete a message?", a: "Hover over any message you sent and click the ⋮ menu. Select Delete. It is removed for everyone immediately." },
    { q: "How do I report a message?", a: "Hover over any message, click ⋮, then Report. Describe the reason and submit. An admin will review it." },
    { q: "How do I leave a group?", a: "Open the group chat, click the ⋮ menu in the top right, and choose Leave Group." },
    { q: "How often do new messages load?", a: "Automatically every 10 seconds. Polling pauses when the browser tab is hidden to save resources." },
    { q: "Who gets notified when I send a message?", a: "All other members of the conversation get an in-app notification with a preview and a link back to the chat." },
  ]
  const PRIVACY_ITEMS = [
    { icon: Lock, color: "text-blue-600 bg-blue-50 dark:bg-blue-950", title: "Encrypted Transport", body: "All messages travel over TLS 1.3 encrypted connections. Data at rest is stored in an encrypted, access-controlled database." },
    { icon: Eye, color: "text-purple-600 bg-purple-50 dark:bg-purple-950", title: "Who Can See Messages", body: "Direct messages are private between you and your teacher. Group/class chats are only visible to their members." },
    { icon: EyeOff, color: "text-orange-600 bg-orange-50 dark:bg-orange-950", title: "Permanent Deletion", body: "Deleted messages are permanently removed from the server. No one — including admins — can recover them." },
    { icon: Zap, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950", title: "Smart Notifications", body: "Notifications go only to conversation members. Previews are capped at 60 characters for privacy." },
    { icon: Shield, color: "text-green-600 bg-green-50 dark:bg-green-950", title: "Reporting & Moderation", body: "Any member can report a message. Admins see reporter name, sender name, and message content only in reviewed reports." },
    { icon: PhoneOff, color: "text-red-600 bg-red-50 dark:bg-red-950", title: "Data Retention", body: "Messages are kept for the academic year. You can delete direct conversations and leave group chats at any time." },
  ]

  return (
    <div className="flex flex-col bg-[#000] h-[calc(100vh-4rem)]">
      <Card className="flex-1 overflow-hidden rounded-none border-x-0 border-b-0 bg-[#000] border-[#1C1C1C]">
        <div className="grid h-full grid-cols-[300px_1fr]">

          {/* Sidebar */}
          <div className="border-r border-[#1C1C1C] flex flex-col h-full bg-[#161616]">
            <div className="p-4 border-b border-[#1C1C1C] space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#00E599]">Messages</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 text-[#444] hover:text-[#00E599] transition-colors" onClick={openTeacherPicker}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444] w-4 h-4" />
                <Input placeholder="Search messages..." value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className="pl-9 bg-black border-[#1C1C1C] h-10 text-sm focus:border-[#00E599]/40 transition-all text-white" />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-[#00E599] border-t-transparent rounded-full" />
                    <p className="text-[10px] font-semibold text-[#444]">Loading Messages...</p>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#00E599]/5 border border-[#00E599]/10 flex items-center justify-center mx-auto">
                        <MessageSquare className="w-6 h-6 text-[#00E599]/40" />
                    </div>
                    <p className="text-[#444] text-[10px] font-semibold text-center mt-2">No conversations found</p>
                    <Button size="sm" className="bg-white hover:bg-white/90 text-black font-semibold text-[10px] h-8 transition-all active:scale-95 border-none" onClick={openTeacherPicker}><Plus className="w-3 h-3 mr-1" />New Conversation</Button>
                  </div>
                ) : filteredRooms.map((room) => (
                  <button key={room.id} onClick={() => setSelectedRoom(room)}
                    className={`w-full group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left ${selectedRoom?.id === room.id ? "bg-[#00E599]/10 border border-[#00E599]/20 shadow-[0_0_20px_rgba(0,229,153,0.05)]" : "hover:bg-white/5 border border-transparent"}`}>
                    {room.type === "DIRECT"
                      ? <Avatar className="h-10 w-10 border border-[#1C1C1C]"><AvatarImage src={room.members[0]?.image || ""} /><AvatarFallback className="text-xs bg-black text-[#00E599] font-bold">{getInitials(room.name)}</AvatarFallback></Avatar>
                      : <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-[#1C1C1C] ${room.type === "CLASS" ? "bg-[#3b82f6]/10" : "bg-[#00E599]/10"}`}><Users className={`w-5 h-5 ${room.type === "CLASS" ? "text-[#3b82f6]" : "text-[#00E599]"}`} /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${selectedRoom?.id === room.id ? "text-white" : "text-[#888] group-hover:text-white"}`}>{room.name}</p>
                        <span className="text-[10px] text-[#444] font-medium shrink-0">{room.lastMessage ? formatTime(room.lastMessage.createdAt) : ""}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className="text-[10px] text-[#555] truncate font-medium">{room.lastMessage ? `${room.lastMessage.senderName}: ${room.lastMessage.content}` : "No messages yet"}</p>
                        {room.unreadCount > 0 && <Badge className="h-4 min-w-[16px] px-1 text-[8px] shrink-0 bg-[#00E599] text-black border-0 font-bold">{room.unreadCount}</Badge>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-[#1C1C1C] p-2 shrink-0 space-y-1">
              <button onClick={openTeacherPicker} className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-[#555] hover:text-[#00E599] group">
                <PenSquare className="w-4 h-4 shrink-0 transition-colors group-hover:text-[#00E599]" /><span>New Chat</span>
              </button>
              <button onClick={() => setHelpOpen(true)} className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-[#555] hover:text-[#00E599] group">
                <HelpCircle className="w-4 h-4 shrink-0 transition-colors group-hover:text-[#00E599]" /><span>Support</span>
              </button>
              <button onClick={() => setPrivacyOpen(true)} className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-[#555] hover:text-[#00E599] group">
                <Shield className="w-4 h-4 shrink-0 transition-colors group-hover:text-[#00E599]" /><span>Privacy</span>
              </button>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex flex-col h-full bg-[#000]">
            {selectedRoom ? (
              <>
                <div className="px-6 py-4 border-b border-[#1C1C1C] flex items-center justify-between shrink-0 bg-[#0A0A0A]/50 backdrop-blur-md z-10">
                  <div className="flex items-center gap-4">
                    {selectedRoom.type === "DIRECT"
                      ? <Avatar className="h-10 w-10 border border-[#1C1C1C]"><AvatarImage src={selectedRoom.members[0]?.image || ""} /><AvatarFallback className="text-xs bg-black text-[#00E599] font-bold">{getInitials(selectedRoom.name)}</AvatarFallback></Avatar>
                      : <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-[#1C1C1C] ${selectedRoom.type === "CLASS" ? "bg-[#3b82f6]/10" : "bg-[#00E599]/10"}`}><Users className={`w-5 h-5 ${selectedRoom.type === "CLASS" ? "text-[#3b82f6]" : "text-[#00E599]"}`} /></div>}
                    <div>
                      <p className="font-semibold text-sm text-white">{selectedRoom.name}</p>
                      <p className="text-[10px] text-[#555] font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00E599] shadow-[0_0_8px_#00E599]" />
                        {selectedRoom.type === "DIRECT" ? (selectedRoom.members[0]?.role === "TEACHER" ? "Teacher · Encrypted" : "Direct Message · Encrypted") : `${selectedRoom.members.length + 1} Members`}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5 text-[#444] hover:text-white"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-[#1C1C1C]">
                      <DropdownMenuItem className="text-xs font-semibold text-[#F87171] focus:bg-[#F87171]/10 focus:text-[#F87171]" onClick={() => setDeleteConvOpen(true)}><Trash2 className="w-4 h-4 mr-2" />{selectedRoom.type === "DIRECT" ? "Delete Chat" : "Leave Group"}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <ScrollArea className="flex-1 p-6 relative bg-[radial-gradient(circle,_#1C1C1C_1px,_transparent_1px)] bg-[length:32px_32px]">
                  {msgLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="animate-spin w-8 h-8 border-2 border-[#00E599] border-t-transparent rounded-full" />
                        <p className="text-xs font-semibold text-[#444]">Syncing Signal...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[#00E599]/5 border border-[#00E599]/10 flex items-center justify-center animate-pulse"><Lock className="w-8 h-8 text-[#00E599]/40" /></div>
                        <div className="space-y-1"><p className="text-white font-semibold text-base">New Conversation</p><p className="text-[#555] text-xs">Start a conversation. Your connection is encrypted.</p></div>
                    </div>
                  ) : (
                    <div className="space-y-6 pb-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"} group perspective-1000`}>
                          <div className={`flex items-end gap-3 max-w-[80%] ${msg.isMe ? "flex-row-reverse" : ""}`}>
                            {!msg.isMe && <Avatar className="h-8 w-8 border border-[#1C1C1C] shrink-0 mb-1"><AvatarImage src={msg.senderImage || ""} /><AvatarFallback className="text-[10px] bg-black text-[#00E599] font-bold">{getInitials(msg.senderName)}</AvatarFallback></Avatar>}
                            <div className="flex flex-col gap-1">
                                {!msg.isMe && selectedRoom.type !== "DIRECT" && <p className="text-[9px] font-semibold text-[#555] ml-2 mb-0.5">{msg.senderName}</p>}
                                <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-normal shadow-2xl ${msg.isMe
                                ? "bg-gradient-to-br from-[#00E599] to-[#059669] text-black rounded-br-none shadow-[0_0_20px_rgba(0,229,153,0.1)]"
                                : "bg-[#161616] border border-[#1C1C1C] text-[#CCC] rounded-bl-none"
                                }`}>
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${msg.isMe ? "text-black/60" : "text-[#444]"}`}>
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

                <div className="p-4 border-t border-[#1C1C1C] bg-[#0A0A0A]/50 backdrop-blur-md">
                  <div className="flex gap-3 max-w-5xl mx-auto">
                    <Input 
                        placeholder="Type a message..." 
                        value={newMessage} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)} 
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }} 
                        className="flex-1 bg-[#000] border-[#1C1C1C] focus:border-[#00E599]/40 text-sm text-white h-12 px-4 rounded-xl transition-all" 
                        disabled={sending} 
                    />
                    <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending} className="h-12 w-12 bg-white hover:bg-white/90 text-black rounded-xl shadow-lg transition-all transform active:scale-95 border-none">
                        <Send className="w-5 h-5 text-black" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3 opacity-20 text-white">
                    <Lock className="w-2.5 h-2.5 text-[#00E599]" />
                    <span className="text-[10px] font-semibold">End-to-end encrypted</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#000] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00E599_0.5px,_transparent_0.5px)] bg-[length:24px_24px]" />
                <div className="text-center space-y-6 max-w-sm relative z-10">
                  <div className="w-24 h-24 rounded-[2rem] bg-[#00E599]/5 border border-[#00E599]/10 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(0,229,153,0.05)] transform hover:rotate-6 transition-all duration-500 group">
                    <MessageSquare className="w-10 h-10 text-[#00E599]/40 group-hover:text-[#00E599] transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-white">Messages</h3>
                    <p className="text-[#555] text-xs leading-relaxed font-medium">Select a teacher or start a new conversation.</p>
                  </div>
                  <Button onClick={openTeacherPicker} className="bg-white hover:bg-white/90 text-black font-semibold text-xs h-12 px-8 rounded-xl shadow-lg transition-all active:scale-95 border-none">
                    <Plus className="w-4 h-4 mr-2" /> Start Chat
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Teacher Picker */}
      <Dialog open={newMsgOpen} onOpenChange={setNewMsgOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-md">
            <div className="p-6 border-b border-[#1C1C1C] bg-[#00E599]/5 flex items-center justify-between">
                <div>
                    <DialogTitle className="text-lg font-bold text-white">Message Teacher</DialogTitle>
                    <DialogDescription className="text-[#555] text-xs">Connect to secure session</DialogDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#444] hover:bg-white/5" onClick={() => setNewMsgOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444] w-4 h-4" />
                    <Input placeholder="Search teachers..." value={teacherSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeacherSearch(e.target.value)} className="pl-10 bg-black border-[#1C1C1C] h-11 text-sm focus:border-[#00E599]/40 transition-all text-white" />
                </div>
                <ScrollArea className="h-72 rounded-xl border border-[#1C1C1C] bg-black/30 overflow-hidden">
                    <div className="p-2 space-y-1">
                        {teachersLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#555]">
                                <Loader2 className="animate-spin w-6 h-6" />
                                <p className="text-xs font-semibold">Loading...</p>
                            </div>
                        ) : filteredTeachers.length === 0 ? (
                            <div className="text-center py-12 px-4 space-y-2">
                                <Users className="w-8 h-8 mx-auto text-[#444]" />
                                <p className="text-[#555] text-xs font-medium leading-relaxed">No teachers found. Ensure you are currently enrolled in active classes.</p>
                            </div>
                        ) : filteredTeachers.map((t) => (
                            <button key={t.id} onClick={() => startChat(t.id)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left group">
                                <Avatar className="h-11 w-11 border border-[#1C1C1C]"><AvatarImage src={t.image || ""} /><AvatarFallback className="text-xs bg-black text-[#00E599] font-bold">{getInitials(t.name)}</AvatarFallback></Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-white group-hover:text-[#00E599] transition-colors">{t.name}</p>
                                    <p className="text-[10px] text-[#555] font-medium">{t.classes.join(" · ")}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#444] group-hover:text-[#00E599] transition-all" />
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </DialogContent>
      </Dialog>

      {/* Report */}
      <Dialog open={!!reportMsgId} onOpenChange={(o) => { if (!o) { setReportMsgId(null); setReportReason("") } }}>
        <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-md">
            <div className="p-6 border-b border-[#1C1C1C] bg-[#F87171]/5">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-[#F87171]">Report Content</DialogTitle>
                <DialogDescription className="text-[#555] text-xs">Report message for review</DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#555]">Reason for Violation</label>
                <Textarea placeholder="Describe the policy violation..." value={reportReason} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReportReason(e.target.value)} className="bg-black border-[#1C1C1C] min-h-[120px] focus:border-[#F87171]/40 text-sm text-white rounded-xl" />
                <p className="text-[10px] text-[#444] leading-relaxed italic">Reports are processed for immediate review.</p>
              </div>
            </div>
            <DialogFooter className="p-6 bg-black/50 border-t border-[#1C1C1C]">
              <Button variant="ghost" onClick={() => setReportMsgId(null)} className="text-xs font-semibold text-[#555] hover:text-white">Cancel</Button>
              <Button onClick={handleReport} disabled={!reportReason.trim() || submittingReport} className="bg-white hover:bg-white/90 text-black text-xs font-semibold px-8 h-10 transition-all active:scale-95 border-none">
                {submittingReport ? <Loader2 className="animate-spin w-4 h-4 mr-2 text-black" /> : <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />} Submit Report
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete / Leave */}
      <Dialog open={deleteConvOpen} onOpenChange={setDeleteConvOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-8 text-center max-w-sm">
            <div className="space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#F87171]/10 border border-[#F87171]/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(248,113,113,0.1)]">
                    <Trash2 className="w-8 h-8 text-[#F87171]" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-base font-bold text-white">Delete Chat?</h3>
                    <p className="text-[#555] text-xs leading-relaxed">Permanently erase this conversation? This cannot be undone.</p>
                </div>
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setDeleteConvOpen(false)} className="flex-1 border-[#1C1C1C] bg-[#161616] text-[#555] font-semibold text-xs hover:bg-white/5 hover:text-white">Wait</Button>
                    <Button onClick={handleDeleteConversation} disabled={deletingConv} className="flex-1 bg-white hover:bg-white/90 text-black font-semibold text-xs h-10 transition-all active:scale-95 border-none">
                        {deletingConv ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : "Delete Chat"}
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Help */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-lg">
            <div className="p-6 border-b border-[#1C1C1C] bg-[#00E599]/5 flex items-center justify-between">
                <div>
                    <DialogTitle className="text-lg font-bold text-white">Support</DialogTitle>
                    <DialogDescription className="text-[#555] text-xs">Help & Technical Support</DialogDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#444] hover:bg-white/5" onClick={() => setHelpOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <ScrollArea className="h-96">
                <div className="p-6 space-y-6 pr-10">
                    {HELP_ITEMS.map(({ q, a }) => (
                        <div key={q} className="group space-y-2">
                            <p className="text-xs font-semibold text-[#00E599] flex items-center gap-2 tracking-tight"><ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" /> {q}</p>
                            <p className="text-[11px] text-[#999] leading-relaxed pl-5 border-l border-[#1C1C1C] ml-1.5">{a}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div className="p-4 bg-black/50 border-t border-[#1C1C1C] text-center">
                <p className="text-[10px] text-[#555]">Documentation version 4.0.2 · Secure Link Active</p>
            </div>
        </DialogContent>
      </Dialog>

      {/* Privacy */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#1C1C1C] p-0 overflow-hidden max-w-md">
            <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,229,153,0.1)]">
                    <Shield className="w-8 h-8 text-[#00E599]" />
                </div>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">Privacy Standard</h3>
                        <p className="text-[#555] text-xs font-medium">End-to-End Encryption protocol</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#161616] border border-[#1C1C1C] text-left space-y-3">
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-lg bg-black/50 border border-[#1C1C1C] flex items-center justify-center shrink-0"><Lock className="w-3 h-3 text-[#00E599]" /></div>
                            <p className="text-[10px] text-[#CCC] leading-relaxed">Messages are encrypted at the source and decrypted only by the intended recipient.</p>
                        </div>
                    </div>
                </div>
                <Button className="w-full bg-white hover:bg-white/90 text-black font-semibold text-xs h-12 transition-all active:scale-95 border-none" onClick={() => setPrivacyOpen(false)}>Secure Connection</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
