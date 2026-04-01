"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Download, FileText, Video, Book, File, Eye, Clock, Upload, Trash2, Cloud, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

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
  pdf: FileText,
  document: FileText,
  video: Video,
  link: Book,
  other: File,
}

export default function StudentLibraryPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [materials, setMaterials] = useState<Material[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "document",
    url: "",
    classId: "",
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
        toast({ title: "Error", description: "Failed to load library", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load library", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleStudentLibraryUpload = async () => {
    if (uploadedFiles.length === 0 || !newMaterial.classId) {
      toast({ title: "Error", description: "Please select files and a class.", variant: "destructive" })
      return
    }

    setUploading(true)
    try {
      // 1. Upload to Cloudinary via our API route
      const formData = new FormData()
      uploadedFiles.forEach(file => formData.append("file", file))
      formData.append("folder", "student_notes")

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const uploadResult = await uploadRes.json()

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload files to Cloudinary")
      }

      // 2. Save metadata for each file to our database
      const savePromises = uploadResult.data.map(async (cloudinaryFile: any) => {
        const res = await fetch("/api/library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: cloudinaryFile.original_filename || "Untitled Notes",
            description: newMaterial.description,
            type: "document", // Default to document for students sharing notes
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
          title: "Notes shared", 
          description: `Successfully shared ${successfulSaves.length} file(s) with your class.` 
        })
      } else {
        throw new Error("Failed to save materials to database")
      }
    } catch (error) {
      console.error("Student library upload error:", error)
      toast({ 
        title: "Upload failed", 
        description: error instanceof Error ? error.message : "Failed to process shared notes", 
        variant: "destructive" 
      })
    } finally {
      setUploading(false)
    }
  }

  const handleUpload = async () => {
    if (!newMaterial.title || !newMaterial.classId) {
      toast({ title: "Error", description: "Title and class are required", variant: "destructive" })
      return
    }
    setUploading(true)
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMaterial),
      })
      if (res.ok) {
        const data = await res.json()
        setMaterials([data.data, ...materials])
        setNewMaterial({ title: "", description: "", type: "document", url: "", classId: "" })
        setIsUploadOpen(false)
        toast({ title: "Success", description: "Material uploaded successfully" })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed to upload", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to upload material", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || m.type === typeFilter
    return matchesSearch && matchesType
  })

  // Loading spinner using white styling
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Library</h1>
          <p className="text-[#9A9A9A] text-sm mt-1">Access study materials from your classes</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white hover:bg-gray-200 text-black font-semibold rounded-xl h-10 px-4 transition-all active:scale-95 shadow-none border border-[#252525]">
              <Upload className="w-4 h-4 mr-2" />
              Share Notes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-[#161616] border-[#1C1C1C] p-0 shadow-[0_8px_32px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden">
            <DialogHeader className="p-6 border-b border-[#252525] bg-[#1A1A1A]">
              <DialogTitle className="text-xl font-bold text-white">Share Study Material</DialogTitle>
              <DialogDescription className="text-[#9A9A9A] mt-1.5">Upload notes or resources to your class library.</DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Select Files * (Max 3)</Label>
                <div 
                  className="border-2 border-dashed border-[#252525] rounded-xl p-8 text-center hover:border-white/30 transition-all cursor-pointer group bg-[#111111] hover:bg-white/[0.02]"
                  onClick={() => document.getElementById("student-library-files")?.click()}
                >
                  <input
                    type="file"
                    id="student-library-files"
                    title="Select study material files"
                    aria-label="Select study material files"
                    className="hidden"
                    multiple
                    accept="application/pdf,image/*,.doc,.docx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 3) {
                        toast({ title: "Too many files", description: "You can upload up to 3 files at a time.", variant: "destructive" });
                        return;
                      }
                      setUploadedFiles(files);
                    }}
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:bg-white/10 transition-colors">
                      <Cloud className="w-6 h-6 text-[#9A9A9A] group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-sm font-bold text-white">Click to select notes</p>
                    <p className="text-xs text-[#555] mt-1 font-medium">PDF, Image, Document</p>
                  </div>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#111111] border border-[#252525]">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-white/10">
                            <File className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-white line-clamp-1">{f.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
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

              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Class *</Label>
                <Select
                  value={newMaterial.classId}
                  onValueChange={(value) => setNewMaterial({ ...newMaterial, classId: value })}
                >
                  <SelectTrigger className="bg-[#111111] border-[#252525] text-white h-10 rounded-lg focus:ring-0 focus:border-[#444] transition-colors">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-[#252525] rounded-xl shadow-xl">
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id} className="text-white focus:bg-white/10 focus:text-white rounded-lg my-1 cursor-pointer">
                        {cls.name} <span className="text-[#555] ml-1">({cls.code})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Description (Optional)</Label>
                <Input
                  className="bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#555] h-10 rounded-lg transition-colors"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  placeholder="What's this about?"
                />
              </div>
            </div>
            <DialogFooter className="p-6 border-t border-[#252525] bg-[#1A1A1A]">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="border-transparent bg-transparent text-[#9A9A9A] hover:bg-white/5 hover:text-white rounded-xl">Cancel</Button>
              <Button 
                onClick={handleStudentLibraryUpload} 
                disabled={uploading || uploadedFiles.length === 0 || !newMaterial.classId}
                className="bg-white hover:bg-gray-200 text-black font-semibold rounded-xl px-6 transition-all active:scale-95"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Share Notes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Materials", value: materials.length, icon: Book },
          { label: "Documents", value: materials.filter(m => m.type === "document" || m.type === "pdf").length, icon: FileText },
          { label: "Videos", value: materials.filter(m => m.type === "video").length, icon: Video },
          { label: "Classes", value: classes.length, icon: Book },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#161616] border-[#1C1C1C] shadow-none">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-[#111111] border border-[#252525]">
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-[#888] font-medium">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#555] w-4 h-4 group-focus-within:text-white transition-colors" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#555] h-10 rounded-xl transition-all"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-[#111111] border-[#252525] text-white h-10 rounded-xl focus:ring-0 focus:border-[#444] transition-colors">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#161616] border-[#252525] rounded-xl shadow-xl">
                <SelectItem value="all" className="text-white focus:bg-white/10 focus:text-white rounded-lg my-1 cursor-pointer">All Types</SelectItem>
                <SelectItem value="document" className="text-white focus:bg-white/10 focus:text-white rounded-lg my-1 cursor-pointer">Documents</SelectItem>
                <SelectItem value="pdf" className="text-white focus:bg-white/10 focus:text-white rounded-lg my-1 cursor-pointer">PDFs</SelectItem>
                <SelectItem value="video" className="text-white focus:bg-white/10 focus:text-white rounded-lg my-1 cursor-pointer">Videos</SelectItem>
                <SelectItem value="link" className="text-white focus:bg-white/10 focus:text-white rounded-lg my-1 cursor-pointer">Links</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card className="bg-[#161616] border-[#1C1C1C] shadow-none overflow-hidden">
        <CardHeader className="border-b border-[#252525] px-6 py-5 bg-[#1A1A1A]">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            STUDY MATERIALS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#252525] flex items-center justify-center mx-auto mb-4">
                <Book className="w-8 h-8 text-[#555]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No materials found</h3>
              <p className="text-[#888] text-sm">Try adjusting your search or share new notes</p>
            </div>
          ) : (
            <div className="divide-y divide-[#252525]">
              {filteredMaterials.map((material) => {
                const Icon = typeIcons[material.type] || File
                // Assign a color based on material type
                let iconColor = "text-white"
                let bgColor = "bg-white/10"
                let borderColor = "border-white/20"
                
                if (material.type === "pdf") {
                  iconColor = "text-red-400"; bgColor = "bg-red-500/10"; borderColor = "border-red-500/20";
                } else if (material.type === "video") {
                  iconColor = "text-blue-400"; bgColor = "bg-blue-500/10"; borderColor = "border-blue-500/20";
                } else if (material.type === "document") {
                  iconColor = "text-emerald-400"; bgColor = "bg-emerald-500/10"; borderColor = "border-emerald-500/20";
                }

                return (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-[#111111] transition-colors group"
                  >
                    <div className={`p-3 rounded-xl border flex-shrink-0 ${bgColor} ${borderColor} self-start sm:self-center group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-white transition-colors">{material.title}</h3>
                      {material.description && (
                        <p className="text-xs text-[#888] line-clamp-1 group-hover:text-[#AAA] transition-colors">{material.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Badge variant="outline" className="h-5 text-[10px] font-bold bg-[#111111] border-[#333] text-[#888] px-2 rounded-md">
                          {material.classCode}
                        </Badge>
                        <span className="text-[11px] font-medium text-[#555] truncate max-w-[150px]">{material.className}</span>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-[#333]" />
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#555]">
                          <Clock className="w-3 h-3" />
                          {new Date(material.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 self-end sm:self-center">
                      <Button variant="outline" size="sm" asChild className="h-8 border-[#333] bg-[#111111] text-[#9A9A9A] hover:bg-white hover:text-black hover:border-white transition-all rounded-lg font-semibold text-xs px-3">
                        <a 
                          href={material.url ? (material.url.includes("cloudinary.com") ? material.url.replace("/upload/", "/upload/fl_attachment/") : material.url) : "#"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title={`Download ${material.title}`}
                          download={material.title}
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
