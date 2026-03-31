"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  Clock,
  Award,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend,
} from "recharts"

const userGrowthData = [
  { month: "Jan", students: 450, teachers: 25, active: 380 },
  { month: "Feb", students: 520, teachers: 28, active: 420 },
  { month: "Mar", students: 610, teachers: 32, active: 490 },
  { month: "Apr", students: 720, teachers: 38, active: 580 },
  { month: "May", students: 850, teachers: 45, active: 680 },
  { month: "Jun", students: 950, teachers: 52, active: 760 },
]

const engagementData = [
  { day: "Mon", logins: 450, submissions: 120, exams: 45 },
  { day: "Tue", logins: 520, submissions: 145, exams: 60 },
  { day: "Wed", logins: 480, submissions: 130, exams: 52 },
  { day: "Thu", logins: 610, submissions: 180, exams: 75 },
  { day: "Fri", logins: 580, submissions: 165, exams: 68 },
  { day: "Sat", logins: 320, submissions: 80, exams: 25 },
  { day: "Sun", logins: 290, submissions: 60, exams: 18 },
]

const performanceData = [
  { subject: "Mathematics", avgScore: 78, passRate: 85 },
  { subject: "Physics", avgScore: 72, passRate: 80 },
  { subject: "Chemistry", avgScore: 75, passRate: 82 },
  { subject: "Biology", avgScore: 81, passRate: 88 },
  { subject: "Computer Science", avgScore: 85, passRate: 92 },
  { subject: "English", avgScore: 79, passRate: 86 },
]

const departmentDistribution = [
  { name: "Computer Science", value: 320, color: "#3b82f6" },
  { name: "Mathematics", value: 180, color: "#8b5cf6" },
  { name: "Physics", value: 150, color: "#06b6d4" },
  { name: "Chemistry", value: 120, color: "#10b981" },
  { name: "Biology", value: 100, color: "#f59e0b" },
  { name: "Others", value: 80, color: "#6b7280" },
]

const attendanceData = [
  { week: "Week 1", present: 92, absent: 8 },
  { week: "Week 2", present: 88, absent: 12 },
  { week: "Week 3", present: 90, absent: 10 },
  { week: "Week 4", present: 85, absent: 15 },
  { week: "Week 5", present: 91, absent: 9 },
  { week: "Week 6", present: 89, absent: 11 },
]

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("month")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <SkeletonDashboard />

  const kpiCards = [
    { title: "Total Students", value: "950", change: "+12%", trend: "up", icon: GraduationCap, color: "blue" },
    { title: "Total Teachers", value: "52", change: "+8%", trend: "up", icon: Users, color: "purple" },
    { title: "Active Classes", value: "48", change: "+5%", trend: "up", icon: BookOpen, color: "green" },
    { title: "Avg. Performance", value: "78%", change: "-2%", trend: "down", icon: Award, color: "orange" },
    { title: "Assignments Completed", value: "2,450", change: "+18%", trend: "up", icon: FileText, color: "cyan" },
    { title: "Attendance Rate", value: "89%", change: "+1%", trend: "up", icon: Clock, color: "pink" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color === "blue" ? "bg-blue-100 text-blue-600" :
                      kpi.color === "purple" ? "bg-purple-100 text-purple-600" :
                        kpi.color === "green" ? "bg-green-100 text-green-600" :
                          kpi.color === "orange" ? "bg-orange-100 text-orange-600" :
                            kpi.color === "cyan" ? "bg-cyan-100 text-cyan-600" :
                              "bg-pink-100 text-pink-600"
                    }`}>
                    <kpi.icon className="w-4 h-4" />
                  </div>
                  <div className={`flex items-center text-xs ${kpi.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}>
                    {kpi.trend === "up" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {kpi.change}
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Growth Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">User Growth Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userGrowthData}>
                        <defs>
                          <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="students"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorStudents)"
                          name="Students"
                        />
                        <Area
                          type="monotone"
                          dataKey="teachers"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorTeachers)"
                          name="Teachers"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Department Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Department Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departmentDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {departmentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {departmentDistribution.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600 truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="logins" fill="#3b82f6" name="Logins" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} name="Submissions" />
                    <Line type="monotone" dataKey="exams" stroke="#f59e0b" strokeWidth={2} name="Exams" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Subject-wise Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                    <YAxis dataKey="subject" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="avgScore" fill="#3b82f6" name="Avg Score %" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="passRate" fill="#10b981" name="Pass Rate %" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Weekly Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="present" stackId="a" fill="#10b981" name="Present %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Performing Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Data Structures", score: 92, students: 60 },
                { name: "English Literature", score: 89, students: 55 },
                { name: "Biology 101", score: 88, students: 45 },
                { name: "Advanced Math", score: 85, students: 40 },
              ].map((cls, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{cls.name}</p>
                    <p className="text-xs text-gray-500">{cls.students} students</p>
                  </div>
                  <Badge variant={cls.score >= 90 ? "success" : "default"}>
                    {cls.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "New student registered", time: "2 min ago", icon: Users },
                { action: "Assignment submitted", time: "5 min ago", icon: FileText },
                { action: "Exam completed", time: "12 min ago", icon: Award },
                { action: "New class created", time: "25 min ago", icon: BookOpen },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <activity.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Database", status: "Healthy", uptime: "99.9%" },
                { name: "API Server", status: "Healthy", uptime: "99.8%" },
                { name: "Auth Service", status: "Healthy", uptime: "100%" },
                { name: "File Storage", status: "Healthy", uptime: "99.7%" },
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{service.uptime}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
