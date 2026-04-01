"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  GraduationCap,
  Clock,
  Calendar,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Users
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SkeletonDashboard } from "@/components/ui/skeleton"

export default function StudentAcademicsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchAcademics = async () => {
      try {
        const res = await fetch("/api/student/academics/overview")
        if (res.ok) {
          const json = await res.json()
          setData(json.data)
        }
      } catch (error) {
        console.error("Failed to load academics overview:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAcademics()
  }, [])

  if (loading || !data) {
    return <SkeletonDashboard />
  }

  const { student, classes, examStats, assignmentStats, attendanceStats, upcomingEvents } = data

  return (
    <div className="flex-1 space-y-6 p-8 bg-[#090909] min-h-screen">
      <div className="flex items-center justify-between bg-[#161616] p-6 rounded-2xl border border-[#1C1C1C] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Academic Details</h1>
          <p className="text-[#9A9A9A] text-sm">Real-time overview of your academic standing.</p>
        </div>
        <div className="text-right">
          <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 mb-2 shadow-none font-bold tracking-widest text-[10px] uppercase">
            Semester {student.semester}
          </Badge>
          <p className="text-sm font-bold text-white mb-0.5">{student.department} • Section {student.section}</p>
          <p className="text-xs font-semibold text-[#666] uppercase tracking-widest">{student.enrollmentNo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classes & Tutors */}
        <Card className="hover:shadow-md transition-shadow bg-[#161616] border-[#1C1C1C] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A] mb-1.5">Enrolled Classes</p>
                <h3 className="text-3xl font-bold text-white mt-1">{classes.length}</h3>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams */}
        <Card className="hover:shadow-md transition-shadow bg-[#161616] border-[#1C1C1C] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A] mb-1.5">Exam Average</p>
                <div className="flex items-baseline gap-2 mt-1 mb-3">
                  <h3 className="text-3xl font-bold text-white">{examStats.average}%</h3>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#555]">of {examStats.total} total</span>
                </div>
                <Progress value={examStats.average} className="h-1.5 bg-[#1C1C1C]" />
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl ml-4">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card className="hover:shadow-md transition-shadow bg-[#161616] border-[#1C1C1C] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A] mb-1.5">Assignment Average</p>
                <div className="flex items-baseline gap-2 mt-1 mb-3">
                  <h3 className="text-3xl font-bold text-white">{assignmentStats.average}%</h3>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#555]">{assignmentStats.pending} pending</span>
                </div>
                <Progress value={assignmentStats.average} className="h-1.5 bg-[#1C1C1C]" />
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl ml-4">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="hover:shadow-md transition-shadow bg-[#161616] border-[#1C1C1C] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A] mb-1.5">Attendance Rate</p>
                <div className="flex items-baseline gap-2 mt-1 mb-3">
                  <h3 className="text-3xl font-bold text-white">{attendanceStats.rate}%</h3>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#555]">{attendanceStats.present}/{attendanceStats.total}</span>
                </div>
                <Progress value={attendanceStats.rate} className="h-1.5 bg-[#1C1C1C]" />
              </div>
              <div className={cn("p-3 rounded-xl border ml-4", attendanceStats.rate >= 75 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500")}>
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-[#111111] border border-[#1C1C1C] p-1 rounded-xl h-12">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-[#9A9A9A] font-bold tracking-widest uppercase text-xs px-6">Overview</TabsTrigger>
          <TabsTrigger value="external" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-[#9A9A9A] font-bold tracking-widest uppercase text-xs px-6">External Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classes Table */}
            <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl">
              <CardHeader className="border-b border-[#252525]">
                <CardTitle className="flex items-center gap-2 text-white">
                  <BookOpen className="w-4 h-4 text-[#888]" />
                  Enrolled Classes & Tutors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {classes.length === 0 ? (
                  <p className="text-sm text-[#555] text-center py-6">You are not enrolled in any classes.</p>
                ) : (
                  <div className="space-y-4">
                    {classes.map((cls: any) => (
                      <div key={cls.id} className="flex items-center justify-between p-4 rounded-xl border border-[#252525] bg-[#111111] hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-[#252525] text-white font-bold flex items-center justify-center text-lg shadow-sm">
                            {cls.code.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-white leading-tight">{cls.name}</p>
                            <p className="text-xs font-semibold text-[#7A7A7A] flex items-center gap-1.5 mt-1"><User className="w-3.5 h-3.5 text-[#555]" /> {cls.teacher}</p>
                          </div>
                        </div>
                        <Badge className="bg-[#1F1F1F] text-[#888] border-[#252525] font-bold uppercase tracking-widest text-[10px] hover:bg-[#1F1F1F]">{cls.code}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl">
              <CardHeader className="border-b border-[#252525]">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4 text-[#888]" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-10 bg-[#111111] border border-[#252525] rounded-xl border-dashed">
                    <p className="text-sm font-bold text-[#555] mt-2">No upcoming events scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event: any) => (
                      <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl border border-[#252525] bg-[#111111] hover:bg-white/5 transition-colors">
                        <div className="text-center min-w-[50px] bg-[#1A1A1A] border border-[#252525] rounded-lg p-2 shrink-0">
                          <p className="text-[10px] font-bold text-[#888] uppercase tracking-widest">
                            {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                          </p>
                          <p className="text-xl font-bold text-white leading-none mt-1">
                            {new Date(event.startDate).getDate()}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-white text-base leading-tight">{event.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="text-[9px] uppercase tracking-widest border border-dashed text-white border-white/20 bg-white/5 px-2">{event.type}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="external" className="space-y-6 mt-0 outline-none">
          <Card className="bg-[#161616] border-[#1C1C1C] rounded-2xl">
            <CardHeader className="border-b border-[#252525]">
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-4 h-4 text-[#888]" />
                External Exam Reports
              </CardTitle>
              <CardDescription className="text-[#888] text-xs font-semibold mt-1">
                Results from physical exams, unit tests and end-semester assessments.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {(!data.externalExams || data.externalExams.length === 0) ? (
                <div className="text-center py-20 bg-[#111111] border border-[#252525] rounded-xl border-dashed">
                   <FileText className="w-12 h-12 mx-auto text-[#333] mb-4" />
                   <h3 className="text-base font-bold text-white">No external results yet</h3>
                   <p className="text-[#777] text-sm mt-1">Your physical exam marks will appear here once uploaded by teachers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.externalExams.map((report: any) => (
                    <Card key={report.id} className="bg-[#111111] border-[#252525] overflow-hidden rounded-xl">
                      <div className="h-1 bg-white/20" />
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <Badge className="bg-[#1F1F1F] text-[#888] border-[#252525] text-[9px] font-bold tracking-widest uppercase mb-2 hover:bg-[#1F1F1F]">
                              {report.examType}
                            </Badge>
                            <h4 className="font-bold text-white text-lg tracking-tight uppercase leading-tight">
                              {report.testName || "Examination"}
                            </h4>
                            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mt-1.5">{report.className} ({report.classCode})</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-white">
                              {report.percentage}%
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-[#161616] rounded-xl border border-[#252525]">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-[#888]">Obtained Score</span>
                          <span className="text-sm font-bold text-white">
                            {report.obtainedMarks} <span className="text-[#555] font-normal">/ {report.totalMarks}</span>
                          </span>
                        </div>

                        {report.note && (
                          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-xs text-[#AAA] italic font-medium leading-relaxed">
                             <strong className="text-white not-italic block mb-1 text-[10px] uppercase tracking-widest">Teacher's Note:</strong> {report.note}
                            </p>
                          </div>
                        )}

                        <div className="mt-6 pt-5 border-t border-[#252525] flex justify-end">
                            <Button 
                              variant="ghost" 
                              className="text-[#9A9A9A] hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest h-9 border border-[#252525]"
                              onClick={() => {
                                window.location.href = `/dashboard/student/reports?subject=Issue regarding ${report.testName || report.examType}&type=ACADEMIC`
                              }}
                            >
                              <AlertCircle className="w-3.5 h-3.5 mr-2 text-[#666]" />
                              Raise Issue
                            </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
