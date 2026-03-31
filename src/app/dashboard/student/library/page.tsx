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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <p className="text-gray-600">Access study materials from your classes</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00E599] hover:bg-[#00c988] text-black font-bold shadow-[0_0_15px_rgba(0,229,153,0.2)]">
              <Upload className="w-4 h-4 mr-2" />
              Share Notes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-[#161616] border-[#1C1C1C]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Share Study Material</DialogTitle>
              <DialogDescription className="text-[#9A9A9A]">Upload notes or resources to your class library.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-medium">Select Files * (Max 3)</Label>
                <div 
                  className="border-2 border-dashed border-[#1C1C1C] rounded-xl p-8 text-center hover:border-[#00E599]/30 transition-all cursor-pointer group bg-black/20"
                  onClick={() => document.getElementById("student-library-files")?.click()}
                >
                  <input
                    type="file"
                    id="student-library-files"
                    className="hidden"
                    multiple
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
                    <Cloud className="w-10 h-10 text-[#555] group-hover:text-[#00E599] transition-all mb-2" />
                    <p className="text-sm font-bold text-white">Click to select notes</p>
                    <p className="text-xs text-[#555] mt-1 font-medium">PDF, Image, Document</p>
                  </div>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#1F1F1F] border border-[#1C1C1C]">
                        <div className="flex items-center gap-3">
                          <File className="w-4 h-4 text-[#00E599]" />
                          <span className="text-sm font-medium text-white line-clamp-1">{f.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-400"
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
                <Label className="text-[#9A9A9A] font-medium">Class *</Label>
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

              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-medium">Description (Optional)</Label>
                <Input
                  className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-[#00E599]/20 placeholder:text-[#666666]"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  placeholder="What's this about?"
                />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-[#1C1C1C]">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white">Cancel</Button>
              <Button 
                onClick={handleStudentLibraryUpload} 
                disabled={uploading || uploadedFiles.length === 0 || !newMaterial.classId}
                className="bg-[#00E599] hover:bg-[#00c988] text-black font-bold"
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Book className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{materials.length}</p>
                <p className="text-xs text-gray-500">Total Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{materials.filter(m => m.type === "document" || m.type === "pdf").length}</p>
                <p className="text-xs text-gray-500">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Video className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{materials.filter(m => m.type === "video").length}</p>
                <p className="text-xs text-gray-500">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Book className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-xs text-gray-500">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="pdf">PDFs</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="link">Links</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle>Study Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <Book className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No materials found</h3>
              <p className="text-gray-500">Try adjusting your search or upload new notes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMaterials.map((material) => {
                const Icon = typeIcons[material.type] || File
                return (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{material.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <Badge variant="outline">{material.classCode}</Badge>
                        <span>{material.className}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(material.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {material.description && (
                        <p className="text-sm text-gray-500 mt-1">{material.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {material.url && (
                        <Button variant="ghost" size="icon" asChild>
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
                      )}
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
