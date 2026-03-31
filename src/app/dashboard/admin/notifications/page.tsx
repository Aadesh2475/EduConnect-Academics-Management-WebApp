"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Bell,
  Send,
  Plus,
  Users,
  Clock,
  CheckCircle,
  Mail,
  Megaphone,
  AlertTriangle,
  Info,
  Trash2,
  Eye
} from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "alert"
  recipients: "all" | "students" | "teachers" | "admins"
  sentAt: string
  readCount: number
  totalRecipients: number
  status: "sent" | "scheduled" | "draft"
  scheduledFor?: string
}

const typeConfig = {
  info: { color: "bg-blue-100 text-blue-800", icon: Info },
  warning: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  success: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  alert: { color: "bg-red-100 text-red-800", icon: Bell },
}

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info" as const,
    recipients: "all" as const,
    sendEmail: false,
    schedule: false,
    scheduledFor: "",
  })

  useEffect(() => {
    setTimeout(() => {
      setNotifications([
        { id: "1", title: "System Maintenance Notice", message: "The system will undergo maintenance on Sunday from 2-4 AM.", type: "warning", recipients: "all", sentAt: "2024-01-15T10:00:00", readCount: 456, totalRecipients: 890, status: "sent" },
        { id: "2", title: "New Feature: AI Assistant", message: "We're excited to announce our new AI-powered study assistant!", type: "info", recipients: "students", sentAt: "2024-01-14T09:00:00", readCount: 380, totalRecipients: 650, status: "sent" },
        { id: "3", title: "Semester Registration Open", message: "Spring 2025 course registration is now open. Register before Jan 31.", type: "alert", recipients: "all", sentAt: "2024-01-13T08:00:00", readCount: 720, totalRecipients: 890, status: "sent" },
        { id: "4", title: "Faculty Meeting Reminder", message: "Reminder: Monthly faculty meeting tomorrow at 3 PM.", type: "info", recipients: "teachers", sentAt: "2024-01-12T14:00:00", readCount: 85, totalRecipients: 120, status: "sent" },
        { id: "5", title: "Grade Submission Deadline", message: "All grades for Fall semester must be submitted by Jan 20.", type: "warning", recipients: "teachers", sentAt: "", readCount: 0, totalRecipients: 120, status: "scheduled", scheduledFor: "2024-01-18T09:00:00" },
        { id: "6", title: "Welcome Back Message", message: "Welcome back to the new semester!", type: "success", recipients: "all", sentAt: "", readCount: 0, totalRecipients: 890, status: "draft" },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const handleCreateNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const notification: Notification = {
      id: Date.now().toString(),
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      recipients: newNotification.recipients,
      sentAt: newNotification.schedule ? "" : new Date().toISOString(),
      readCount: 0,
      totalRecipients: newNotification.recipients === "all" ? 890 : newNotification.recipients === "students" ? 650 : 120,
      status: newNotification.schedule ? "scheduled" : "sent",
      scheduledFor: newNotification.schedule ? newNotification.scheduledFor : undefined,
    }

    setNotifications([notification, ...notifications])
    setNewNotification({ title: "", message: "", type: "info", recipients: "all", sendEmail: false, schedule: false, scheduledFor: "" })
    setIsCreateOpen(false)
    toast({
      title: newNotification.schedule ? "Notification scheduled" : "Notification sent",
      description: newNotification.schedule ? "Your notification has been scheduled." : "Your notification has been sent to all recipients.",
    })
  }

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    })
  }

  const filteredNotifications = notifications.filter(n =>
    statusFilter === "all" || n.status === statusFilter
  )

  const stats = {
    sent: notifications.filter(n => n.status === "sent").length,
    scheduled: notifications.filter(n => n.status === "scheduled").length,
    drafts: notifications.filter(n => n.status === "draft").length,
    totalReads: notifications.reduce((acc, n) => acc + n.readCount, 0),
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
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Send system-wide notifications</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Notification</DialogTitle>
              <DialogDescription>
                Send a notification to users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="Notification title"
                />
              </div>
              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Write your message..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newNotification.type}
                    onValueChange={(value: any) => setNewNotification({ ...newNotification, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select
                    value={newNotification.recipients}
                    onValueChange={(value: any) => setNewNotification({ ...newNotification, recipients: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="teachers">Teachers Only</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={newNotification.sendEmail}
                  onCheckedChange={(checked) => setNewNotification({ ...newNotification, sendEmail: checked as boolean })}
                />
                <label htmlFor="email" className="text-sm">Also send via email</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule"
                  checked={newNotification.schedule}
                  onCheckedChange={(checked) => setNewNotification({ ...newNotification, schedule: checked as boolean })}
                />
                <label htmlFor="schedule" className="text-sm">Schedule for later</label>
              </div>
              {newNotification.schedule && (
                <div className="space-y-2">
                  <Label>Schedule Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={newNotification.scheduledFor}
                    onChange={(e) => setNewNotification({ ...newNotification, scheduledFor: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateNotification}>
                <Send className="w-4 h-4 mr-2" />
                {newNotification.schedule ? "Schedule" : "Send Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-xs text-gray-500">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-xs text-gray-500">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <Megaphone className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.drafts}</p>
                <p className="text-xs text-gray-500">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalReads}</p>
                <p className="text-xs text-gray-500">Total Reads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-600" />
            All Notifications
          </CardTitle>
          <CardDescription>
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const config = typeConfig[notification.type]
              const TypeIcon = config.icon
              return (
                <div
                  key={notification.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50"
                >
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                      <Badge variant={
                        notification.status === "sent" ? "default" :
                        notification.status === "scheduled" ? "secondary" : "outline"
                      }>
                        {notification.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {notification.recipients === "all" ? "All Users" : notification.recipients}
                      </span>
                      {notification.status === "sent" && (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(notification.sentAt).toLocaleString()}
                          </span>
                          <span>{notification.readCount}/{notification.totalRecipients} read</span>
                        </>
                      )}
                      {notification.status === "scheduled" && notification.scheduledFor && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Scheduled: {new Date(notification.scheduledFor).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(notification.id)}
                  >
                    <Trash2 className="w-4 h-4" />
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
