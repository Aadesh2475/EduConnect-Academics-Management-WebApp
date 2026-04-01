"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Search,
  Plus,
  Copy,
  Users,
  Calendar,
  Clock,
  FileText,
  MoreHorizontal,
  Eye,
  LogOut,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { RaiseIssueDialog } from "@/components/student/RaiseIssueDialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { SkeletonTable } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { getInitials, cn } from "@/lib/utils"
import Link from "next/link"

interface EnrolledClass {
  id: string
  name: string
  code: string
  description?: string
  subject: string
  department: string
  semester: number
  isActive: boolean
  teacher: {
    name: string
    email: string
    image?: string
  }
  enrollmentStatus: "APPROVED" | "PENDING" | "REJECTED"
  joinedAt?: string
  progress: number
  assignmentsDue: number
  _count: {
    enrollments: number
    assignments: number
    materials: number
    exams: number
  }
}

export default function StudentClassesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<EnrolledClass[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [activeTab, setActiveTab] = useState("enrolled")

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/student/classes")
      const result = await res.json()

      if (res.ok) {
        setClasses(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load classes",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      toast({ title: "Error", description: "Please enter a class code", variant: "destructive" })
      return
    }

    setJoining(true)
    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.toUpperCase() }),
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Join request sent! Waiting for approval.",
          variant: "success",
        })
        setShowJoinDialog(false)
        setJoinCode("")
        fetchClasses() // Refresh the list
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to join class",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send join request",
        variant: "destructive"
      })
    } finally {
      setJoining(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: "Copied!", description: `Class code ${code} copied to clipboard` })
  }

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const enrolledClasses = filteredClasses.filter(c => c.enrollmentStatus === "APPROVED")
  const pendingClasses = filteredClasses.filter(c => c.enrollmentStatus === "PENDING")

  return (
    <div className="space-y-8 p-8 bg-[#090909] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight border-none bg-transparent">My Classes</h1>
          <p className="text-[#888] text-sm font-medium mt-1">View and manage your academic sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={fetchClasses} disabled={loading} className="border-[#1C1C1C] text-[#888] hover:text-white hover:bg-white/5 transition-all">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button onClick={() => setShowJoinDialog(true)} className="bg-white hover:bg-white/90 text-black font-semibold rounded-xl px-6 h-10 transition-all active:scale-95 border-none">
            <Plus className="w-4 h-4 mr-2" />
            Join Class
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enrolled Classes", value: enrolledClasses.length, icon: BookOpen, color: "emerald" },
          { label: "Pending Requests", value: pendingClasses.length, icon: Clock, color: "emerald" },
          { label: "Assignments Due", value: classes.reduce((acc, c) => acc + (c.assignmentsDue || 0), 0), icon: FileText, color: "emerald" },
          { label: "Avg. Progress", value: `${enrolledClasses.length > 0 ? Math.round(enrolledClasses.reduce((acc, c) => acc + c.progress, 0) / enrolledClasses.length) : 0}%`, icon: CheckCircle, color: "emerald" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-[#161616] border-[#1C1C1C]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white leading-none">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#1F1F1F] border border-[#1C1C1C] flex items-center justify-center text-white">
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <Card className="bg-[#161616] border-[#1C1C1C]">
        <CardContent className="p-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#444] group-focus-within:text-white w-4 h-4 transition-colors" />
            <Input
              placeholder="Search classes by name, code, or teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#000] border-[#1C1C1C] focus:border-white/40 text-sm text-white placeholder:text-[#444] h-11 rounded-xl transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classes Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#161616] border border-[#1C1C1C] p-1 rounded-xl shadow-sm h-12">
          <TabsTrigger value="enrolled" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/20 border border-transparent transition-all px-6 text-xs font-bold uppercase tracking-wider gap-2">
            <CheckCircle className="w-4 h-4" />
            Enrolled <Badge className="ml-1 bg-white text-black border-0 text-[10px]">{enrolledClasses.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:border-white/20 border border-transparent transition-all px-6 text-xs font-bold uppercase tracking-wider gap-2">
            <Clock className="w-4 h-4" />
            Pending <Badge className="ml-1 bg-[#1C1C1C] text-[#888] border-0 text-[10px]">{pendingClasses.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i}><CardContent className="p-6 bg-[#161616] border-[#1C1C1C]"><SkeletonTable /></CardContent></Card>
              ))}
            </div>
          ) : enrolledClasses.length === 0 ? (
            <Card className="bg-[#161616] border-[#1C1C1C] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <CardContent className="p-16 text-center relative z-10">
                <BookOpen className="w-12 h-12 mx-auto text-[#444] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No classes joined</h3>
                <p className="text-[#555] text-xs font-medium mb-8 max-w-xs mx-auto">Use the class code provided by your teacher to enroll in your academic sessions.</p>
                <Button onClick={() => setShowJoinDialog(true)} className="bg-white hover:bg-white/90 text-black font-semibold h-11 px-8 rounded-xl shadow-lg transition-all active:scale-95 border-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Join Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {enrolledClasses.map((cls, index) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/dashboard/student/classes/${cls.id}`}>
                      <Card className="bg-[#161616] border-[#1C1C1C] hover:border-white/30 transition-all cursor-pointer group h-full overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors leading-tight">
                                {cls.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-[#1F1F1F] text-[#888] border-[#1C1C1C] font-bold text-[10px] tracking-wider">{cls.code}</Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-[#444] hover:text-white hover:bg-transparent"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopyCode(cls.code) }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#444] hover:text-white group-hover:bg-white/5">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#1F1F1F] border-[#1C1C1C] text-white">
                                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-xs font-semibold">
                                  <Eye className="mr-2 h-4 w-4 text-white" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-xs font-semibold">
                                  <MessageSquare className="mr-2 h-4 w-4 text-white" />
                                  Message Teacher
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <RaiseIssueDialog
                                    defaultCategory="GENERAL"
                                    classId={cls.id}
                                    defaultTitle={`Issue with Class: ${cls.name}`}
                                    trigger={
                                      <div className="flex w-full items-center px-2 py-1.5 text-xs font-semibold text-yellow-500 cursor-pointer hover:bg-yellow-500/10 rounded-sm">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Report Issue
                                      </div>
                                    }
                                  />
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500 hover:bg-red-500/10 cursor-pointer text-xs font-semibold">
                                  <LogOut className="mr-2 h-4 w-4" />
                                  Leave Class
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-black border border-[#1C1C1C]">
                            <Avatar className="h-9 w-9 border border-[#1C1C1C]">
                              <AvatarImage src={cls.teacher.image} />
                              <AvatarFallback className="bg-white text-black text-xs font-bold">
                                {getInitials(cls.teacher.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{cls.teacher.name}</p>
                              <p className="text-[10px] font-medium text-[#555] uppercase tracking-wider">{cls.subject}</p>
                            </div>
                          </div>

                          <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                              <span className="text-[#444]">Course Progress</span>
                              <span className="text-white">{cls.progress}%</span>
                            </div>
                            <Progress value={cls.progress} className="h-1.5 bg-[#1C1C1C]" />
                          </div>

                          {cls.assignmentsDue > 0 && (
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-6">
                              <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                              </div>
                              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{cls.assignmentsDue} Task{cls.assignmentsDue > 1 ? 's' : ''} Pending</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-[#1C1C1C]">
                            <div className="flex items-center gap-1.5 text-[#444] group-hover:text-white transition-colors">
                              <Users className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">{cls._count.enrollments}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#444] group-hover:text-white transition-colors">
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">{cls._count.assignments}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#444] group-hover:text-white transition-colors">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">{cls._count.materials}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pendingClasses.length === 0 ? (
            <Card className="bg-[#161616] border-[#1C1C1C] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <CardContent className="p-16 text-center relative z-10">
                <Clock className="w-12 h-12 mx-auto text-[#444] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No pending requests</h3>
                <p className="text-[#555] text-xs font-medium max-w-xs mx-auto">Your enrollment requests will appear here while waiting for teacher approval.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingClasses.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-[#161616] border-[#1C1C1C]">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                          Pending Approval
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{cls.name}</h3>
                      <Badge className="bg-[#1F1F1F] text-[#888] border-[#1C1C1C] font-bold text-[10px] tracking-wider mb-6">{cls.code}</Badge>

                      <div className="flex items-center gap-4 p-3 rounded-xl bg-[#000] border border-[#1C1C1C]">
                        <Avatar className="h-9 w-9 border border-[#1C1C1C]">
                          <AvatarImage src={cls.teacher.image} />
                          <AvatarFallback className="bg-white text-black text-xs font-bold">
                            {getInitials(cls.teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-white mb-0.5">{cls.teacher.name}</p>
                          <p className="text-[10px] font-medium text-[#555] uppercase tracking-wider">{cls.department}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Join Class Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="bg-[#090909] border-[#1C1C1C] text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight border-none bg-transparent">Join a Class</DialogTitle>
            <DialogDescription className="text-[#888] text-sm font-medium">
              Enter the unique class code to request admission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-4">
              <Label htmlFor="classCode" className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Access Key</Label>
              <Input
                id="classCode"
                placeholder="e.g., CS201"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="text-center text-2xl font-bold tracking-[0.2em] h-16 bg-[#000] border-[#1C1C1C] focus:border-white/40 text-white placeholder:text-[#222] transition-colors"
              />
            </div>
            <div className="bg-[#161616] border border-[#1C1C1C] p-4 rounded-xl">
              <p className="text-xs text-[#888] leading-relaxed">
                <strong className="text-white">Note:</strong> Your membership will require instructor validation before you can access the curriculum.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowJoinDialog(false)} className="border-[#1C1C1C] text-[#888] hover:bg-white/5 font-bold transition-all">
              Cancel
            </Button>
            <Button onClick={handleJoinClass} disabled={joining} className="bg-white hover:bg-white/90 text-black font-semibold px-8 rounded-xl h-10 transition-all active:scale-95 border-none">
              {joining ? "Sending Request..." : "Request Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
