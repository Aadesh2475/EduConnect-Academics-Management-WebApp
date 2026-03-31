"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Database,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Server,
  Activity,
  Zap,
  FileText
} from "lucide-react"

interface BackupInfo {
  id: string
  name: string
  size: string
  createdAt: string
  type: "auto" | "manual"
  status: "completed" | "failed"
}

interface TableInfo {
  name: string
  records: number
  size: string
  lastModified: string
}

export default function AdminDatabasePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [tables, setTables] = useState<TableInfo[]>([])
  const [isBackupInProgress, setIsBackupInProgress] = useState(false)

  const dbStats = {
    totalSize: "2.4 GB",
    usedSize: "1.8 GB",
    usedPercent: 75,
    totalRecords: 125678,
    tablesCount: 12,
    lastBackup: "2024-01-15T06:00:00",
    status: "healthy",
    uptime: "99.99%",
  }

  useEffect(() => {
    setTimeout(() => {
      setBackups([
        { id: "1", name: "backup_2024-01-15_auto.sql", size: "1.6 GB", createdAt: "2024-01-15T06:00:00", type: "auto", status: "completed" },
        { id: "2", name: "backup_2024-01-14_auto.sql", size: "1.5 GB", createdAt: "2024-01-14T06:00:00", type: "auto", status: "completed" },
        { id: "3", name: "backup_2024-01-13_manual.sql", size: "1.5 GB", createdAt: "2024-01-13T14:30:00", type: "manual", status: "completed" },
        { id: "4", name: "backup_2024-01-12_auto.sql", size: "1.4 GB", createdAt: "2024-01-12T06:00:00", type: "auto", status: "completed" },
        { id: "5", name: "backup_2024-01-11_auto.sql", size: "1.4 GB", createdAt: "2024-01-11T06:00:00", type: "auto", status: "failed" },
      ])
      setTables([
        { name: "users", records: 890, size: "45 MB", lastModified: "2024-01-15T14:30:00" },
        { name: "students", records: 650, size: "38 MB", lastModified: "2024-01-15T14:25:00" },
        { name: "teachers", records: 120, size: "12 MB", lastModified: "2024-01-15T10:00:00" },
        { name: "classes", records: 85, size: "8 MB", lastModified: "2024-01-15T09:30:00" },
        { name: "enrollments", records: 2450, size: "25 MB", lastModified: "2024-01-15T14:20:00" },
        { name: "assignments", records: 340, size: "180 MB", lastModified: "2024-01-15T12:00:00" },
        { name: "submissions", records: 8560, size: "520 MB", lastModified: "2024-01-15T14:35:00" },
        { name: "exams", records: 156, size: "85 MB", lastModified: "2024-01-14T16:00:00" },
        { name: "exam_attempts", records: 4230, size: "120 MB", lastModified: "2024-01-15T13:00:00" },
        { name: "attendance", records: 45000, size: "95 MB", lastModified: "2024-01-15T14:00:00" },
        { name: "notifications", records: 12500, size: "45 MB", lastModified: "2024-01-15T14:30:00" },
        { name: "chat_messages", records: 50897, size: "650 MB", lastModified: "2024-01-15T14:35:00" },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const handleBackup = async () => {
    setIsBackupInProgress(true)
    toast({
      title: "Backup started",
      description: "Creating database backup...",
    })
    
    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const newBackup: BackupInfo = {
      id: Date.now().toString(),
      name: `backup_${new Date().toISOString().split("T")[0]}_manual.sql`,
      size: "1.8 GB",
      createdAt: new Date().toISOString(),
      type: "manual",
      status: "completed",
    }
    
    setBackups([newBackup, ...backups])
    setIsBackupInProgress(false)
    toast({
      title: "Backup completed",
      description: "Database backup has been created successfully.",
    })
  }

  const handleDeleteBackup = (id: string) => {
    setBackups(backups.filter(b => b.id !== id))
    toast({
      title: "Backup deleted",
      description: "The backup file has been removed.",
    })
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
          <h1 className="text-3xl font-bold text-gray-900">Database</h1>
          <p className="text-gray-500 mt-1">Monitor and manage database health</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={isBackupInProgress}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleBackup} disabled={isBackupInProgress}>
            {isBackupInProgress ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Backup Now
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dbStats.totalRecords.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <HardDrive className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dbStats.usedSize}</p>
                <p className="text-xs text-gray-500">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Server className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dbStats.tablesCount}</p>
                <p className="text-xs text-gray-500">Tables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dbStats.uptime}</p>
                <p className="text-xs text-gray-500">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            Storage Usage
          </CardTitle>
          <CardDescription>Database storage capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{dbStats.usedSize} of {dbStats.totalSize} used</span>
              <span className="font-medium">{dbStats.usedPercent}%</span>
            </div>
            <Progress value={dbStats.usedPercent} className="h-3" />
            <p className="text-xs text-gray-500">
              {(parseFloat(dbStats.totalSize) - parseFloat(dbStats.usedSize)).toFixed(1)} GB available
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-red-600" />
              Database Tables
            </CardTitle>
            <CardDescription>{tables.length} tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{table.name}</p>
                      <p className="text-xs text-gray-500">{table.records.toLocaleString()} records</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{table.size}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(table.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Backups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-red-600" />
              Backups
            </CardTitle>
            <CardDescription>Last backup: {new Date(dbStats.lastBackup).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {backup.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{backup.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{backup.size}</span>
                        <Badge variant="outline" className="text-xs">{backup.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(backup.createdAt).toLocaleDateString()}
                    </span>
                    <Button variant="ghost" size="icon" disabled={backup.status === "failed"}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteBackup(backup.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Database</span>
              </div>
              <p className="text-xs text-green-600">Online & Healthy</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Connections</span>
              </div>
              <p className="text-xs text-green-600">12 active / 100 max</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Replication</span>
              </div>
              <p className="text-xs text-green-600">In sync</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Auto Backup</span>
              </div>
              <p className="text-xs text-green-600">Daily at 6:00 AM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
