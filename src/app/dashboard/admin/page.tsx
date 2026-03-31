"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  Bell,
  Shield,
  TrendingUp,
  Search,
  MoreVertical,
  UserPlus,
  FolderOpen,
  FileText,
  HelpCircle,
  MessageSquare,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { SkeletonDashboard } from "@/components/ui/skeleton"
import { getInitials, formatDate, cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardData {
  admin: {
    id: string
    name: string
    email: string
  }
  stats: {
    totalStudents: number
    totalTeachers: number
    totalClasses: number
    totalAssignments: number
    pendingEnrollments: number
    openTickets: number
    totalUsers: number
  }
  recentUsers: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }>
  recentClasses: Array<{
    id: string
    name: string
    code: string
    subject: string
    department: string
    teacherName: string
    studentCount: number
    createdAt: string
  }>
  usersByRole: Array<{
    role: string
    count: number
  }>
  recentTickets: Array<{
    id: string
    subject: string
    category: string
    status: string
    priority: string
    userName: string
    userEmail: string
    createdAt: string
  }>
  recentFeedback: Array<{
    id: string
    subject: string
    message: string
    type: string
    rating: number | null
    status: string
    userName: string
    createdAt: string
  }>
  notifications: Array<{
    id: string
    title: string
    message: string
    type: string
    read: boolean
    createdAt: string
  }>
  auditLogs: Array<{
    id: string
    action: string
    entity: string
    entityId: string | null
    createdAt: string
  }>
}

// Empty state component
function EmptyState({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 bg-[#161616] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm">{description}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/admin/dashboard")
        const result = await res.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || "Failed to load dashboard")
        }
      } catch {
        setError("Failed to connect to server")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) return <SkeletonDashboard />

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md border-border">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">Unable to Load Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error || "Something went wrong"}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { admin, stats, recentUsers, recentClasses, usersByRole, recentTickets, recentFeedback, notifications, auditLogs } = data

  // Calculate total users for percentage
  const totalUsers = usersByRole.reduce((sum, r) => sum + r.count, 0)

  // Filter users by search
  const filteredUsers = recentUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-border rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-foreground" />
              <span className="text-muted-foreground text-sm">Admin Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back, {admin.name}! 👋</h1>
            <p className="text-muted-foreground">
              {stats.totalUsers > 0
                ? `Managing ${stats.totalUsers} users across ${stats.totalClasses} classes.`
                : "No users registered yet. The platform is ready for users."}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">System Status</p>
              <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-400 mt-1">Healthy</Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: stats.totalStudents, icon: GraduationCap, color: "blue", href: "/dashboard/admin/users?role=STUDENT" },
          { label: "Total Teachers", value: stats.totalTeachers, icon: Users, color: "emerald", href: "/dashboard/admin/users?role=TEACHER" },
          { label: "Active Classes", value: stats.totalClasses, icon: BookOpen, color: "purple", href: "/dashboard/admin/classes" },
          { label: "Open Tickets", value: stats.openTickets, icon: HelpCircle, color: "orange", href: "/dashboard/admin/tickets" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1 text-foreground">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl border border-border bg-secondary flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Recent Users</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 bg-secondary border-border text-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No Users Yet"
                  description="No users have registered on the platform yet. Share the registration link to invite users."
                />
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No users match your search</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1C1C1C]">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Joined</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gray-100 bg-[#161616] text-gray-900 dark:text-white">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm dark:text-white">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={
                              user.role === "ADMIN" ? "default" : "secondary"
                            }>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="icon" className="dark:text-gray-300 dark:hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Classes */}
          <Card className="mt-6 border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">Recent Classes</CardTitle>
              <Link href="/dashboard/admin/classes">
                <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:text-white">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentClasses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No Classes Created</p>
                  <p className="text-sm mt-1">Classes will appear here once teachers create them.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentClasses.slice(0, 5).map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border border-[#1C1C1C]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-gray-200 border-[#1C1C1C] bg-gray-50 bg-[#1F1F1F] flex items-center justify-center text-gray-900 dark:text-white font-bold text-sm">
                          {cls.code.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm dark:text-white">{cls.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {cls.teacherName} • {cls.department}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                        {cls.studentCount} students
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Role Distribution */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base dark:text-white">User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {usersByRole.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {usersByRole.map((item) => {
                    const percentage = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0
                    return (
                      <div key={item.role}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm dark:text-gray-300">{item.role}</span>
                          <span className="text-sm font-medium dark:text-white">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              item.role === "STUDENT" && "bg-blue-500",
                              item.role === "TEACHER" && "bg-emerald-500",
                              item.role === "ADMIN" && "bg-purple-500",
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support Tickets */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base dark:text-white">Support Tickets</CardTitle>
              <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">{stats.openTickets}</Badge>
            </CardHeader>
            <CardContent>
              {recentTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No support tickets</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTickets.slice(0, 3).map((ticket) => (
                    <div key={ticket.id} className="p-3 rounded-lg border border-[#1C1C1C]">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={
                          ticket.priority === "HIGH" ? "destructive" :
                            ticket.priority === "MEDIUM" ? "default" :
                              "secondary"
                        } className="text-xs">
                          {ticket.priority}
                        </Badge>
                        <Badge variant={
                          ticket.status === "OPEN" ? "default" :
                            ticket.status === "RESOLVED" ? "outline" :
                              "secondary"
                        } className="text-xs">
                          {ticket.status}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm dark:text-white mt-2">{ticket.subject}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {ticket.userName} • {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base dark:text-white">Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {recentFeedback.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No feedback received</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentFeedback.slice(0, 3).map((feedback) => (
                    <div key={feedback.id} className="border-l-2 border-gray-300 border-[#1C1C1C] pl-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm dark:text-white">{feedback.subject}</h4>
                        <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                          {feedback.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{feedback.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {feedback.userName} • {formatDate(feedback.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base dark:text-white">Notifications</CardTitle>
              <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                {notifications.filter(n => !n.read).length}
              </Badge>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notif) => (
                    <div key={notif.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2",
                        notif.read ? "bg-gray-200 bg-[#161616]" : "bg-gray-500 dark:bg-gray-400"
                      )} />
                      <div>
                        <p className="text-sm font-medium dark:text-white">{notif.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{notif.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base dark:text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 mt-2" />
                      <div>
                        <p className="text-sm dark:text-white">{log.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {log.entity} • {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
