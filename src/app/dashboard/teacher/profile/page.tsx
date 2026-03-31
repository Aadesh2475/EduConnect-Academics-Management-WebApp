"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  User,
  Mail,
  Phone,
  Building,
  BookOpen,
  Calendar,
  Edit2,
  Save,
  Camera,
  Briefcase,
  GraduationCap,
  Star,
  AlertTriangle,
  MessageCircleQuestion,
  Flag,
  MapPin,
  Heart,
  Info
} from "lucide-react"

interface TeacherRating {
  id: string
  rating: number
  review?: string
  createdAt: string
  student: {
    user: {
      name: string
      image?: string
    }
  }
}

interface TeacherProfile {
  id: string
  name: string
  email: string
  phone: string
  image?: string
  department: string
  subject: string
  employeeId: string
  university: string
  qualification: string
  experience: string
  address: string
  alternateEmail: string
  purpose: string
  interests: string
  referralSource: string
  createdAt: string
  teacherRatings: TeacherRating[]
  averageRating: number
}

export default function TeacherProfilePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [editedProfile, setEditedProfile] = useState<TeacherProfile | null>(null)

  // Help Ticket modal state
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [helpSubject, setHelpSubject] = useState("Rating Dispute")
  const [helpDescription, setHelpDescription] = useState("")
  const [submittingHelp, setSubmittingHelp] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/teacher")
        if (res.ok) {
          const data = await res.json()

          let avgRate = 0
          const ratings = data.teacherRatings || []
          if (ratings.length > 0) {
            const sum = ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0)
            avgRate = Number((sum / ratings.length).toFixed(1))
          } else {
            avgRate = 4.5 // Default placeholder if entirely unrated
          }

          const mapped: TeacherProfile = {
            id: data.id || "",
            name: data.user?.name || "",
            email: data.user?.email || "",
            phone: data.phone || "",
            image: data.user?.image || "",
            department: data.department || "",
            subject: data.subject || "",
            employeeId: data.employeeId || "",
            university: data.university || "",
            qualification: data.qualification || "",
            experience: data.experience?.toString() || "",
            address: data.address || "",
            alternateEmail: data.alternateEmail || "",
            purpose: data.purpose || "",
            interests: data.interests || "",
            referralSource: data.referralSource || "",
            createdAt: data.createdAt || "",
            teacherRatings: ratings,
            averageRating: avgRate
          }
          setProfile(mapped)
          setEditedProfile(mapped)
        } else {
          toast({ title: "Error", description: "Failed to load profile", variant: "destructive" })
        }
      } catch (error) {
        console.error("Failed to load profile:", error)
        toast({ title: "Error", description: "Failed to load profile", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!editedProfile) return
    setSaving(true)
    try {
      const res = await fetch("/api/profile/teacher", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedProfile.name,
          image: editedProfile.image,
          department: editedProfile.department,
          subject: editedProfile.subject,
          university: editedProfile.university,
          phone: editedProfile.phone || null,
          qualification: editedProfile.qualification || null,
          experience: editedProfile.experience ? parseInt(editedProfile.experience) : null,
          address: editedProfile.address || null,
          alternateEmail: editedProfile.alternateEmail || null,
          purpose: editedProfile.purpose || null,
          interests: editedProfile.interests || null,
          referralSource: editedProfile.referralSource || null,
        }),
      })

      if (res.ok) {
        setProfile(editedProfile)
        setEditing(false)
        toast({ title: "Profile updated", description: "Your profile has been saved successfully." })
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

  const submitHelpTicket = async () => {
    if (!helpSubject || !helpDescription) return
    setSubmittingHelp(true)
    try {
      const res = await fetch("/api/teacher/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: helpSubject,
          description: helpDescription,
          category: "rating_dispute"
        })
      })
      if (res.ok) {
        toast({ title: "Help Ticket Submitted", description: "Administration has been notified of your dispute." })
        setIsHelpOpen(false)
        setHelpDescription("") // reset
      } else {
        toast({ title: "Failed to submit", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error submitting help ticket", variant: "destructive" })
    } finally {
      setSubmittingHelp(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!profile || !editedProfile) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-[#9A9A9A] mt-1">Manage your personal information</p>
        </div>
        <Button
          variant={editing ? "default" : "outline"}
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          className={cn(
            editing 
              ? "bg-white hover:bg-white/90 text-black font-bold" 
              : "border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white"
          )}
        >
          {editing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="bg-[#161616] border-[#1C1C1C]">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-[#1F1F1F]">
                  <AvatarImage src={editedProfile.image} alt={editedProfile.name} />
                  <AvatarFallback className="text-3xl bg-[#1F1F1F] text-white">
                    {getInitials(editedProfile.name)}
                  </AvatarFallback>
                </Avatar>
                {editing && (
                  <>
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      title="Profile picture upload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("folder", "teacher_profiles");
                        
                        try {
                          const res = await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                          });
                          const result = await res.json();
                          if (result.success && result.data && result.data[0]) {
                            const newImageUrl = result.data[0].secure_url;
                            setEditedProfile({ ...editedProfile, image: newImageUrl });
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
                      variant="secondary" 
                      className="absolute bottom-0 right-0 rounded-full bg-white hover:bg-white/90 text-black shadow-lg"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                {editing ? (
                  <div className="space-y-1">
                    <Label htmlFor="profile-name" className="text-[#9A9A9A] text-xs uppercase font-bold tracking-wider">Full Name</Label>
                    <Input
                      id="profile-name"
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                      className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20 text-2xl font-bold h-12"
                      placeholder="Enter your full name"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                    <p className="text-[#9A9A9A]">{profile.subject}</p>
                  </>
                )}
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start items-center">
                <Badge className="bg-[#1F1F1F] text-[#D4D4D4] border-[#252525] font-bold">{profile.department}</Badge>
                {profile.employeeId && <Badge variant="outline" className="border-[#1C1C1C] text-[#9A9A9A]">{profile.employeeId}</Badge>}
                
                {/* Average Rating Display */}
                <div className="flex items-center ml-2 bg-[#FFFFFF]/10 text-white font-bold px-3 py-1 rounded-full text-sm border border-[#FFFFFF]/20 shadow-[0_0_10px_rgba(0,229,153,0.1)]">
                  <Star className="w-4 h-4 mr-1 fill-amber-400 text-amber-400" />
                  {profile.averageRating} ({profile.teacherRatings.length})
                </div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-[#9A9A9A]">Member since</p>
              <p className="font-bold text-white">
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="bg-[#161616] p-1 rounded-xl border border-[#1C1C1C]">
          <TabsTrigger value="personal" className="data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-[#FFFFFF] rounded-lg transition-all">Personal Info</TabsTrigger>
          <TabsTrigger value="professional" className="data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-[#FFFFFF] rounded-lg transition-all">Professional</TabsTrigger>
          <TabsTrigger value="ratings" className="data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-[#FFFFFF] rounded-lg transition-all">Ratings & Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="bg-[#161616] border-[#1C1C1C]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-[#FFFFFF]" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-[#9A9A9A]">Your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#9A9A9A] font-medium">Full Name</Label>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#FFFFFF]" />
                    <span className="text-white font-medium">{profile.name}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#9A9A9A] font-medium">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#FFFFFF]" />
                    <span className="text-white font-medium">{profile.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#9A9A9A] font-medium">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#FFFFFF]" />
                    {editing ? (
                      <Input
                        id="phone"
                        value={editedProfile.phone}
                        onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20"
                      />
                    ) : (
                      <span className="text-white font-medium">{profile.phone || "Not set"}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternateEmail" className="text-[#9A9A9A] font-medium">Alternate Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#FFFFFF]" />
                    {editing ? (
                      <Input
                        id="alternateEmail"
                        value={editedProfile.alternateEmail}
                        onChange={(e) => setEditedProfile({ ...editedProfile, alternateEmail: e.target.value })}
                        placeholder="personal@email.com"
                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20 placeholder:text-[#666666]"
                      />
                    ) : (
                      <span className="text-white font-medium">{profile.alternateEmail || "Not set"}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university" className="text-[#9A9A9A] font-medium">University</Label>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#FFFFFF]" />
                    {editing ? (
                      <Input
                        id="university"
                        value={editedProfile.university}
                        onChange={(e) => setEditedProfile({ ...editedProfile, university: e.target.value })}
                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20"
                      />
                    ) : (
                      <span className="text-white font-medium">{profile.university || "Not set"}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-[#9A9A9A] font-medium">Residential Address</Label>
                <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#FFFFFF] mt-2" />
                    {editing ? (
                      <Textarea
                        id="address"
                        value={editedProfile.address}
                        onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                        placeholder="Your full address..."
                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20 placeholder:text-[#666666] min-h-[100px]"
                      />
                    ) : (
                      <span className="text-white font-medium mt-1.5">{profile.address || "Not set"}</span>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional">
          <Card className="bg-[#161616] border-[#1C1C1C]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Briefcase className="w-5 h-5 text-[#FFFFFF]" />
                Professional Information
              </CardTitle>
              <CardDescription className="text-[#9A9A9A]">Your work-related details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-medium">Department</Label>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#FFFFFF]" />
                    {editing ? (
                      <Input
                        value={editedProfile.department}
                        onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20"
                      />
                    ) : (
                      <span className="text-white font-medium">{profile.department}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-medium">Subject</Label>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#FFFFFF]" />
                    {editing ? (
                      <Input
                        value={editedProfile.subject}
                        onChange={(e) => setEditedProfile({ ...editedProfile, subject: e.target.value })}
                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20"
                      />
                    ) : (
                      <span className="text-white font-medium">{profile.subject}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-medium">Employee ID</Label>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#1F1F1F] text-[#FFFFFF] border-[#1C1C1C] font-mono">{profile.employeeId || "Not assigned"}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#9A9A9A] font-medium">Experience (years)</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FFFFFF]" />
                    {editing ? (
                      <Input
                        type="number"
                        value={editedProfile.experience}
                        onChange={(e) => setEditedProfile({ ...editedProfile, experience: e.target.value })}
                        className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20"
                      />
                    ) : (
                      <span className="text-white font-medium">{profile.experience ? `${profile.experience} years` : "Not set"}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-medium">Qualification</Label>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#FFFFFF]" />
                  {editing ? (
                    <Input
                      value={editedProfile.qualification}
                      onChange={(e) => setEditedProfile({ ...editedProfile, qualification: e.target.value })}
                      placeholder="e.g. Ph.D. in Computer Science"
                      className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20 placeholder:text-[#666666]"
                    />
                  ) : (
                    <span className="text-white font-medium">{profile.qualification || "Not set"}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-medium">Purpose on Platform</Label>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#FFFFFF]" />
                  {editing ? (
                    <Input
                      value={editedProfile.purpose}
                      onChange={(e) => setEditedProfile({ ...editedProfile, purpose: e.target.value })}
                      placeholder="e.g. Teaching, Mentoring"
                      className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20 placeholder:text-[#666666]"
                    />
                  ) : (
                    <span className="text-white font-medium">{profile.purpose || "Not set"}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-medium">Areas of Interest</Label>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#FFFFFF]" />
                  {editing ? (
                    <Textarea
                      value={editedProfile.interests}
                      onChange={(e) => setEditedProfile({ ...editedProfile, interests: e.target.value })}
                      placeholder="e.g. AI, Space Research, Sports"
                      className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20 placeholder:text-[#666666]"
                    />
                  ) : (
                    <span className="text-white font-medium">{profile.interests || "Not set"}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#9A9A9A] font-medium">Referral Source</Label>
                <div className="flex items-center gap-2">
                  <MessageCircleQuestion className="w-4 h-4 text-[#FFFFFF]" />
                  {editing ? (
                    <Input
                      value={editedProfile.referralSource}
                      onChange={(e) => setEditedProfile({ ...editedProfile, referralSource: e.target.value })}
                      placeholder="Where did you hear about us?"
                      className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20 placeholder:text-[#666666]"
                    />
                  ) : (
                    <span className="text-white font-medium">{profile.referralSource || "Not set"}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 space-y-6">
              {profile.averageRating < 3.5 && profile.teacherRatings.length > 0 && (
                <Alert className="bg-red-500/10 border-red-500/20 text-red-500">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertTitle className="font-bold">Rating Warning</AlertTitle>
                  <AlertDescription>
                    Your average student rating has dropped below 3.5. We recommend reviewing student feedback and modifying your teaching approach if necessary.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-[#161616] border-[#1C1C1C]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Star className="w-5 h-5 text-[#FFFFFF] fill-[#FFFFFF]" />
                    Student Ratings
                  </CardTitle>
                  <CardDescription className="text-[#9A9A9A]">Feedback submitted by your students</CardDescription>
                </CardHeader>
                <CardContent>
                  {profile.teacherRatings.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircleQuestion className="w-12 h-12 mx-auto text-[#9A9A9A] mb-4" />
                      <h3 className="text-lg font-bold text-white">No ratings yet</h3>
                      <p className="text-[#9A9A9A]">Students haven't submitted any feedback for you.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {profile.teacherRatings.map((rating) => (
                        <div key={rating.id} className="border-b border-[#1C1C1C] last:border-0 pb-6 last:pb-0">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border border-[#1C1C1C]">
                                <AvatarImage src={rating.student.user.image} />
                                <AvatarFallback className="bg-[#1F1F1F] text-white font-bold">{getInitials(rating.student.user.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-white mb-0.5">{rating.student.user.name}</p>
                                <p className="text-xs text-[#9A9A9A]">
                                  {new Date(rating.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= rating.rating ? "text-[#FFFFFF] fill-[#FFFFFF]" : "text-[#1C1C1C] fill-[#1C1C1C]"}`}
                                />
                              ))}
                            </div>
                          </div>
                          {rating.review && (
                            <div className="mt-3 text-sm text-[#B5B5B5] bg-[#1F1F1F] p-4 rounded-xl border border-[#1C1C1C] italic leading-relaxed">
                              "{rating.review}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="bg-[#161616] border-[#1C1C1C] sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-white">
                    <Flag className="w-4 h-4 text-[#FFFFFF]" />
                    Dispute a Rating
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-[#9A9A9A]">
                  <p>
                    We maintain strict moderation over student feedback. However, if you believe a rating is maliciously false, violates policy, or contains inappropriate text, you can raise an issue.
                  </p>
                  <p>
                    Our administrative team will review the Help Ticket and take appropriate action.
                  </p>
                  <Button 
                    className="w-full mt-2 border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white transition-all" 
                    variant="outline" 
                    onClick={() => setIsHelpOpen(true)}
                  >
                    Raise Issue
                  </Button>
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-md bg-[#161616] border-[#1C1C1C]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Dispute Rating</DialogTitle>
            <DialogDescription className="text-[#9A9A9A]">
              Submit a formal request to investigate inappropriate student feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[#9A9A9A] font-medium">Subject</Label>
              <Input
                value={helpSubject}
                onChange={(e) => setHelpSubject(e.target.value)}
                placeholder="e.g. Unfair rating from a student"
                className="bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20 placeholder:text-[#666666]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#9A9A9A] font-medium">Details & Explanation</Label>
              <Textarea
                className="min-h-[120px] bg-[#1F1F1F] border-[#1C1C1C] text-white focus:ring-white/20 placeholder:text-[#666666]"
                value={helpDescription}
                onChange={(e) => setHelpDescription(e.target.value)}
                placeholder="Explain which rating you are disputing and why it violates policy..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsHelpOpen(false)} className="border-[#1C1C1C] text-[#9A9A9A] hover:bg-white/5 hover:text-white">Cancel</Button>
            <Button 
              onClick={submitHelpTicket} 
              disabled={!helpSubject || !helpDescription || submittingHelp}
              className="bg-[#FFFFFF] hover:bg-[#00c988] text-black font-bold"
            >
              {submittingHelp ? "Submitting..." : "Submit Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
