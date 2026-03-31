"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Library,
  Search,
  Upload,
  FileText,
  Video,
  Link,
  Download,
  Eye,
  Trash2,
  File,
  Image,
  BookOpen,
  Cloud,
  Loader2,
  Filter,
} from "lucide-react"

interface Material {
  id: string
  title: string
  description: string | null
  type: string
  url: string | null
  className: string
  classCode: string
  classId: string
  uploadedAt: string
}

interface ClassOption {
  id: string
  name: string
  code: string
}

const typeIcons: Record<string, typeof FileText> = {
  document: FileText,
  pdf: FileText,
  video: Video,
  link: Link,
  image: Image,
  presentation: FileText,
  other: File,
}

const typeColors: Record<string, { bg: string; text: string }> = {
  document: { bg: "bg-blue-500/10 border border-blue-500/20", text: "text-blue-400" },
  pdf:      { bg: "bg-blue-500/10 border border-blue-500/20", text: "text-blue-400" },
  video:    { bg: "bg-red-500/10 border border-red-500/20",   text: "text-red-400" },
  link:     { bg: "bg-emerald-500/10 border border-emerald-500/20", text: "text-emerald-400" },
  image:    { bg: "bg-purple-500/10 border border-purple-500/20", text: "text-purple-400" },
  presentation: { bg: "bg-orange-500/10 border border-orange-500/20", text: "text-orange-400" },
  other:    { bg: "bg-white/5 border border-white/10", text: "text-[#9A9A9A]" },
}

const typeBadgeColors: Record<string, string> = {
  document: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pdf:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  video:    "bg-red-500/10 text-red-400 border-red-500/20",
  link:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  image:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
  presentation: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  other:    "bg-white/5 text-[#9A9A9A] border-white/10",
}

export default function TeacherLibraryPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [materials, setMaterials] = useState<Material[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [classFilter, setClassFilter] = useState("all")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "document",
    classId: "",
    url: "",
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/library")
      if (res.ok) {
        const data = await res.json()
        setMaterials(data.data || [])
        setClasses(data.classes || [])
      } else {
        toast({ title: "Error", description: "Failed to load materials", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load materials", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleLibraryUpload = async () => {
    if (uploadedFiles.length === 0 || !newMaterial.classId) {
      toast({ title: "Error", description: "Please select files and a class.", variant: "destructive" })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      uploadedFiles.forEach(file => formData.append("file", file))
      formData.append("folder", "library_materials")

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const uploadResult = await uploadRes.json()

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload files to Cloudinary")
      }

      const savePromises = uploadResult.data.map(async (cloudinaryFile: any) => {
        const res = await fetch("/api/library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: cloudinaryFile.original_filename || "Untitled",
            description: newMaterial.description,
            type: newMaterial.type,
            classId: newMaterial.classId,
            url: cloudinaryFile.secure_url,
          }),
        })
        return res.json()
      })

      const saveResults = await Promise.all(savePromises)
      const successfulSaves = saveResults.filter(r => r.success).map(r => r.data)

      if (successfulSaves.length > 0) {
        setMaterials([...successfulSaves, ...materials])
        setUploadedFiles([])
        setNewMaterial({ ...newMaterial, title: "", description: "", url: "" })
        setIsUploadOpen(false)
        toast({
          title: "Library updated",
          description: `Successfully stored ${successfulSaves.length} file(s) in your library.`
        })
      } else {
        throw new Error("Failed to save materials to database")
      }
    } catch (error) {
      console.error("Library upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process library materials",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/library?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setMaterials(materials.filter(m => m.id !== id))
        toast({ title: "Material deleted", description: "The material has been removed from the library." })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed to delete", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete material", variant: "destructive" })
    }
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || material.type === typeFilter
    const matchesClass = classFilter === "all" || material.classId === classFilter
    return matchesSearch && matchesType && matchesClass
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1F1F1F] rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#1F1F1F] rounded-xl animate-pulse border border-[#1C1C1C]" />
          ))}
        </div>
        <div className="h-16 bg-[#1F1F1F] rounded-xl animate-pulse border border-[#1C1C1C]" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-[#1F1F1F] rounded-xl animate-pulse border border-[#1C1C1C]" />
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    { label: "Total Materials", value: materials.length, icon: Library, iconColor: "text-purple-400", iconBg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Documents", value: materials.filter(m => m.type === "document" || m.type === "pdf").length, icon: FileText, iconColor: "text-blue-400", iconBg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Videos", value: materials.filter(m => m.type === "video").length, icon: Video, iconColor: "text-red-400", iconBg: "bg-red-500/10 border-red-500/20" },
    { label: "Classes", value: classes.length, icon: BookOpen, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10 border-emerald-500/20" },
  ]

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Library</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">Manage your teaching materials</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white hover:bg-white/90 text-black font-semibold h-9 px-4 rounded-xl transition-all active:scale-95 border-none text-sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0C0C0C] border-[#1C1C1C] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Upload Material</DialogTitle>
              <DialogDescription className="text-[#9A9A9A]">Add new files to your library</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* File Drop Zone */}
              <div className="space-y-2">
                <Label className="text-[#9A9A9A] text-xs font-semibold uppercase tracking-widest">Files * (Max 5)</Label>
                <div
                  className="border-2 border-dashed border-[#1C1C1C] rounded-xl p-8 text-center hover:border-white/20 transition-all cursor-pointer group bg-white/[0.02]"
                  onClick={() => document.getElementById("library-files")?.click()}
                >
                  <input
                    type="file"
                    id="library-files"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 5) {
                        toast({ title: "Too many files", description: "You can upload up to 5 files at a time.", variant: "destructive" });
                        return;
                      }
                      setUploadedFiles(files);
                    }}
                  />
                  <div className="flex flex-col items-center">
                    <Cloud className="w-10 h-10 text-[#444] group-hover:text-white transition-all mb-2" />
                    <p className="text-sm font-bold text-white">Click to select files</p>
                    <p className="text-xs text-[#555] mt-1">PDF, Image, Video, Presentation</p>
                  </div>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#1F1F1F] border border-[#1C1C1C]">
                        <div className="flex items-center gap-3">
                          <File className="w-4 h-4 text-[#9A9A9A]" />
                          <span className="text-sm font-medium text-white line-clamp-1">{f.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFiles(uploadedFiles.filter((_, idx) => idx !== i));
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Class Selector */}
              <div className="space-y-2">
                <Label className="text-[#9A9A9A] text-xs font-semibold uppercase tracking-widest">Class *</Label>
                <Select
                  value={newMaterial.classId}
                  onValueChange={(value) => setNewMaterial({ ...newMaterial, classId: value })}
                >
                  <SelectTrigger className="bg-[#1F1F1F] border-[#1C1C1C] text-white">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name} ({cls.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resource Type */}
              <div className="space-y-2">
                <Label className="text-[#9A9A9A] text-xs font-semibold uppercase tracking-widest">Resource Type</Label>
                <Select
                  value={newMaterial.type}
                  onValueChange={(value) => setNewMaterial({ ...newMaterial, type: value })}
                >
                  <SelectTrigger className="bg-[#1F1F1F] border-[#1C1C1C] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="border-t border-[#1C1C1C] pt-4">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={handleLibraryUpload}
                disabled={uploading || uploadedFiles.length === 0 || !newMaterial.classId}
                className="bg-white hover:bg-white/90 text-black font-semibold transition-all active:scale-95 border-none"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Store in Library
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="border-[#1C1C1C] shadow-none hover:border-[#252525] transition-all group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-[#9A9A9A] font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1 text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all group-hover:shadow-lg ${stat.iconBg}`}>
                    <stat.icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="border-[#1C1C1C] shadow-none">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] w-4 h-4" />
                <Input
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#1F1F1F] border-[#1C1C1C] text-white placeholder:text-[#555] focus:border-[#333]"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-[#555] shrink-0" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-[#1F1F1F] border-[#1C1C1C] text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="pdf">PDFs</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="link">Links</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="presentation">Presentations</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-[#1F1F1F] border-[#1C1C1C] text-white">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-[#1C1C1C] text-white">
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Materials List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="border-[#1C1C1C] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#1C1C1C] pb-4">
            <div>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Library className="w-4 h-4 text-purple-400" />
                Materials
              </CardTitle>
              <p className="text-xs text-[#555] mt-1">
                {filteredMaterials.length} material{filteredMaterials.length !== 1 ? "s" : ""}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border border-[#1C1C1C] flex items-center justify-center mb-4">
                  <Library className="w-8 h-8 text-[#444]" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">No materials found</h3>
                <p className="text-sm text-[#555]">Try adjusting your filters or upload new materials</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1C1C1C]">
                {filteredMaterials.map((material, index) => {
                  const IconComponent = typeIcons[material.type] || File
                  const colors = typeColors[material.type] || typeColors.other
                  return (
                    <motion.div
                      key={material.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-all group"
                    >
                      {/* Icon */}
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                        <IconComponent className={`w-5 h-5 ${colors.text}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate text-sm">{material.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={`text-[10px] border ${typeBadgeColors[material.type] || typeBadgeColors.other} px-1.5 py-0`}>
                            {material.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs font-bold text-[#555] uppercase tracking-wider">{material.classCode}</span>
                          <span className="text-xs text-[#444]">•</span>
                          <span className="text-xs text-[#555]">{new Date(material.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        {material.description && (
                          <p className="text-xs text-[#555] mt-1 line-clamp-1">{material.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {material.url && (
                          <>
                            <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-[#9A9A9A] hover:text-white hover:bg-white/5 rounded-lg">
                              <a href={material.url} target="_blank" rel="noopener noreferrer" title={`View ${material.title}`}>
                                <Eye className="w-4 h-4" />
                              </a>
                            </Button>
                            <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-[#9A9A9A] hover:text-white hover:bg-white/5 rounded-lg">
                              <a
                                href={material.url.includes("cloudinary.com") ? material.url.replace("/upload/", "/upload/fl_attachment/") : material.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Download ${material.title}`}
                                download={material.title}
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#9A9A9A] hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          onClick={() => handleDelete(material.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
