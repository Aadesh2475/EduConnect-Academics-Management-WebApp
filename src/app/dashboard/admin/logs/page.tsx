"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Activity,
  Search,
  Download,
  Filter,
  User,
  LogIn,
  LogOut,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from "lucide-react"

interface ActivityLog {
  id: string
  userId: string
  userName: string
  userRole: "student" | "teacher" | "admin"
  action: string
  details: string
  ipAddress: string
  timestamp: string
  status: "success" | "warning" | "error"
  category: "auth" | "data" | "settings" | "security"
}

const categoryIcons = {
  auth: LogIn,
  data: Activity,
  settings: Settings,
  security: Shield,
}

const statusColors = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
}

const roleColors = {
  student: "bg-blue-100 text-blue-800",
  teacher: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
}

export default function AdminLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    setTimeout(() => {
      setLogs([
        { id: "1", userId: "u1", userName: "Admin User", userRole: "admin", action: "User Status Updated", details: "Changed student status to suspended", ipAddress: "192.168.1.100", timestamp: "2024-01-15T14:30:00", status: "success", category: "data" },
        { id: "2", userId: "u2", userName: "Dr. Sarah Johnson", userRole: "teacher", action: "Login", details: "Successful login from web browser", ipAddress: "192.168.1.105", timestamp: "2024-01-15T14:25:00", status: "success", category: "auth" },
        { id: "3", userId: "u3", userName: "Alice Johnson", userRole: "student", action: "Failed Login", details: "Invalid password attempt", ipAddress: "192.168.1.110", timestamp: "2024-01-15T14:20:00", status: "error", category: "auth" },
        { id: "4", userId: "u1", userName: "Admin User", userRole: "admin", action: "Settings Changed", details: "Updated system email settings", ipAddress: "192.168.1.100", timestamp: "2024-01-15T14:15:00", status: "success", category: "settings" },
        { id: "5", userId: "u4", userName: "Prof. Michael Chen", userRole: "teacher", action: "Class Created", details: "Created new class: Advanced ML", ipAddress: "192.168.1.108", timestamp: "2024-01-15T14:10:00", status: "success", category: "data" },
        { id: "6", userId: "u5", userName: "Bob Smith", userRole: "student", action: "Password Reset", details: "Password reset requested", ipAddress: "192.168.1.115", timestamp: "2024-01-15T14:05:00", status: "warning", category: "security" },
        { id: "7", userId: "u1", userName: "Admin User", userRole: "admin", action: "Bulk User Import", details: "Imported 50 new student records", ipAddress: "192.168.1.100", timestamp: "2024-01-15T14:00:00", status: "success", category: "data" },
        { id: "8", userId: "u6", userName: "Unknown", userRole: "student", action: "Suspicious Activity", details: "Multiple failed login attempts detected", ipAddress: "192.168.1.200", timestamp: "2024-01-15T13:55:00", status: "error", category: "security" },
        { id: "9", userId: "u2", userName: "Dr. Sarah Johnson", userRole: "teacher", action: "Logout", details: "User logged out", ipAddress: "192.168.1.105", timestamp: "2024-01-15T13:50:00", status: "success", category: "auth" },
        { id: "10", userId: "u7", userName: "Carol Williams", userRole: "student", action: "Profile Updated", details: "Updated profile information", ipAddress: "192.168.1.120", timestamp: "2024-01-15T13:45:00", status: "success", category: "data" },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter
    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === "success").length,
    warnings: logs.filter(l => l.status === "warning").length,
    errors: logs.filter(l => l.status === "error").length,
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-500 mt-1">Monitor system activity and user actions</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.success}</p>
                <p className="text-xs text-gray-500">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.warnings}</p>
                <p className="text-xs text-gray-500">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.errors}</p>
                <p className="text-xs text-gray-500">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="data">Data Changes</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const CategoryIcon = categoryIcons[log.category]
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50"
                >
                  <div className={`p-2 rounded-lg ${statusColors[log.status]}`}>
                    <CategoryIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{log.action}</h4>
                      <Badge className={statusColors[log.status]} variant="secondary">
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{log.details}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.userName}
                      </span>
                      <Badge className={roleColors[log.userRole]} variant="outline">
                        {log.userRole}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
