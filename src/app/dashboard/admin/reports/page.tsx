"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Download,
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  TrendingUp,
  Clock,
  FileSpreadsheet
} from "lucide-react"

interface Report {
  id: string
  name: string
  type: "academic" | "enrollment" | "attendance" | "financial" | "performance"
  description: string
  lastGenerated: string
  format: "pdf" | "excel" | "csv"
  size?: string
}

const typeColors = {
  academic: "bg-blue-100 text-blue-800",
  enrollment: "bg-green-100 text-green-800",
  attendance: "bg-purple-100 text-purple-800",
  financial: "bg-orange-100 text-orange-800",
  performance: "bg-pink-100 text-pink-800",
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [typeFilter, setTypeFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("semester")

  useEffect(() => {
    setTimeout(() => {
      setReports([
        { id: "1", name: "Student Enrollment Summary", type: "enrollment", description: "Overview of all student enrollments by department and semester", lastGenerated: "2024-01-15", format: "pdf", size: "2.4 MB" },
        { id: "2", name: "Faculty Performance Report", type: "performance", description: "Teacher performance metrics including student feedback and class outcomes", lastGenerated: "2024-01-14", format: "excel", size: "1.8 MB" },
        { id: "3", name: "Attendance Analysis", type: "attendance", description: "Detailed attendance statistics across all classes", lastGenerated: "2024-01-15", format: "pdf", size: "3.2 MB" },
        { id: "4", name: "Academic Progress Report", type: "academic", description: "Student academic performance and grade distribution", lastGenerated: "2024-01-13", format: "pdf", size: "4.5 MB" },
        { id: "5", name: "Course Enrollment Trends", type: "enrollment", description: "Historical enrollment data and trends by course", lastGenerated: "2024-01-12", format: "csv", size: "850 KB" },
        { id: "6", name: "Department Budget Summary", type: "financial", description: "Financial overview of departmental expenditures", lastGenerated: "2024-01-10", format: "excel", size: "1.2 MB" },
        { id: "7", name: "Student Retention Analysis", type: "performance", description: "Analysis of student retention rates and factors", lastGenerated: "2024-01-08", format: "pdf", size: "2.8 MB" },
        { id: "8", name: "Class Completion Rates", type: "academic", description: "Completion rates and outcomes for all courses", lastGenerated: "2024-01-05", format: "csv", size: "620 KB" },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const filteredReports = reports.filter(report =>
    typeFilter === "all" || report.type === typeFilter
  )

  const quickStats = [
    { label: "Total Reports", value: reports.length, icon: FileText, color: "bg-blue-100 text-blue-600" },
    { label: "Generated Today", value: 2, icon: Clock, color: "bg-green-100 text-green-600" },
    { label: "Scheduled", value: 5, icon: Calendar, color: "bg-purple-100 text-purple-600" },
    { label: "Downloads This Month", value: 142, icon: Download, color: "bg-orange-100 text-orange-600" },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and download system reports</p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Generate New Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed">
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <h3 className="font-semibold">Student Report</h3>
            <p className="text-sm text-gray-500">Generate student overview</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed">
          <CardContent className="pt-6 text-center">
            <GraduationCap className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <h3 className="font-semibold">Teacher Report</h3>
            <p className="text-sm text-gray-500">Generate faculty overview</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <h3 className="font-semibold">Analytics Report</h3>
            <p className="text-sm text-gray-500">Generate performance data</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="enrollment">Enrollment</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="semester">This Semester</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            Available Reports
          </CardTitle>
          <CardDescription>
            {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border hover:bg-gray-50"
              >
                <div className={`p-3 rounded-lg ${typeColors[report.type]}`}>
                  {report.format === "pdf" ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <FileSpreadsheet className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>Last generated: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                    <Badge variant="outline" className="uppercase">{report.format}</Badge>
                    {report.size && <span>{report.size}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                  <Button size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
