"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  BarChart3, TrendingUp, TrendingDown, Users, BookOpen,
  CheckCircle, Award, Target, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts"
import StudentInsightsTab from "./StudentInsightsTab"
import ClassPerformanceTab from "./ClassPerformanceTab"
import GradeDistributionTab from "./GradeDistributionTab"

interface AnalyticsData {
  overview: {
    totalStudents: number
    averageAttendance: number
    averageGrade: number
    assignmentCompletion: number
    trend: "up" | "down"
    trendValue: number
  }
  classPerformance: {
    className: string; students: number; avgGrade: number; attendance: number; completion: number
  }[]
  gradeDistribution: { grade: string; count: number; percentage: number }[]
  attendanceTrend: { week: string; rate: number }[]
  performanceTimeSeries: { date: string; classAverage: number | null }[]
  topPerformers: { name: string; class: string; grade: number; attendance: number }[]
  atRiskStudents: { name: string; class: string; issue: string; grade: number }[]
  performanceTrend: { todayAvg: number | null; yesterdayAvg: number | null }
}

interface InsightsData {
  topPerformers: any[]
  attentionNeeded: any[]
}

export default function TeacherAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [insightsData, setInsightsData] = useState<InsightsData>({ topPerformers: [], attentionNeeded: [] })
  const [selectedPeriod, setSelectedPeriod] = useState("semester")
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (period: string) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/teacher/analytics?period=${period}`, { cache: "no-store" })
      const result = await res.json()
      if (res.ok && result.success) setData(result.data)
      else setError(result.error || "Failed to load analytics")
    } catch { setError("Failed to connect to server") }
    finally { setLoading(false) }
  }, [])

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/analytics/student-insights", { cache: "no-store" })
      const result = await res.json()
      if (result.success) setInsightsData(result.data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchAnalytics(selectedPeriod) }, [selectedPeriod, fetchAnalytics])
  useEffect(() => { fetchInsights() }, [fetchInsights])

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-white" // Success/Neon Green
    if (grade >= 80) return "text-[#3b82f6]" // Info/Blue
    if (grade >= 70) return "text-[#FACC15]" // Warning/Yellow
    if (grade >= 60) return "text-[#FB923C]" // Alert/Orange
    return "text-[#F87171]" // Error/Red
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" onClick={() => fetchAnalytics(selectedPeriod)}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const isEmpty = data.overview.totalStudents === 0

  return (
    <div className="space-y-8 min-h-screen bg-[#000] -m-6 p-8 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.015] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1C1C1C] pb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Analytics</h1>
          <p className="text-[13px] text-[#B5B5B5] mt-2">
            Monitor student performance and engagement with real-time analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-9 px-4 rounded-xl border-[#1C1C1C] bg-[#1F1F1F] text-[#B5B5B5] hover:bg-white/5 font-semibold text-sm transition-all" 
            onClick={() => { fetchAnalytics(selectedPeriod); fetchInsights() }}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px] h-9 bg-[#1F1F1F] border-[#1C1C1C] text-[#B5B5B5] rounded-xl text-sm focus:ring-0">
                <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
              <SelectItem value="week" className="focus:bg-white/5 focus:text-white cursor-pointer">This Week</SelectItem>
              <SelectItem value="month" className="focus:bg-white/5 focus:text-white cursor-pointer">This Month</SelectItem>
              <SelectItem value="semester" className="focus:bg-white/5 focus:text-white cursor-pointer">This Semester</SelectItem>
              <SelectItem value="year" className="focus:bg-white/5 focus:text-white cursor-pointer">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEmpty && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-blue-700 dark:text-blue-300 text-sm">
          No student data yet. Analytics will populate once students join your classes and attend sessions, submit assignments, or complete exams.
        </div>
      )}

      <svg width="0" height="0">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Overview Stats */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Students", value: data.overview.totalStudents, icon: Users, color: "text-[#3b82f6]" },
          { label: "Attendance Rate", value: `${data.overview.averageAttendance}%`, icon: CheckCircle, color: "text-white" },
          { 
            label: "Academic Average", 
            value: `${data.overview.averageGrade}%`, 
            icon: Award, 
            color: "text-[#A855F7]", 
            trendValue: (data.performanceTrend?.todayAvg && data.performanceTrend?.yesterdayAvg) ? data.performanceTrend.todayAvg - data.performanceTrend.yesterdayAvg : 0 
          },
          { label: "Submission Rate", value: `${data.overview.assignmentCompletion}%`, icon: Target, color: "text-[#FB923C]" },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#161616] border-[#1C1C1C] hover:border-white/20 transition-all rounded-2xl group overflow-hidden">
            <CardContent className="pt-6 relative">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full -mr-8 -mt-8 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[11px] font-bold text-[#555] uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stat.value}</p>
                </div>
                <div className={cn("p-2.5 rounded-xl bg-black/40 border border-[#1C1C1C] transition-colors group-hover:border-white/20", stat.color)}>
                    <stat.icon className="w-5 h-5" />
                </div>
              </div>
              {stat.trendValue !== undefined && (
                <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[#1C1C1C] relative z-10">
                  {stat.trendValue >= 0
                    ? <TrendingUp className="w-3.5 h-3.5 text-[#00E599]" />
                    : <TrendingDown className="w-3.5 h-3.5 text-[#F87171]" />}
                  <span className={cn("text-[11px] font-bold", stat.trendValue >= 0 ? "text-white" : "text-[#F87171]")}>
                    {stat.trendValue >= 0 ? "+" : ""}{stat.trendValue}% <span className="text-[#555] font-medium uppercase ml-1 tracking-tighter">vs Yesterday</span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="performance" className="relative z-8 space-y-6">
        <TabsList className="bg-[#161616] border border-[#1C1C1C] p-1 h-10 rounded-2xl">
          <TabsTrigger value="performance" className="rounded-xl px-6 h-8 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-[#9A9A9A] font-bold text-xs uppercase tracking-widest transition-all">Class Performance</TabsTrigger>
          <TabsTrigger value="grades" className="rounded-xl px-6 h-8 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-[#9A9A9A] font-bold text-xs uppercase tracking-widest transition-all">Grade Distribution</TabsTrigger>
          <TabsTrigger value="students" className="rounded-xl px-6 h-8 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-[#9A9A9A] font-bold text-xs uppercase tracking-widest transition-all">Student Insights</TabsTrigger>
        </TabsList>

        {/* ─── Class Performance ─────────────────────────────────── */}
        <TabsContent value="performance" className="space-y-6 outline-none">
          {/* Class Summary Table */}
          <Card className="bg-[#161616] border-[#1C1C1C] rounded-[2rem] overflow-hidden">
            <div className="p-8 border-b border-[#1C1C1C]">
              <h3 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-widest">
                <BarChart3 className="w-4 h-4 text-[#A855F7]" /> Performance Summary
              </h3>
              <p className="text-[11px] text-[#555] mt-1 font-medium uppercase tracking-tighter">Metrics for each class</p>
            </div>
            <CardContent className="pt-2">
              {data.classPerformance.length === 0 ? (
                <p className="text-center text-[#666] py-8 text-sm">No class data available yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1C1C1C]">
                        {["Class", "Students", "Avg Score", "Attendance", "Completion"].map(h => (
                          <th key={h} className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-[#555]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1C1C]">
                      {data.classPerformance.map((cls, index) => (
                        <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-black/40 border border-[#1C1C1C] group-hover:border-[#A855F7]/30 transition-colors">
                                <BookOpen className="w-4 h-4 text-[#A855F7]" />
                              </div>
                              <span className="font-bold text-white text-sm tracking-tight">{cls.className}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-sm font-medium text-[#B5B5B5]">{cls.students}</td>
                          <td className="py-5 px-6">
                            {cls.avgGrade > 0
                              ? <span className={cn("font-bold text-sm", getGradeColor(cls.avgGrade))}>{cls.avgGrade}%</span>
                              : <span className="text-[#444] text-xs font-medium">No exams</span>}
                          </td>
                          <td className="py-5 px-6">
                            {cls.attendance > 0
                              ? <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest", cls.attendance >= 85 ? "bg-white/8 text-[#D4D4D4] border border-white/10" : "bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/20")}>{cls.attendance}%</span>
                              : <span className="text-[#444] text-xs font-medium">No sessions</span>}
                          </td>
                          <td className="py-5 px-6 text-sm font-medium text-[#B5B5B5]">
                            {cls.completion > 0 ? `${cls.completion}%` : <span className="text-[#444] text-xs font-medium">No assignments</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Individual Student Table */}
          <ClassPerformanceTab />

          {/* Performance Chart */}
          <Card className="bg-[#161616] border-[#1C1C1C] rounded-[2rem] overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 border-b border-[#1C1C1C] gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Academic Progress Analysis</h3>
                  {data.performanceTrend?.todayAvg && data.performanceTrend?.yesterdayAvg && (
                    <Badge className={cn(
                      "text-[10px] font-black px-2 py-0.5 border-0",
                      data.performanceTrend.todayAvg >= data.performanceTrend.yesterdayAvg 
                        ? "bg-white/8 text-[#D4D4D4]" 
                        : "bg-[#F87171]/10 text-[#F87171]"
                    )}>
                      {data.performanceTrend.todayAvg >= data.performanceTrend.yesterdayAvg ? "+" : "-"}
                      {Math.abs(data.performanceTrend.todayAvg - data.performanceTrend.yesterdayAvg)}% from yesterday
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-[#555] font-medium uppercase tracking-tighter">Exam & assignment performance over time</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-[#444] font-bold uppercase tracking-tighter">Yesterday&apos;s Avg</span>
                  <span className="text-sm font-black text-[#555]">{data.performanceTrend?.yesterdayAvg ?? '--'}%</span>
                </div>
                <div className="w-px h-8 bg-white/5 hidden sm:block" />
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-[#00E599] font-black uppercase tracking-tighter">Today&apos;s Avg</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-white">{data.performanceTrend?.todayAvg ?? '--'}%</span>
                    {data.performanceTrend?.todayAvg && data.performanceTrend?.yesterdayAvg && (
                      data.performanceTrend.todayAvg >= data.performanceTrend.yesterdayAvg 
                        ? <TrendingUp className="w-5 h-5 text-[#9A9A9A]" /> 
                        : <TrendingDown className="w-4 h-4 text-[#F87171]" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-8">
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.performanceTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1C1C1C" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 9, fill: "#444", fontWeight: 800 }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10} 
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fill: "#444", fontWeight: 800 }} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={v => `${v}%`} 
                      domain={[0, 100]} 
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#080808] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                              <p className="text-[9px] text-[#666] font-black uppercase tracking-widest mb-1.5">{label}</p>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#00E599]" />
                                <p className="text-sm font-black text-white">{Math.round(payload[0].value as number)}% <span className="text-[10px] text-[#00E599] ml-1">Avg Score</span></p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="classAverage" 
                      stroke="#00E599" 
                      strokeWidth={4} 
                      fill="url(#areaGradient)" 
                      activeDot={{ r: 6, fill: "#00E599", stroke: "#000", strokeWidth: 2 }} 
                      filter="url(#chartGlow)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Grade Distribution ─────────────────────────────────── */}
        <TabsContent value="grades" className="space-y-6">
          <GradeDistributionTab />
        </TabsContent>

        {/* ─── Student Insights ──────────────────────────────────── */}
        <TabsContent value="students" className="space-y-6">
          <StudentInsightsTab
            topPerformers={insightsData.topPerformers}
            attentionNeeded={insightsData.attentionNeeded}
            onRatingUpdate={fetchInsights}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
