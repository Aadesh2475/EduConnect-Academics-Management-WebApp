"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  GraduationCap,
  BookOpen,
  Shield,
  Mail,
  Calendar,
  X
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { SkeletonTable } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { getInitials, formatDate, cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string
  role: "STUDENT" | "TEACHER" | "ADMIN"
  image?: string
  createdAt: string
  emailVerified?: string
  student?: {
    enrollmentNo?: string
    department?: string
    semester?: number
  }
  teacher?: {
    employeeId?: string
    department?: string
    subject?: string
  }
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const itemsPerPage = 10

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        role: roleFilter,
      })
      
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setUsers(data.data)
        setFilteredUsers(data.data)
        setTotalPages(data.totalPages)
        setTotalUsers(data.total)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      // Show demo data for development
      const demoUsers: User[] = [
        { id: "1", name: "John Doe", email: "john@example.com", role: "STUDENT", createdAt: new Date().toISOString(), student: { enrollmentNo: "STU001", department: "Computer Science", semester: 4 } },
        { id: "2", name: "Dr. Jane Smith", email: "jane@example.com", role: "TEACHER", createdAt: new Date(Date.now() - 86400000).toISOString(), teacher: { employeeId: "TCH001", department: "Mathematics", subject: "Calculus" } },
        { id: "3", name: "Mike Johnson", email: "mike@example.com", role: "STUDENT", createdAt: new Date(Date.now() - 172800000).toISOString(), student: { enrollmentNo: "STU002", department: "Physics", semester: 3 } },
        { id: "4", name: "Sarah Wilson", email: "sarah@example.com", role: "TEACHER", createdAt: new Date(Date.now() - 259200000).toISOString(), teacher: { employeeId: "TCH002", department: "Chemistry", subject: "Organic Chemistry" } },
        { id: "5", name: "Admin User", email: "admin@example.com", role: "ADMIN", createdAt: new Date(Date.now() - 345600000).toISOString() },
        { id: "6", name: "Emily Chen", email: "emily@example.com", role: "STUDENT", createdAt: new Date(Date.now() - 432000000).toISOString(), student: { enrollmentNo: "STU003", department: "Biology", semester: 2 } },
        { id: "7", name: "Dr. Robert Brown", email: "robert@example.com", role: "TEACHER", createdAt: new Date(Date.now() - 518400000).toISOString(), teacher: { employeeId: "TCH003", department: "English", subject: "Literature" } },
        { id: "8", name: "Lisa Anderson", email: "lisa@example.com", role: "STUDENT", createdAt: new Date(Date.now() - 604800000).toISOString(), student: { enrollmentNo: "STU004", department: "Economics", semester: 5 } },
      ]
      setUsers(demoUsers)
      setFilteredUsers(demoUsers)
      setTotalPages(1)
      setTotalUsers(demoUsers.length)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    let filtered = [...users]
    
    if (searchQuery) {
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }
    
    setFilteredUsers(filtered)
  }, [users, searchQuery, roleFilter])

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Success", description: "User deleted successfully" })
        fetchUsers()
      } else {
        throw new Error("Failed to delete user")
      }
    } catch {
      toast({ title: "Demo Mode", description: "User deletion simulated", variant: "default" })
    } finally {
      setActionLoading(false)
      setShowDeleteDialog(false)
      setSelectedUser(null)
    }
  }

  const handleSuspendUser = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/suspend`, { method: "POST" })
      if (res.ok) {
        toast({ title: "Success", description: `User ${user.name} suspended` })
        fetchUsers()
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast({ title: "Demo Mode", description: `User suspension simulated for ${user.name}` })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "STUDENT": return <GraduationCap className="w-4 h-4" />
      case "TEACHER": return <BookOpen className="w-4 h-4" />
      case "ADMIN": return <Shield className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "STUDENT": return "default"
      case "TEACHER": return "purple"
      case "ADMIN": return "destructive"
      default: return "secondary"
    }
  }

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === "STUDENT").length,
    teachers: users.filter(u => u.role === "TEACHER").length,
    admins: users.filter(u => u.role === "ADMIN").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "blue" },
          { label: "Students", value: stats.students, icon: GraduationCap, color: "green" },
          { label: "Teachers", value: stats.teachers, icon: BookOpen, color: "purple" },
          { label: "Admins", value: stats.admins, icon: Shield, color: "red" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    stat.color === "blue" && "bg-blue-100 text-blue-600",
                    stat.color === "green" && "bg-green-100 text-green-600",
                    stat.color === "purple" && "bg-purple-100 text-purple-600",
                    stat.color === "red" && "bg-red-100 text-red-600",
                  )}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="STUDENT">Students</SelectItem>
                <SelectItem value="TEACHER">Teachers</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <SkeletonTable />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">User</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Role</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Details</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Joined</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <AnimatePresence>
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.image} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant={getRoleBadgeVariant(user.role) as any} className="gap-1">
                              {getRoleIcon(user.role)}
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-500">
                            {user.role === "STUDENT" && user.student && (
                              <div>
                                <p>{user.student.department}</p>
                                <p className="text-xs">Sem: {user.student.semester}</p>
                              </div>
                            )}
                            {user.role === "TEACHER" && user.teacher && (
                              <div>
                                <p>{user.teacher.department}</p>
                                <p className="text-xs">{user.teacher.subject}</p>
                              </div>
                            )}
                            {user.role === "ADMIN" && <span className="text-red-600">Full Access</span>}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-500">
                            {formatDate(new Date(user.createdAt))}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowViewDialog(true) }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Email
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleSuspendUser(user)}>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Suspend User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => { setSelectedUser(user); setShowDeleteDialog(true) }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {filteredUsers.length} of {totalUsers} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.image} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role) as any} className="mt-1">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">User ID</Label>
                  <p className="font-mono text-sm">{selectedUser.id}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Joined</Label>
                  <p className="text-sm">{formatDate(new Date(selectedUser.createdAt))}</p>
                </div>
                {selectedUser.role === "STUDENT" && selectedUser.student && (
                  <>
                    <div>
                      <Label className="text-gray-500 text-xs">Enrollment No</Label>
                      <p className="text-sm">{selectedUser.student.enrollmentNo || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Semester</Label>
                      <p className="text-sm">{selectedUser.student.semester || "N/A"}</p>
                    </div>
                  </>
                )}
                {selectedUser.role === "TEACHER" && selectedUser.teacher && (
                  <>
                    <div>
                      <Label className="text-gray-500 text-xs">Employee ID</Label>
                      <p className="text-sm">{selectedUser.teacher.employeeId || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Subject</Label>
                      <p className="text-sm">{selectedUser.teacher.subject || "N/A"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            <Button>Edit User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account on the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="john@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
