"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  UserPlus,
  Search,
  Check,
  X,
  Clock,
  Users,
  BookOpen,
  Filter,
  Mail,
  Calendar,
  AlertCircle
} from "lucide-react"
import { getInitials, cn } from "@/lib/utils"

interface Registration {
  id: string
  studentName: string
  studentEmail: string
  studentImage?: string
  className: string
  classCode: string
  department: string
  semester: string
  requestDate: string
  status: "pending" | "approved" | "rejected"
  enrollmentNumber?: string
}

export default function TeacherRegistrationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [classFilter, setClassFilter] = useState("all")

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/teacher/registrations")
      const data = await res.json()
      if (data.success) {
        setRegistrations(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error)
      toast({ title: "Error", description: "Failed to load registrations", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/teacher/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      })
      const data = await res.json()

      if (data.success) {
        setRegistrations(registrations.map(r =>
          r.id === id ? { ...r, status } : r
        ))
        toast({
          title: `Registration ${status}`,
          description: status === "approved" ? "Student has been approved." : "Request rejected.",
          variant: status === "approved" ? "default" : "destructive"
        })
      } else {
        toast({ title: "Error", description: data.error || "Failed to update status", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" })
    }
  }

  const handleApprove = (id: string) => handleUpdateStatus(id, "approved")
  const handleReject = (id: string) => handleUpdateStatus(id, "rejected")

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.className.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || reg.status === statusFilter
    const matchesClass = classFilter === "all" || reg.classCode === classFilter
    return matchesSearch && matchesStatus && matchesClass
  })

  const stats = {
    pending: registrations.filter(r => r.status === "pending").length,
    approved: registrations.filter(r => r.status === "approved").length,
    rejected: registrations.filter(r => r.status === "rejected").length,
  }

  const uniqueClasses = Array.from(new Set(registrations.map(r => r.classCode)))
    .map(code => {
      const reg = registrations.find(r => r.classCode === code)
      return { code, name: reg?.className || code }
    })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1F1F1F] rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-[#1F1F1F] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Registration Requests</h1>
          <p className="text-[#9A9A9A] text-[13px] mt-1">Manage student applications for your sessions</p>
        </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Pending Requests", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Confirmed Students", value: stats.approved, icon: Check, color: "text-white", bg: "bg-white/5", border: "border-white/10" },
          { label: "Declined Requests", value: stats.rejected, icon: X, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
        ].map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className={cn("border-[#1C1C1C] bg-[#161616] hover:border-[#2C2C2C] transition-all group overflow-hidden relative")}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between relative z-10">
                   <div>
                    <p className="text-[11px] font-medium text-[#B5B5B5]">{stat.label}</p>
                    <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
                  </div>
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border transition-all", stat.bg, stat.border)}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-[#1C1C1C] bg-[#161616]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9A9A9A] w-4 h-4" />
              <Input
                placeholder="Search by student or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#666666] focus:ring-white/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-[#1F1F1F] border-[#1C1C1C] text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                <SelectItem value="all" className="focus:bg-[#1F1F1F] focus:text-white">All Status</SelectItem>
                <SelectItem value="pending" className="focus:bg-[#1F1F1F] focus:text-white">Pending</SelectItem>
                <SelectItem value="approved" className="focus:bg-[#1F1F1F] focus:text-white">Approved</SelectItem>
                <SelectItem value="rejected" className="focus:bg-[#1F1F1F] focus:text-white">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-[#1F1F1F] border-[#1C1C1C] text-white">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                <SelectItem value="all" className="focus:bg-[#1F1F1F] focus:text-white">All Classes</SelectItem>
                {uniqueClasses.map((cls, idx) => (
                  <SelectItem key={idx} value={cls.code} className="focus:bg-[#1F1F1F] focus:text-white">{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Registrations List */}
      <Card className="border-[#1C1C1C] bg-[#161616] overflow-hidden">
        <CardHeader className="border-b border-[#1C1C1C] bg-[#1C1C1C]/30">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <UserPlus className="w-5 h-5 text-[#FFFFFF]" />
            Request Log
          </CardTitle>
          <CardDescription className="text-[#9A9A9A]">
            Showing {filteredRegistrations.length} enrollment request{filteredRegistrations.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-[2rem] bg-[#1F1F1F] border border-[#1C1C1C] flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-[#444]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Requests Found</h3>
              <p className="text-sm text-[#9A9A9A] max-w-xs">There are no enrollment requests matching your current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1C1C1C]">
              <AnimatePresence mode="popLayout">
                {filteredRegistrations.map((registration, idx) => (
                  <motion.div
                    key={registration.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 hover:bg-[#1C1C1C]/20 transition-colors group"
                  >
                    <Avatar className="h-12 w-12 border border-[#1C1C1C]">
                      <AvatarImage src={registration.studentImage} />
                      <AvatarFallback className="bg-[#1F1F1F] text-white font-bold">{getInitials(registration.studentName)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <h3 className="font-bold text-white text-base tracking-tight">{registration.studentName}</h3>
                           <Badge
                            className={cn(
                              "text-[10px] font-bold px-1.5 h-4 border-none",
                              registration.status === "approved" ? "bg-[#FFFFFF]/10 text-[#FFFFFF]" :
                                registration.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-[#1F1F1F] text-[#B5B5B5]"
                            )}
                          >
                            {registration.status === "approved" ? "Confirmed" : registration.status === "rejected" ? "Declined" : "Pending"}
                          </Badge>
                      </div>
                       <div className="flex flex-wrap gap-y-1 gap-x-4 text-[11px] text-[#B5B5B5] mt-2">
                        <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                          <Mail className="w-3.5 h-3.5" />
                          {registration.studentEmail}
                        </span>
                        <span className="flex items-center gap-1.5 text-[#FFFFFF]">
                          <BookOpen className="w-3.5 h-3.5" />
                          {registration.className}
                          <code className="text-[#FFFFFF]/60 ml-0.5">· {registration.classCode}</code>
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(registration.requestDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      {registration.status === "pending" ? (
                        <>
                           <Button
                            size="sm"
                            onClick={() => handleReject(registration.id)}
                            className="flex-1 sm:flex-none h-9 rounded-xl border-[#1C1C1C] bg-[#1F1F1F] text-red-400 hover:bg-red-500/10 hover:border-red-500/20 font-semibold transition-all text-sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(registration.id)}
                            className="flex-1 sm:flex-none h-9 rounded-xl bg-white hover:bg-white/90 text-black font-semibold shadow-lg transition-all active:scale-95 border-none text-sm"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Confirm
                          </Button>
                        </>
                      ) : (
                         <div className="flex items-center gap-2 px-4 py-2 bg-[#1F1F1F] rounded-xl border border-[#1C1C1C] text-[11px] font-medium text-[#B5B5B5]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Processed
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
