"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  ChevronRight,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import Link from "next/link"

interface ExamResult {
  id: string
  title: string
  className: string
  classCode: string
  type: string
  totalMarks: number
  passingMarks: number | null
  duration: number
  status: string
  startTime: string
  attempt?: {
    obtainedMarks: number | null
    percentage: number | null
    submittedAt: string | null
  } | null
}

interface Stats {
  total: number
  completed: number
  upcoming: number
  available: number
  avgScore: number
}

export default function StudentResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<ExamResult[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, upcoming: 0, available: 0, avgScore: 0 })

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch("/api/student/exams")
        if (res.ok) {
          const data = await res.json()
          setExams(data.data || [])
          setStats(data.stats || { total: 0, completed: 0, upcoming: 0, available: 0, avgScore: 0 })
        }
      } catch (error) {
        console.error("Failed to load results:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [])

  const getGradeFromPercentage = (pct: number) => {
    if (pct >= 90) return { grade: "A+", color: "text-emerald-600 dark:text-emerald-400" }
    if (pct >= 80) return { grade: "A", color: "text-green-600 dark:text-green-400" }
    if (pct >= 70) return { grade: "B", color: "text-blue-600 dark:text-blue-400" }
    if (pct >= 60) return { grade: "C", color: "text-yellow-600 dark:text-yellow-400" }
    if (pct >= 50) return { grade: "D", color: "text-orange-600 dark:text-orange-400" }
    return { grade: "F", color: "text-red-600 dark:text-red-400" }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return {
          border: "border-t-blue-500",
          badge: <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Completed</Badge>,
        }
      case "AVAILABLE":
        return {
          border: "border-t-green-500",
          badge: <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 animate-pulse">Live</Badge>,
        }
      case "UPCOMING":
        return {
          border: "border-t-yellow-400",
          badge: <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">Upcoming</Badge>,
        }
      case "MISSED":
        return {
          border: "border-t-red-500",
          badge: <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Missed</Badge>,
        }
      case "IN_PROGRESS":
        return {
          border: "border-t-orange-500",
          badge: <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">In Progress</Badge>,
        }
      default:
        return { border: "border-t-gray-300", badge: <Badge variant="outline">{status}</Badge> }
    }
  }

  const completedExams = exams.filter(e => e.status === "COMPLETED" && e.attempt?.percentage != null)

  if (loading) return <SkeletonDashboard />

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Results</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View your exam results and performance</p>
        </div>
        <Link href="/dashboard/student/exams">
          <Button variant="outline" size="sm" className="border-[#1C1C1C] dark:text-gray-300 dark:hover:bg-white/5">
            Take Exams <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Exams", value: stats.total, icon: FileText, color: "blue" },
          { label: "Completed", value: stats.completed, icon: CheckCircle, color: "green" },
          { label: "Average Score", value: `${stats.avgScore}%`, icon: TrendingUp, color: "purple" },
          { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "orange" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-[#090909] border-[#1C1C1C]">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Exam Results List */}
      <Card className="bg-[#090909] border-[#1C1C1C]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Exam Results
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Your performance across all exams</CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 bg-[#161616] flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No exams yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Your exam results will appear here</p>
              <Link href="/dashboard/student/exams">
                <Button variant="outline" size="sm" className="border-[#1C1C1C] dark:text-gray-300">
                  View Available Exams
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam, index) => {
                const gradeInfo = exam.attempt?.percentage != null
                  ? getGradeFromPercentage(exam.attempt.percentage) : null
                const statusConfig = getStatusConfig(exam.status)
                const isCompleted = exam.status === "COMPLETED"
                const isLive = exam.status === "AVAILABLE" || exam.status === "IN_PROGRESS"

                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <div
                      className={`flex items-center gap-4 p-4 rounded-xl border-t-4 border border-gray-100 border-[#1C1C1C] bg-white bg-[#1F1F1F] hover:shadow-md dark:hover:bg-white/5/50 transition-all cursor-pointer ${statusConfig.border}`}
                      onClick={() => router.push(`/dashboard/student/exams/${exam.id}`)}
                    >
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase dark:border-gray-600 dark:text-gray-400">
                            {exam.type}
                          </Badge>
                          {statusConfig.badge}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{exam.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="bg-gray-100 bg-[#161616] px-2 py-0.5 rounded-full font-medium">
                            {exam.className} • {exam.classCode}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(exam.startTime).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {exam.duration}m
                          </span>
                        </div>
                      </div>

                      {/* Score / Action */}
                      <div className="shrink-0 text-right">
                        {isCompleted && exam.attempt?.obtainedMarks != null ? (
                          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 px-3 py-2 rounded-lg">
                            <p className={`text-lg font-bold leading-none ${gradeInfo?.color}`}>
                              {exam.attempt.obtainedMarks}
                              <span className="text-sm font-medium text-gray-400 dark:text-gray-500"> / {exam.totalMarks}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {exam.attempt.percentage?.toFixed(1)}% · Grade {gradeInfo?.grade}
                            </p>
                          </div>
                        ) : isLive ? (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/student/exams/${exam.id}`) }}
                          >
                            {exam.status === "IN_PROGRESS" ? "Resume" : "Start"} <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        ) : exam.status === "UPCOMING" ? (
                          <div className="text-right">
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Opens at</p>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ) : exam.status === "MISSED" ? (
                          <div className="flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-medium">
                            <AlertCircle className="w-3.5 h-3.5" /> Missed
                          </div>
                        ) : null}
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 shrink-0" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {completedExams.length > 0 && (
        <Card className="bg-[#090909] border-[#1C1C1C]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Performance Summary
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Score breakdown for completed exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedExams.map(exam => {
                const pct = exam.attempt?.percentage ?? 0
                const gradeInfo = getGradeFromPercentage(pct)
                return (
                  <div key={exam.id} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white truncate">{exam.title}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0 border-[#1C1C1C] dark:text-gray-400">
                          {exam.classCode}
                        </Badge>
                      </div>
                      <span className={`font-bold shrink-0 ml-3 ${gradeInfo.color}`}>
                        {pct.toFixed(1)}% · {gradeInfo.grade}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
