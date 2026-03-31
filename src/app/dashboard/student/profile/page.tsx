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
    return <div className="flex items-center justify-center h-96"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block">
                <Avatar className="w-32 h-32 mx-auto ring-4 ring-blue-50 dark:ring-blue-900/20">
                  <AvatarImage src={profile.image} />
                  <AvatarFallback className="text-3xl bg-blue-100 text-blue-600">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  id="student-avatar-upload"
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
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 shadow-lg"
                  onClick={() => document.getElementById("student-avatar-upload")?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{profile.email}</p>
              
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">Student ID Card</p>
                  <p className="text-lg font-mono font-bold text-blue-900 dark:text-blue-200 mt-1">{profile.enrollmentNo || "N/A"}</p>
                </div>

                {/* Academic Ratings Section - Moved below ID Card */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 overflow-hidden text-left">
                  <CardHeader className="p-3 bg-gray-50/50 bg-[#1F1F1F]/50 border-b border-gray-100 border-[#1C1C1C]">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <div className="p-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                        <Star className="w-3.5 h-3.5 text-yellow-600 fill-yellow-600" />
                      </div>
                      Feedback from Teachers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {ratings.length === 0 ? (
                      <div className="text-center py-4 px-2">
                        <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-[10px] text-gray-500">No feedback yet from teachers.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {ratings.map((rating) => (
                          <div 
                            key={rating.id} 
                            className="p-3 rounded-lg border border-gray-100 border-[#1C1C1C] bg-white bg-[#161616] shadow-sm transition-all"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="w-6 h-6 ring-1 ring-gray-100 dark:ring-gray-700">
                                  <AvatarImage src={rating.teacher?.user?.image} />
                                  <AvatarFallback className="text-[8px] bg-blue-50 text-blue-600">{getInitials(rating.teacher?.user?.name || "T")}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-gray-900 dark:text-gray-100 truncate">{rating.teacher?.user?.name}</p>
                                  <p className="text-[8px] text-gray-400">{format(new Date(rating.createdAt), 'MMM dd')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 bg-yellow-50 dark:bg-yellow-900/20 px-1 py-0.5 rounded-full border border-yellow-100 dark:border-yellow-900/30">
                                <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                                <span className="text-[9px] font-bold text-yellow-700 dark:text-yellow-500">{rating.rating}</span>
                              </div>
                            </div>

                            {rating.feedback && (
                              <p className="text-[10px] text-gray-600 dark:text-gray-400 italic bg-gray-50 bg-[#1F1F1F]/40 p-1.5 rounded-md border border-gray-100 border-[#1C1C1C] mb-2 line-clamp-2">
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
                                <Button variant="ghost" size="sm" className="w-full h-6 text-[9px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100">
                                  <AlertTriangle className="w-2.5 h-2.5 mr-1" /> Dispute
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

              <div className="mt-6 pt-6 border-t border-gray-100 border-[#1C1C1C] space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>{profile.department}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span>Semester {profile.semester} • Section {profile.section}</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" value={profile.name} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" value={profile.email} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alternate Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" placeholder="personal@email.com" value={profile.alternateEmail} onChange={(e) => setProfile({ ...profile, alternateEmail: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" placeholder="Enter phone number" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" type="date" value={profile.dateOfBirth} onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" value={profile.semester} onChange={(e) => setProfile({ ...profile, semester: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" placeholder="e.g. A" value={profile.section} onChange={(e) => setProfile({ ...profile, section: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Batch</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input className="pl-10" placeholder="e.g. 2024-2028" value={profile.batch} onChange={(e) => setProfile({ ...profile, batch: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input className="pl-10" placeholder="Enter your address" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Guardian Name</Label>
                  <Input placeholder="Enter guardian name" value={profile.guardianName} onChange={(e) => setProfile({ ...profile, guardianName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Guardian Phone</Label>
                  <Input placeholder="Enter guardian phone" value={profile.guardianPhone} onChange={(e) => setProfile({ ...profile, guardianPhone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Areas of Interest</Label>
                  <Input placeholder="e.g. AI, Space Research, Sports" value={profile.interests} onChange={(e) => setProfile({ ...profile, interests: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Where you heard about us</Label>
                  <Input placeholder="e.g. LinkedIn, Friend, College" value={profile.referralSource} onChange={(e) => setProfile({ ...profile, referralSource: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
