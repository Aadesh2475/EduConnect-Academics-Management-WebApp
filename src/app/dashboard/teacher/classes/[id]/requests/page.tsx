"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, CheckCircle, XCircle, Clock, UserCheck, UserX, Inbox, RefreshCw } from "lucide-react"
import { getInitials, formatDate, cn } from "@/lib/utils"

interface JoinRequest {
    id: string
    student: {
        id: string
        name: string
        email: string
        image: string | null
        enrollmentNo: string | null
        department: string | null
        semester: number | null
    }
    createdAt: string
}

export default function ClassRequestsPage() {
    const params = useParams()
    const classId = params.id as string
    const { toast } = useToast()

    const [requests, setRequests] = useState<JoinRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [className, setClassName] = useState<string>("")

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/teacher/classes/${classId}/requests`)
            const result = await res.json()
            if (result.success) {
                setRequests(result.data)
            } else {
                toast({ title: "Error", description: result.error || "Failed to load requests", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const fetchClassName = async () => {
        try {
            const res = await fetch(`/api/teacher/classes/${classId}`)
            const result = await res.json()
            if (result.success) {
                setClassName(result.data.name)
            }
        } catch {
            // silently ignore – class name is cosmetic
        }
    }

    useEffect(() => {
        if (classId) {
            fetchRequests()
            fetchClassName()
        }
    }, [classId])

    const handleAction = async (enrollmentId: string, action: "approve" | "reject") => {
        setProcessingId(enrollmentId)
        try {
            const res = await fetch(`/api/teacher/classes/${classId}/requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enrollmentId, action }),
            })
            const result = await res.json()

            if (result.success) {
                toast({
                    title: action === "approve" ? "Request Approved" : "Request Rejected",
                    description: action === "approve"
                        ? "Student has been enrolled in the class."
                        : "Enrollment request has been rejected.",
                    variant: action === "approve" ? "success" : "default",
                })
                // Remove handled request from the list
                setRequests(prev => prev.filter(r => r.id !== enrollmentId))
            } else {
                toast({ title: "Error", description: result.error || "Failed to process request", variant: "destructive" })
            }
        } catch {
            toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="space-y-8 min-h-screen bg-[#000] -m-6 p-8 relative overflow-hidden">
             {/* Background Glow */}
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00E599]/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1C1C1C] pb-8">
                <div className="space-y-4">
                    <Link href={`/dashboard/teacher/classes/${classId}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-[#555] hover:text-[#00E599] hover:bg-[#00E599]/5 rounded-lg group transition-all">
                            <ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Back to Sector Detail</span>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Access Petitions</h1>
                        {className && (
                            <p className="text-sm font-medium text-[#555] mt-1 flex items-center gap-2">
                                Synchronization target: <span className="text-[#888]">{className}</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-[#161616] border border-[#1C1C1C] flex items-center gap-3">
                        <Clock className="w-4 h-4 text-[#00E599] animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                            {loading ? "Scanning..." : `${requests.length} Pending Uplinks`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-28 bg-[#161616] border border-[#1C1C1C] rounded-[1.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <Card className="bg-[#161616] border-[#1C1C1C] border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-[2rem] bg-[#00E599]/5 border border-[#1C1C1C] flex items-center justify-center mb-6">
                                <Inbox className="w-8 h-8 text-[#222]" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Queue Decrypted & Clear</h3>
                            <p className="text-sm text-[#444] font-medium max-w-xs">
                                All pending access petitions have been processed. No new synchronization requests detected.
                            </p>
                            <Link href={`/dashboard/teacher/classes/${classId}`} className="mt-8">
                                <Button variant="outline" className="border-[#1C1C1C] text-[#888] hover:text-[#00E599] rounded-xl text-[10px] font-bold uppercase tracking-widest h-10 px-6 mt-4">
                                     Return to Overview
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {requests.map((request) => (
                            <Card key={request.id} className="bg-[#161616] border-[#1C1C1C] hover:border-[#00E599]/20 transition-all group overflow-hidden">
                                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6 py-6 px-8 relative">
                                    {/* Background Accent */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E599]/2 blur-[60px] rounded-full pointer-events-none group-hover:bg-[#00E599]/5 transition-all" />

                                    {/* Avatar Sector */}
                                    <div className="relative flex-shrink-0">
                                        <Avatar className="h-14 w-14 rounded-2xl border-2 border-[#1C1C1C] group-hover:border-[#00E599]/30 transition-all shadow-xl">
                                            <AvatarImage src={request.student.image ?? undefined} />
                                            <AvatarFallback className="bg-black text-[#00E599] font-bold text-lg">
                                                {getInitials(request.student.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-[#161616] border border-[#1C1C1C] flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-pulse" />
                                        </div>
                                    </div>

                                    {/* Data Sector */}
                                    <div className="flex-1 min-w-0 space-y-3 relative z-10">
                                        <div>
                                            <p className="text-base font-bold text-white tracking-tight group-hover:text-[#00E599] transition-colors">{request.student.name}</p>
                                            <p className="text-[11px] font-medium text-[#555] lowercase mt-0.5">{request.student.email}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {request.student.enrollmentNo && (
                                                <Badge className="bg-black border-[#1C1C1C] text-[#888] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg">
                                                    ID: {request.student.enrollmentNo}
                                                </Badge>
                                            )}
                                            {request.student.department && (
                                                <Badge className="bg-[#00E599]/5 border-[#00E599]/10 text-[#00E599] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg">
                                                    {request.student.department}
                                                </Badge>
                                            )}
                                            {request.student.semester && (
                                                <Badge className="bg-black border-[#1C1C1C] text-[#888] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg">
                                                    SEM {request.student.semester}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Sector */}
                                    <div className="flex flex-col items-end gap-3 flex-shrink-0 relative z-10">
                                        <p className="text-[10px] font-bold text-[#333] uppercase tracking-widest">
                                            Petition Received: {formatDate(request.createdAt)}
                                        </p>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 sm:flex-none h-10 px-5 border-[#1C1C1C] bg-[#1C1C1C]/30 text-[#888] hover:text-[#EF4444] hover:bg-[#EF4444]/5 hover:border-[#EF4444]/20 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest"
                                                disabled={processingId === request.id}
                                                onClick={() => handleAction(request.id, "reject")}
                                            >
                                                <UserX className="w-3.5 h-3.5 mr-2" />
                                                Decline
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1 sm:flex-none h-10 px-6 bg-[#00E599] hover:bg-[#00E599]/90 text-black rounded-xl transition-all font-bold text-[10px] uppercase tracking-[0.1em] shadow-[0_0_20px_rgba(0,229,153,0.1)] active:scale-95"
                                                disabled={processingId === request.id}
                                                onClick={() => handleAction(request.id, "approve")}
                                            >
                                                {processingId === request.id ? (
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <UserCheck className="w-3.5 h-3.5 mr-2" />
                                                        Authorize
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
