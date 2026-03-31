"use client"

import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import { Video, Copy, ExternalLink, Users, Radio, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PageProps {
    params: Promise<{ id: string }>
}

export default function TeacherLiveRoomPage({ params }: PageProps) {
    const { id: classId } = use(params)

    const [meetingRoomName, setMeetingRoomName] = useState("")
    const [currentLink, setCurrentLink] = useState<string | null>(null)
    const [className, setClassName] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)
    const [liveStarted, setLiveStarted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchMeetingInfo = async () => {
            try {
                const res = await fetch(`/api/teacher/classes/${classId}/meeting`)
                const result = await res.json()
                if (result.success) {
                    setCurrentLink(result.data.meetingLink)
                    setClassName(result.data.className)
                    if (result.data.meetingLink) setMeetingRoomName(result.data.meetingLink)
                }
            } catch {
                setError("Failed to load class info.")
            } finally {
                setLoading(false)
            }
        }
        fetchMeetingInfo()
    }, [classId])

    const generateRoomName = () => {
        const sanitized = className.toLowerCase().replace(/\s+/g, "-")
        const rand = Math.random().toString(36).substring(2, 7)
        return `educonnect-${sanitized}-${rand}`
    }

    const handleSaveRoom = async () => {
        const roomName = meetingRoomName.trim() || generateRoomName()
        setSaving(true)
        try {
            const res = await fetch(`/api/teacher/classes/${classId}/meeting`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meetingLink: roomName })
            })
            const result = await res.json()
            if (result.success) {
                setCurrentLink(result.data.meetingLink)
                setMeetingRoomName(result.data.meetingLink)
            }
        } catch {
            setError("Failed to save meeting link.")
        } finally {
            setSaving(false)
        }
    }

    const jitsiUrl = currentLink ? `https://meet.jit.si/${currentLink}` : null

    const copyToClipboard = () => {
        if (jitsiUrl) {
            navigator.clipboard.writeText(jitsiUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <RefreshCw className="w-8 h-8 animate-spin text-[#00E599]" />
        </div>
    )

    return (
        <div className="space-y-8 max-w-5xl mx-auto min-h-screen bg-[#000] -m-6 p-10 relative overflow-hidden">
             {/* Background Glow */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00E599]/5 blur-[120px] rounded-full pointer-events-none" />

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col items-center text-center mb-12">
                <div className="w-16 h-16 rounded-[2rem] bg-[#EF4444]/5 border border-[#EF4444]/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.05)]">
                    <Radio className="w-8 h-8 text-[#EF4444] animate-pulse" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
                    Live Session
                </h1>
                <p className="text-sm font-medium text-[#B5B5B5] max-w-lg">
                    Start a live session for your students. They will be notified once the session is active.
                </p>
            </motion.div>

            {error && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#EF4444]/5 border border-[#EF4444]/10 text-[#EF4444] animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                </div>
            )}

            {/* Room Setup Card */}
            <div className="grid grid-cols-1 gap-6 relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="bg-[#161616] border-[#1C1C1C] overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-[#1C1C1C] pb-6">
                            <CardTitle className="text-sm font-bold text-white flex items-center gap-3">
                                <Video className="w-4 h-4 text-[#00E599]" /> 
                                Session Settings
                            </CardTitle>
                            <CardDescription className="text-[11px] font-medium text-[#B5B5B5]">Configure your session room</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1 space-y-2 w-full">
                                    <p className="text-[11px] font-medium text-[#B5B5B5] ml-1">Session Key</p>
                                    <Input
                                        placeholder="e.g. quantum-dynamics-zero"
                                        value={meetingRoomName}
                                        onChange={(e) => setMeetingRoomName(e.target.value)}
                                        className="h-10 bg-black border-[#1C1C1C] focus-visible:ring-0 focus-visible:border-white/20 text-white font-medium rounded-lg transition-all"
                                    />
                                </div>
                                <Button onClick={handleSaveRoom} disabled={saving} className="h-10 px-6 bg-white hover:bg-white/90 text-black text-sm font-semibold rounded-lg transition-all active:scale-95 shrink-0 border-none">
                                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Confirm"}
                                </Button>
                            </div>

                            {currentLink && (
                                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-6 rounded-2xl border border-[#00E599]/10 bg-[#00E599]/5 space-y-6">
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-medium text-[#00E599] mb-1">Session Link</p>
                                            <p className="text-sm text-white font-bold truncate tracking-tight">{jitsiUrl}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Button variant="outline" size="icon" onClick={copyToClipboard} className="h-10 w-10 border-[#00E599]/20 bg-black/40 text-[#00E599] hover:bg-[#00E599] hover:text-black transition-all rounded-xl">
                                                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                             <Button variant="outline" size="icon" onClick={() => window.open(jitsiUrl!, "_blank")} className="h-10 w-10 border-[#1C1C1C] bg-black/40 text-[#B5B5B5] hover:text-white transition-all rounded-xl">
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="h-[1px] bg-[#00E599]/10 w-full" />
                                    
                                     <Button
                                        onClick={() => setLiveStarted(true)}
                                        size="lg"
                                        className={cn(
                                            "w-full h-12 rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-2xl border-none",
                                            liveStarted 
                                                ? "bg-[#00E599] text-black shadow-[0_0_30px_rgba(0,229,153,0.15)]" 
                                                : "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                                        )}
                                    >
                                        <Radio className={cn("w-4 h-4 mr-3", !liveStarted && "animate-pulse")} />
                                        {liveStarted ? "Session Active" : "Start Live Session"}
                                    </Button>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Embedded Jitsi Video */}
                {liveStarted && currentLink && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                        <div className="flex items-center justify-between bg-[#161616] border border-[#1C1C1C] p-4 rounded-2xl">
                            <div className="flex items-center gap-3">
                                 <Badge className="bg-[#EF4444] text-white text-[11px] font-bold px-3 py-1 rounded-lg animate-pulse">
                                    Live Now
                                </Badge>
                                <span className="text-[11px] font-medium text-[#B5B5B5]">Class is in progress</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-ping" />
                                <span className="text-[11px] font-medium text-[#00E599] ml-2">Connection Stable</span>
                            </div>
                        </div>
                        <div className="rounded-[2.5rem] overflow-hidden border-4 border-[#161616] shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black h-[600px]">
                            <iframe
                                id="jitsi-frame"
                                src={`https://meet.jit.si/${currentLink}#userInfo.displayName="${encodeURIComponent("Teacher (Host)")}"&config.startWithVideoMuted=false&config.startWithAudioMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`}
                                className="w-full h-full border-none"
                                allow="camera; microphone; fullscreen; display-capture"
                                title="Jitsi Live Meet Room"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Info Strip */}
                <Card className="bg-[#161616]/40 border-[#1C1C1C] border-dashed">
                    <CardContent className="py-6 flex items-start gap-6">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 border border-[#1C1C1C] flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6 text-[#B5B5B5]" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-white">Information</p>
                            <p className="text-[13px] text-[#B5B5B5] font-medium leading-relaxed">
                                Set a session key and click <span className="text-[#00E599]">"Confirm"</span>. Your students will see a <span className="text-white font-bold">"Join Live"</span> button on their portal once the session starts.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
