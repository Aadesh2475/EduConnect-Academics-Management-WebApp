"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot, Send, User, Plus, Trash2, RefreshCw, Copy, Check,
  ThumbsUp, ThumbsDown, MessageSquare, BarChart3, AlertCircle,
  BookOpen, ClipboardList, TrendingUp, ChevronLeft, Sparkles,
  MoreHorizontal, Pen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

// ─── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  feedback?: string | null
  createdAt: string
}

interface ChatSession {
  id: string
  title: string | null
  updatedAt: string
  _count?: { messages: number }
}

// ─── Quick prompts (icon-only, no emoji) ─────────────────────────────────────
const QUICK_PROMPTS = [
  { label: "Analyze my performance", icon: BarChart3 },
  { label: "What subjects am I at risk in?", icon: AlertCircle },
  { label: "Create a study plan for me", icon: BookOpen },
  { label: "Review my pending tasks", icon: ClipboardList },
  { label: "Predict my semester outcome", icon: TrendingUp },
  { label: "How can I improve my grades?", icon: Sparkles },
]

// ─── Markdown renderer ───────────────────────────────────────────────────────
function Markdown({ text }: { text: string }) {
  const lines = text.split("\n")
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        if (line.startsWith("## "))
          return <h3 key={i} className="font-semibold text-gray-900 dark:text-gray-100 text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith("### "))
          return <h4 key={i} className="font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-0.5">{line.slice(4)}</h4>
        if (line.startsWith("- ") || line.startsWith("• "))
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00E599] shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{inlineBold(line.slice(2))}</span>
            </div>
          )
        const numMatch = line.match(/^(\d+)\.\s(.*)/)
        if (numMatch)
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="font-semibold text-[#00E599] min-w-[1.2rem] text-right shrink-0">{numMatch[1]}.</span>
              <span className="text-gray-700 dark:text-gray-300">{inlineBold(numMatch[2])}</span>
            </div>
          )
        return <p key={i} className="text-gray-700 dark:text-gray-300">{inlineBold(line)}</p>
      })}
    </div>
  )
}

function inlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="font-semibold text-gray-900 dark:text-gray-100">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function StudentAIAssistant() {
  const { toast } = useToast()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load sessions on mount
  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  async function fetchSessions() {
    setLoadingSessions(true)
    try {
      const res = await fetch("/api/chatbot/sessions")
      const data = await res.json()
      if (data.success) {
        setSessions(data.data.filter((s: ChatSession & { role: string }) => s.role === "STUDENT"))
      }
    } catch {
      /* silent */
    } finally {
      setLoadingSessions(false)
    }
  }

  async function loadSession(id: string) {
    try {
      const res = await fetch(`/api/chatbot/sessions/${id}`)
      const data = await res.json()
      if (data.success) {
        setActiveSessionId(id)
        setMessages(data.data.messages)
      }
    } catch {
      toast({ title: "Error", description: "Failed to load chat", variant: "destructive" })
    }
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const res = await fetch(`/api/chatbot/sessions/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (data.success) {
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (activeSessionId === id) {
        setActiveSessionId(null)
        setMessages([])
      }
    }
  }

  function newChat() {
    setActiveSessionId(null)
    setMessages([])
    setInput("")
  }

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim()
      if (!msg || isLoading) return
      setInput("")
      setIsLoading(true)

      // Optimistic user message (no id yet)
      const tempId = `temp-${Date.now()}`
      const optimistic: ChatMessage = {
        id: tempId,
        role: "user",
        content: msg,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimistic])

      try {
        const res = await fetch("/api/chatbot/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            sessionId: activeSessionId,
            userRole: "STUDENT",
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || "Failed")

        const { sessionId, response, messageId } = data.data

        // On first message, refresh session list and set active
        if (!activeSessionId) {
          setActiveSessionId(sessionId)
          fetchSessions()
        }

        const aiMsg: ChatMessage = {
          id: messageId,
          role: "assistant",
          content: response,
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiMsg])
      } catch (err) {
        const errorText = err instanceof Error ? err.message : "Something went wrong"
        toast({ title: "AI Error", description: errorText, variant: "destructive" })
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, activeSessionId, toast]
  )

  async function saveFeedback(messageId: string, feedback: string | null) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
    )
    await fetch(`/api/chatbot/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    })
  }

  function copyMessage(id: string, content: string) {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const isNewChat = messages.length === 0 && !activeSessionId

  return (
    <div className="flex h-[calc(100vh-4rem)] rounded-none border-x-0 border-b-0 border-[#1C1C1C] overflow-hidden bg-[#000]">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col shrink-0 border-r border-[#1C1C1C] bg-[#161616] overflow-hidden"
          >
            {/* Sidebar header */}
            <div className="flex items-center gap-2 p-3 border-b border-[#1C1C1C]">
              <Button onClick={newChat} size="sm" className="flex-1 h-8 bg-white hover:bg-white/90 text-black text-[11px] font-semibold gap-1.5 rounded-lg border-none shadow-sm">
                <Plus className="w-3.5 h-3.5" /> New Chat
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[#444] hover:bg-white/5 hover:text-[#00E599]" onClick={() => setSidebarOpen(false)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Session list */}
            <ScrollArea className="flex-1 px-2 py-2">
              {loadingSessions ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse border border-[#1C1C1C]" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00E599]/5 border border-[#00E599]/10 flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 text-[#00E599]/40" />
                  </div>
                  <p className="text-[10px] font-semibold text-[#444] uppercase tracking-wider">No previous chats</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => loadSession(s.id)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all border border-transparent",
                        activeSessionId === s.id
                          ? "bg-[#00E599]/10 border-[#00E599]/20 shadow-[0_0_15px_rgba(0,229,153,0.05)]"
                          : "hover:bg-white/5 text-[#888] hover:text-white"
                      )}
                    >
                      <MessageSquare className={cn("w-4 h-4 shrink-0 transition-colors", activeSessionId === s.id ? "text-[#00E599]" : "text-[#444] group-hover:text-[#00E599]")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold truncate", activeSessionId === s.id ? "text-[#00E599]" : "text-white/80")}>
                          {s.title ?? "New Chat"}
                        </p>
                        <p className="text-[9px] text-[#444] font-medium mt-0.5">
                          {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-[#F87171]/10 text-[#444] hover:text-[#F87171]"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main chat area ───────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 bg-[#000]">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-[#1C1C1C] shrink-0 bg-[#0A0A0A]/50 backdrop-blur-xl z-20">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" className="h-9 w-9 bg-[#161616] border border-[#1C1C1C] text-[#00E599]" onClick={() => setSidebarOpen(true)} title="Show sessions">
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,229,153,0.05)]">
              <Bot className="w-5 h-5 text-[#00E599]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white leading-none tracking-tight">
                Student AI Assistant
              </h1>
              <p className="text-[10px] text-[#555] font-medium mt-1.5 flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#00E599]" />
                Online and ready to help
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-6 relative bg-[radial-gradient(circle,_#1C1C1C_1px,_transparent_1px)] bg-[length:32px_32px]">
          <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Empty state / quick prompts */}
            {isNewChat && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-12">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 rounded-[2rem] bg-[#00E599]/5 border border-[#00E599]/10 flex items-center justify-center mx-auto mb-6 transform hover:rotate-6 transition-all duration-500 group">
                    <Bot className="w-10 h-10 text-[#00E599]/40 group-hover:text-[#00E599] transition-colors" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    How can I help you today?
                  </h2>
                  <p className="text-sm text-[#555] max-w-md mx-auto font-medium">
                    Ask questions about your studies or get a study plan.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {QUICK_PROMPTS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q.label)}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-[#1C1C1C] bg-[#161616]/50 hover:bg-[#00E599]/5 hover:border-[#00E599]/20 text-left transition-all group overflow-hidden relative"
                    >
                      <div className="w-10 h-10 rounded-xl bg-black border border-[#1C1C1C] group-hover:border-[#00E599]/30 flex items-center justify-center shrink-0 transition-all">
                        <q.icon className="w-5 h-5 text-[#444] group-hover:text-[#00E599]" />
                      </div>
                      <span className="text-xs font-semibold text-[#888] group-hover:text-white transition-colors">
                        {q.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex gap-4", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_15px_rgba(0,229,153,0.05)]">
                      <Bot className="w-4 h-4 text-[#00E599]" />
                    </div>
                  )}
                  <div className={cn("flex flex-col gap-1.5 max-w-[85%]", msg.role === "user" && "items-end")}>
                    <div
                      className={cn(
                        "rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-2xl",
                        msg.role === "user"
                          ? "bg-gradient-to-br from-[#00E599] to-[#059669] text-black rounded-br-none font-bold"
                          : "bg-[#161616] border border-[#1C1C1C] text-white/90 rounded-bl-none"
                      )}
                    >
                      {msg.role === "user" ? (
                        <p>{msg.content}</p>
                      ) : (
                        <Markdown text={msg.content} />
                      )}
                    </div>
                    {/* AI message actions */}
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1 pl-1">
                        <button
                          onClick={() => copyMessage(msg.id, msg.content)}
                          className="p-2 rounded-lg text-[#444] hover:text-[#00E599] hover:bg-white/5 transition-all"
                          title="Copy"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-[#00E599]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => saveFeedback(msg.id, msg.feedback === "up" ? null : "up")}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            msg.feedback === "up"
                              ? "text-[#00E599] bg-[#00E599]/10"
                              : "text-[#444] hover:text-[#00E599] hover:bg-white/5"
                          )}
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => saveFeedback(msg.id, msg.feedback === "down" ? null : "down")}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            msg.feedback === "down"
                              ? "text-[#F87171] bg-[#F87171]/10"
                              : "text-[#444] hover:text-[#F87171] hover:bg-white/5"
                          )}
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-[#333] font-bold uppercase tracking-widest ml-2">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-[#161616] border border-[#1C1C1C] flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-[#00E599]" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-[#00E599]" />
                </div>
                <div className="bg-[#161616] border border-[#1C1C1C] rounded-2xl rounded-bl-none px-5 py-3.5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-[#00E599] animate-spin" />
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[#00E599]/40"
                          animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 border-t border-[#1C1C1C] bg-[#0A0A0A]/50 backdrop-blur-md z-30">
          <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="flex items-end gap-3 bg-black border border-[#1C1C1C] rounded-2xl px-4 py-3 focus-within:border-[#00E599]/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <Textarea
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent text-sm py-1.5 min-h-[32px] max-h-[160px] text-white font-medium placeholder:text-[#333]"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-10 w-10 rounded-xl bg-white hover:bg-white/90 text-black shadow-lg transition-all transform active:scale-95 shrink-0 border-none"
              >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin text-black" /> : <Send className="w-5 h-5 text-black" />}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-3 opacity-20 group cursor-default">
                 <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/50" />
                  <p className="text-[10px] text-white font-semibold uppercase tracking-widest whitespace-nowrap">
                    AI Assistant
                  </p>
                 <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
