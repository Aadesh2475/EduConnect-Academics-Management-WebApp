"use client"

import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import { Video, Radio, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PageProps {
    params: Promise<{ id: string }>
}

export default function StudentLiveRoomPage({ params }: PageProps) {
    const { id: classId } = use(params)

    const [meetingLink, setMeetingLink] = useState<string | null>(null)
    const [className, setClassName] = useState("")
    const [loading, setLoading] = useState(true)
    const [joined, setJoined] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchMeeting = async () => {
        try {
            // Reuse the same teacher API — it's readable by any authenticated user
            const res = await fetch(`/api/teacher/classes/${classId}/meeting`)
            const result = await res.json()
            if (result.success) {
                setMeetingLink(result.data.meetingLink)
                setClassName(result.data.className)
            }
        } catch {
            setError("Failed to load meeting info.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMeeting()
        // Auto-refresh every 30 seconds to detect if teacher has started a session
        const interval = setInterval(fetchMeeting, 30_000)
        return () => clearInterval(interval)
    }, [classId])

    const jitsiUrl = meetingLink ? `https://meet.jit.si/${meetingLink}` : null

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    )

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold dark:text-white tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                    </div>
                    Live Session
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">{className} — Join your teacher&apos;s live video lecture.</p>
            </motion.div>

            {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {!meetingLink ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="bg-[#1F1F1F] border-[#1C1C1C]">
                        <CardContent className="py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 bg-[#161616] flex items-center justify-center mx-auto mb-4">
                                <WifiOff className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold dark:text-white mb-2">No Live Session Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                                Your teacher hasn&apos;t started a live session for this class yet. This page refreshes automatically every 30 seconds. Check back soon!
                            </p>
                            <Button variant="outline" onClick={fetchMeeting} className="border-[#1C1C1C]">
                                <Wifi className="w-4 h-4 mr-2" /> Refresh Now
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                    <Card className="bg-[#1F1F1F] border-[#1C1C1C]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 dark:text-white">
                                <Badge className="bg-red-500 text-white animate-pulse gap-1.5"><Radio className="w-3 h-3" /> LIVE</Badge>
                                Live Session is Active!
                            </CardTitle>
                            <CardDescription>
                                Your teacher has started a live class. Click Join to enter the session.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!joined ? (
                                <Button
                                    onClick={() => setJoined(true)}
                                    size="lg"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                >
                                    <Video className="w-5 h-5" />
                                    🎓 Join Live Lecture
                                </Button>
                            ) : null}
                        </CardContent>
                    </Card>

                    {joined && jitsiUrl && (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl overflow-hidden border border-[#1C1C1C] shadow-xl" style={{ height: "560px" }}>
                            <iframe
                                src={`${jitsiUrl}#userInfo.displayName="${encodeURIComponent("Student")}"&config.startWithVideoMuted=true&config.startWithAudioMuted=true&interfaceConfig.SHOW_JITSI_WATERMARK=false`}
                                style={{ width: "100%", height: "100%", border: "none" }}
                                allow="camera; microphone; fullscreen; display-capture"
                                title="Jitsi Live Meet Room"
                            />
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    )
}
