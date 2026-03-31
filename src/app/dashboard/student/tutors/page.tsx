"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, MessageSquare, Star, BookOpen, MoreVertical, Flag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials, cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RaiseIssueDialog } from "@/components/student/RaiseIssueDialog"

interface Tutor {
  id: string
  userId: string
  name: string
  email: string
  image?: string
  department: string
  subject: string
  rating: number
  ratingCount: number
  classesCount: number
  myRating?: number
  myReview?: string
}

export default function TutorsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)

  // Rating States
  const [isRatingOpen, setIsRatingOpen] = useState(false)
  const [ratingVal, setRatingVal] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [submittingRating, setSubmittingRating] = useState(false)

  // Report States
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDetails, setReportDetails] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)

  const fetchTutors = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/student/tutors")
      const data = await res.json()
      if (data.success) setTutors(data.data)
    } catch (error) {
      console.error("Failed to load tutors")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTutors()
  }, [])

  const handleMessage = async (teacherUserId: string) => {
    try {
      const res = await fetch("/api/student/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_direct", recipientId: teacherUserId })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Opening chat..." })
        router.push("/dashboard/student/messages")
      } else {
        toast({ title: "Failed to open messages", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error starting message", variant: "destructive" })
    }
  }

  const submitRating = async () => {
    if (!selectedTutor || ratingVal === 0) return
    setSubmittingRating(true)
    try {
      const res = await fetch("/api/student/tutors/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: selectedTutor.id, rating: ratingVal, review: reviewText })
      })
      if (res.ok) {
        toast({ title: "Rating submitted successfully!" })
        setIsRatingOpen(false)
        fetchTutors() // refresh average
      } else {
        toast({ title: "Failed to submit rating", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error submitting rating", variant: "destructive" })
    } finally {
      setSubmittingRating(false)
    }
  }

  const filteredTutors = tutors.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tutors</h1>
        <p className="text-gray-600">Connect with your teachers and tutors</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search tutors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : filteredTutors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tutors found</h3>
            <p className="text-gray-500">Join classes to connect with tutors</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor, index) => (
            <motion.div key={tutor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="hover:shadow-lg transition-shadow relative">
                <CardContent className="p-6">
                  {/* Dropdown Menu */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { 
                          setSelectedTutor(tutor); 
                          setRatingVal(tutor.myRating || 0); 
                          setHoverRating(0); 
                          setReviewText(tutor.myReview || ""); 
                          setIsRatingOpen(true); 
                        }}>
                          <Star className="w-4 h-4 mr-2" /> 
                          {tutor.myRating && tutor.myRating > 0 ? "Update Rating" : "Rate Tutor"}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <RaiseIssueDialog
                            defaultCategory="TUTOR"
                            teacherId={tutor.id}
                            defaultTitle={`Issue with Tutor: ${tutor.name}`}
                            trigger={
                              <div className="flex w-full items-center px-2 py-1.5 text-sm text-red-600 cursor-pointer hover:bg-red-50 rounded-sm">
                                <Flag className="w-4 h-4 mr-2" /> Report Issue
                              </div>
                            }
                          />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="text-center mt-2">
                    <div className="relative inline-block">
                      <Avatar className="w-20 h-20 mx-auto mb-4">
                        <AvatarImage src={tutor.image} />
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-xl">
                          {getInitials(tutor.name)}
                        </AvatarFallback>
                      </Avatar>
                      {tutor.myRating && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white border-[#1C1C1C]">
                          Rated
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{tutor.name}</h3>
                    <p className="text-sm text-gray-500">{tutor.department}</p>
                    <Badge variant="outline" className="mt-2">{tutor.subject}</Badge>
                    <div className="flex items-center justify-center gap-1 mt-3">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{tutor.rating}</span>
                      <span className="text-gray-400">• {tutor.ratingCount} rating{tutor.ratingCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant={tutor.myRating ? "secondary" : "outline"} 
                      className="flex-1" 
                      size="sm" 
                      onClick={() => { 
                        setSelectedTutor(tutor); 
                        setRatingVal(tutor.myRating || 0); 
                        setHoverRating(0); 
                        setReviewText(tutor.myReview || ""); 
                        setIsRatingOpen(true); 
                      }}
                    >
                      <Star className={cn("w-4 h-4 mr-1", tutor.myRating && "fill-yellow-500 text-yellow-500")} /> 
                      {tutor.myRating ? "Update" : "Rate"}
                    </Button>
                    <Button className="flex-1" size="sm" onClick={() => handleMessage(tutor.userId)}>
                      <MessageSquare className="w-4 h-4 mr-1" /> Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rate Tutor Dialog */}
      <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedTutor?.myRating && selectedTutor.myRating > 0 ? "Update Your Rating" : `Rate ${selectedTutor?.name}`}
            </DialogTitle>
            <DialogDescription>
              {selectedTutor?.myRating && selectedTutor.myRating > 0 
                ? "You have already rated this tutor. You can update your feedback below."
                : "Submit your feedback below. This helps us maintain quality."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer transition-colors ${star <= (hoverRating || ratingVal) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRatingVal(star)}
                />
              ))}
            </div>
            <div className="space-y-2">
              <Label>Review (Optional)</Label>
              <Textarea
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRatingOpen(false)}>Cancel</Button>
            <Button onClick={submitRating} disabled={ratingVal === 0 || submittingRating}>
              {submittingRating ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
