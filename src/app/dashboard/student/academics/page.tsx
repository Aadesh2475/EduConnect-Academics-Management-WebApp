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
    <div className="flex-1 space-y-6 p-8 bg-slate-50 bg-[#1F1F1F] min-h-screen">
      <div className="flex items-center justify-between bg-white bg-[#090909] p-6 rounded-2xl border border-slate-200 border-[#1C1C1C] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Academic Details</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Real-time overview of your academic standing.</p>
        </div>
        <div className="text-right">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 mb-1 shadow-none">
            Semester {student.semester}
          </Badge>
          <p className="text-sm font-medium text-slate-700 dark:text-gray-300">{student.department} • Section {student.section}</p>
          <p className="text-xs text-slate-500 dark:text-gray-500">{student.enrollmentNo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classes & Tutors */}
        <Card className="hover:shadow-md transition-shadow bg-[#090909] border-[#1C1C1C]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Enrolled Classes</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{classes.length}</h3>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams */}
        <Card className="hover:shadow-md transition-shadow bg-[#090909] border-[#1C1C1C]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Exam Average</p>
                <div className="flex items-baseline gap-2 mt-1 mb-2">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{examStats.average}%</h3>
                  <span className="text-xs text-slate-500">of {examStats.total} total</span>
                </div>
                <Progress value={examStats.average} className="h-2 bg-slate-100 bg-[#161616]" indicatorClassName="bg-purple-500" />
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl ml-4">
                <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card className="hover:shadow-md transition-shadow bg-[#090909] border-[#1C1C1C]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Assignment Average</p>
                <div className="flex items-baseline gap-2 mt-1 mb-2">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{assignmentStats.average}%</h3>
                  <span className="text-xs text-slate-500">{assignmentStats.pending} pending</span>
                </div>
                <Progress value={assignmentStats.average} className="h-2 bg-slate-100 bg-[#161616]" indicatorClassName="bg-amber-500" />
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl ml-4">
                <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="hover:shadow-md transition-shadow bg-[#090909] border-[#1C1C1C]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Attendance Rate</p>
                <div className="flex items-baseline gap-2 mt-1 mb-2">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{attendanceStats.rate}%</h3>
                  <span className="text-xs text-slate-500">{attendanceStats.present}/{attendanceStats.total}</span>
                </div>
                <Progress value={attendanceStats.rate} className={"h-2 bg-slate-100 bg-[#161616]"} indicatorClassName={attendanceStats.rate >= 75 ? "bg-green-500" : "bg-red-500"} />
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl ml-4">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white bg-[#090909] border border-slate-200 border-[#1C1C1C] p-1 rounded-xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="external">External Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classes Table */}
            <Card className="bg-[#090909] border-[#1C1C1C] shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Enrolled Classes & Tutors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">You are not enrolled in any classes.</p>
                ) : (
                  <div className="space-y-4">
                    {classes.map((cls: any) => (
                      <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 border-[#1C1C1C] bg-slate-50/50 bg-[#1F1F1F]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-sm">
                            {cls.code.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{cls.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><User className="w-3 h-3" /> {cls.teacher}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 bg-[#161616] dark:text-gray-300">{cls.code}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="bg-[#090909] border-[#1C1C1C] shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-600" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No upcoming events scheduled.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event: any) => (
                      <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg border-l-4 border-rose-500 bg-rose-50/50 dark:bg-rose-900/10">
                        <div className="text-center min-w-[50px]">
                          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">
                            {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                          </p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white leading-none mt-1">
                            {new Date(event.startDate).getDate()}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white leading-tight">{event.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] uppercase border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-400">{event.type}</Badge>
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

        <TabsContent value="external" className="space-y-6 mt-0">
          <Card className="bg-[#090909] border-[#1C1C1C] shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                External Exam Reports
              </CardTitle>
              <CardDescription>
                Results from physical exams, unit tests and end-semester assessments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!data.externalExams || data.externalExams.length === 0) ? (
                <div className="text-center py-12">
                   <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                   <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No external results yet</h3>
                   <p className="text-gray-500">Your physical exam marks will appear here once uploaded by teachers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.externalExams.map((report: any) => (
                    <Card key={report.id} className="border-slate-100 border-[#1C1C1C] overflow-hidden">
                      <div className="h-1 bg-orange-500" />
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <Badge variant="outline" className="text-[10px] uppercase mb-1">
                              {report.examType}
                            </Badge>
                            <h4 className="font-bold text-slate-900 dark:text-white uppercase">
                              {report.testName || "Examination"}
                            </h4>
                            <p className="text-xs text-slate-500">{report.className} ({report.classCode})</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black text-orange-600">
                              {report.percentage}%
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-slate-50 bg-[#1F1F1F] rounded-lg border border-slate-100 border-[#1C1C1C]">
                          <span className="text-sm font-medium text-slate-600 dark:text-gray-400">Obtained Score</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {report.obtainedMarks} <span className="text-slate-400 font-normal">/ {report.totalMarks}</span>
                          </span>
                        </div>

                        {report.note && (
                          <div className="mt-4 p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                            <p className="text-xs text-orange-800 dark:text-orange-300 italic">
                             <strong>Teacher's Note:</strong> {report.note}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-100 border-[#1C1C1C] flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs"
                              onClick={() => {
                                window.location.href = `/dashboard/student/reports?subject=Issue regarding ${report.testName || report.examType}&type=ACADEMIC`
                              }}
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
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
