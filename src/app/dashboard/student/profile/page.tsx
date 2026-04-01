"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Building, Save, Camera, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { getInitials, cn } from "@/lib/utils"
import { Star, AlertTriangle, MessageCircle, Heart, MessageSquare } from "lucide-react"
import { RaiseIssueDialog } from "@/components/student/RaiseIssueDialog"
import { format } from "date-fns"

export default function StudentProfilePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    enrollmentNo: "",
    department: "",
    semester: "",
    dateOfBirth: "",
    image: "",
    section: "",
    batch: "",
    guardianName: "",
    guardianPhone: "",
    alternateEmail: "",
    interests: "",
    referralSource: "",
  })
  const [ratings, setRatings] = useState<any[]>([])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/student")
          if (res.ok) {
            const data = await res.json()
            setProfile({
              name: data.user?.name || "",
              email: data.user?.email || "",
              phone: data.phone || "",
              address: data.address || "",
              enrollmentNo: data.enrollmentNo || "",
              department: data.department || "",
              semester: data.semester?.toString() || "",
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split("T")[0] : "",
              image: data.user?.image || "",
              section: data.section || "",
              batch: data.batch || "",
              guardianName: data.guardianName || "",
              guardianPhone: data.guardianPhone || "",
              alternateEmail: data.alternateEmail || "",
              interests: data.interests || "",
              referralSource: data.referralSource || "",
            })
            setRatings(data.receivedRatings || [])
          } else {
            // Fallback to dashboard API
            const dashRes = await fetch("/api/student/dashboard")
            const dashData = await dashRes.json()
            if (dashData.success && dashData.data.student) {
              setProfile(prev => ({
                ...prev,
                name: dashData.data.student.name || "",
                email: dashData.data.student.email || "",
                enrollmentNo: dashData.data.student.enrollmentNo || "",
                department: dashData.data.student.department || "",
                semester: dashData.data.student.semester?.toString() || "",
                image: dashData.data.student.image || "",
              }))
            }
          }
      } catch (error) {
        console.error("Failed to load profile:", error)
        toast({ title: "Error", description: "Failed to load profile data", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/profile/student", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: profile.phone || null,
          department: profile.department || null,
          semester: profile.semester ? parseInt(profile.semester) : null,
          section: profile.section || null,
          batch: profile.batch || null,
          address: profile.address || null,
          dateOfBirth: profile.dateOfBirth || null,
          guardianName: profile.guardianName || null,
          guardianPhone: profile.guardianPhone || null,
          alternateEmail: profile.alternateEmail || null,
          interests: profile.interests || null,
          referralSource: profile.referralSource || null,
          image: profile.image || null,
        }),
      })

      if (res.ok) {
        toast({ title: "Success", description: "Profile updated successfully" })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error || "Failed to update profile", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-[#9A9A9A]">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-[#161616] border-[#1C1C1C] overflow-hidden">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block">
                <Avatar className="w-32 h-32 mx-auto border-4 border-[#1C1C1C]">
                  <AvatarImage src={profile.image} />
                  <AvatarFallback className="text-3xl bg-[#1F1F1F] text-white">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  id="student-avatar-upload"
                  title="Upload profile image"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("folder", "student_profiles");
                    
                    try {
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const result = await res.json();
                      if (result.success && result.data && result.data[0]) {
                        const newImageUrl = result.data[0].secure_url;
                        setProfile({ ...profile, image: newImageUrl });
                        toast({ title: "Image uploaded", description: "Save changes to persist." });
                      } else {
                        toast({ title: "Upload failed", description: result.error || "Unknown error", variant: "destructive" });
                      }
                    } catch (err) {
                      toast({ title: "Error uploading", description: "Failed to connect to upload service", variant: "destructive" });
                    }
                  }}
                />
                <Button 
                  size="icon" 
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 shadow-lg bg-white hover:bg-gray-200 text-black border border-[#252525]"
                  onClick={() => document.getElementById("student-avatar-upload")?.click()}
                >
                  <Camera className="w-5 h-5" />
                </Button>
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">{profile.name}</h2>
              <p className="text-[#9A9A9A] text-sm mb-4">{profile.email}</p>
              
              <div className="space-y-4">
                <div className="p-3 bg-[#111111] rounded-xl border border-[#252525]">
                  <p className="text-xs text-[#9A9A9A] font-bold uppercase tracking-wider">Student ID Card</p>
                  <p className="text-lg font-mono font-bold text-white mt-1">{profile.enrollmentNo || "N/A"}</p>
                </div>

                <Card className="border-[#1C1C1C] bg-[#111111] overflow-hidden text-left shadow-none">
                  <CardHeader className="p-3 bg-[#161616] border-b border-[#252525]">
                    <CardTitle className="flex items-center gap-2 text-sm text-white">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                        <Star className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                      Feedback from Teachers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {ratings.length === 0 ? (
                      <div className="text-center py-4 px-2">
                        <MessageCircle className="w-8 h-8 text-[#444] mx-auto mb-2" />
                        <p className="text-[10px] text-[#9A9A9A]">No feedback yet from teachers.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {ratings.map((rating) => (
                          <div 
                            key={rating.id} 
                            className="p-3 rounded-lg border border-[#252525] bg-[#161616] transition-all"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7 border border-[#252525]">
                                  <AvatarImage src={rating.teacher?.user?.image} />
                                  <AvatarFallback className="text-[10px] bg-[#1F1F1F] text-white font-bold">{getInitials(rating.teacher?.user?.name || "T")}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{rating.teacher?.user?.name}</p>
                                  <p className="text-[10px] text-[#7A7A7A] mt-0.5">{format(new Date(rating.createdAt), 'MMM dd')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                                <Star className="w-2.5 h-2.5 text-white fill-white" />
                                <span className="text-[10px] font-bold text-white">{rating.rating}</span>
                              </div>
                            </div>

                            {rating.feedback && (
                              <p className="text-[11px] text-[#B5B5B5] italic bg-[#111111] p-2 rounded-md border border-[#252525] mb-3 line-clamp-2">
                                "{rating.feedback}"
                              </p>
                            )}

                            <RaiseIssueDialog
                              defaultCategory="GENERAL"
                              teacherId={rating.teacherId}
                              classId={rating.classId}
                              defaultTitle={`Rating Dispute - ${rating.class?.name || 'Class'}`}
                              defaultDescription={`I'd like to discuss the ${rating.rating}/5 rating from ${rating.teacher?.user?.name}.`}
                              trigger={
                                <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] font-bold text-[#9A9A9A] hover:text-white hover:bg-white/5 border border-transparent transition-all">
                                  <AlertTriangle className="w-3 h-3 mr-1.5" /> Dispute
                                </Button>
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 pt-6 border-t border-[#1C1C1C] space-y-4">
                <div className="flex items-center gap-3 text-sm text-[#B5B5B5]">
                  <Building className="w-4 h-4 text-[#555]" />
                  <span>{profile.department}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#B5B5B5]">
                  <GraduationCap className="w-4 h-4 text-[#555]" />
                  <span>Semester {profile.semester} • Section {profile.section}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
            <CardHeader className="border-b border-[#1C1C1C]">
              <CardTitle className="text-white text-lg font-bold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-[#555]" />
                    <Input className="pl-10 bg-[#111111] border-[#252525] text-[#7A7A7A] focus-visible:ring-0 disabled:opacity-75 focus-visible:border-[#444] h-10" value={profile.name} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-[#555]" />
                    <Input className="pl-10 bg-[#111111] border-[#252525] text-[#7A7A7A] focus-visible:ring-0 disabled:opacity-75 focus-visible:border-[#444] h-10" value={profile.email} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Alternate Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-[#555]" />
                    <Input className="pl-10 bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#444] h-10 transition-colors" placeholder="personal@email.com" value={profile.alternateEmail} onChange={(e) => setProfile({ ...profile, alternateEmail: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-[#555]" />
                    <Input className="pl-10 bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#444] h-10 transition-colors" placeholder="Enter phone number" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-[#555]" />
                    <Input className="pl-10 bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] h-10 transition-colors [color-scheme:dark]" type="date" value={profile.dateOfBirth} onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-[#555]" />
                    <Input className="pl-10 bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] h-10 transition-colors" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Semester</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-[#555]" />
                    <Input className="pl-10 bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] h-10 transition-colors" value={profile.semester} onChange={(e) => setProfile({ ...profile, semester: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Section</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 w-4 h-4 text-[#555]" />
                    <Input className="pl-10 bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#444] h-10 transition-colors" placeholder="e.g. A" value={profile.section} onChange={(e) => setProfile({ ...profile, section: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Batch</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-[#555]" />
                    <Input className="pl-10 bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#444] h-10 transition-colors" placeholder="e.g. 2024-2028" value={profile.batch} onChange={(e) => setProfile({ ...profile, batch: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#555]" />
                  <Input className="pl-10 bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#444] h-10 transition-colors" placeholder="Enter your address" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-[#1C1C1C] pt-6">
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Guardian Name</Label>
                  <Input className="bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#444] h-10 transition-colors" placeholder="Enter guardian name" value={profile.guardianName} onChange={(e) => setProfile({ ...profile, guardianName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Guardian Phone</Label>
                  <Input className="bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#444] h-10 transition-colors" placeholder="Enter guardian phone" value={profile.guardianPhone} onChange={(e) => setProfile({ ...profile, guardianPhone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Areas of Interest</Label>
                  <Input className="bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#444] h-10 transition-colors" placeholder="e.g. AI, Space Research, Sports" value={profile.interests} onChange={(e) => setProfile({ ...profile, interests: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-semibold text-xs uppercase tracking-wider">Where you heard about us</Label>
                  <Input className="bg-[#111111] border-[#252525] text-white focus-visible:ring-0 focus-visible:border-[#444] placeholder:text-[#444] h-10 transition-colors" placeholder="e.g. LinkedIn, Friend, College" value={profile.referralSource} onChange={(e) => setProfile({ ...profile, referralSource: e.target.value })} />
                </div>
              </div>

              <div className="border-t border-[#1C1C1C] pt-6">
                <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto bg-white hover:bg-gray-200 text-black font-semibold h-10 px-8 transition-colors">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
