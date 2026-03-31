"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  HelpCircle,
  Search,
  MessageSquare,
  Mail,
  Phone,
  Book,
  Video,
  FileText,
  ExternalLink,
  Send,
  Clock
} from "lucide-react"

const faqs = [
  {
    category: "Account",
    questions: [
      {
        q: "How do I reset my password?",
        a: "Go to Settings > Security > Change Password. Enter your current password and then your new password twice to confirm the change."
      },
      {
        q: "How do I update my profile information?",
        a: "Navigate to Profile from the sidebar and click 'Edit Profile'. You can update your personal information, profile picture, and contact details."
      },
      {
        q: "Can I change my email address?",
        a: "Yes, go to Settings > Account and update your email. You'll need to verify the new email address before the change takes effect."
      }
    ]
  },
  {
    category: "Classes",
    questions: [
      {
        q: "How do I join a new class?",
        a: "Go to Classes > Join Class and enter the class code provided by your teacher. Once submitted, your request will be sent to the teacher for approval."
      },
      {
        q: "What happens if my class join request is rejected?",
        a: "If your request is rejected, you'll receive a notification. Contact your teacher directly to understand the reason and potentially resubmit your request."
      },
      {
        q: "How do I view class materials?",
        a: "Click on any enrolled class to view its details. All materials, including documents, videos, and links, are available in the Materials section of each class."
      }
    ]
  },
  {
    category: "Assignments",
    questions: [
      {
        q: "How do I submit an assignment?",
        a: "Go to Assignments, find the assignment you want to submit, click 'View Details', and then 'Submit'. You can upload files or write your response directly."
      },
      {
        q: "Can I resubmit an assignment?",
        a: "It depends on your teacher's settings. Some assignments allow multiple submissions until the deadline. Check the assignment details for resubmission policies."
      },
      {
        q: "What happens if I miss an assignment deadline?",
        a: "Late submissions may be accepted with penalties depending on the teacher's policy. Contact your teacher if you have extenuating circumstances."
      }
    ]
  },
  {
    category: "Exams",
    questions: [
      {
        q: "How do I take an online exam?",
        a: "Go to Quiz/Exams when your exam is available. Click 'Start Exam' to begin. Make sure you have a stable internet connection and complete within the time limit."
      },
      {
        q: "What if I lose internet during an exam?",
        a: "Your progress is saved automatically. Reconnect and continue from where you left off. Contact your teacher if you experience significant technical issues."
      },
      {
        q: "When will I receive my exam results?",
        a: "Results for auto-graded exams (MCQ, True/False) are available immediately. Written responses are graded by teachers and typically available within a few days."
      }
    ]
  }
]

const resources = [
  { title: "Getting Started Guide", icon: Book, type: "Documentation", link: "#" },
  { title: "Video Tutorials", icon: Video, type: "Video", link: "#" },
  { title: "Student Handbook", icon: FileText, type: "PDF", link: "#" },
  { title: "Platform Updates", icon: ExternalLink, type: "Blog", link: "#" },
]

export default function StudentHelpPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
  })

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supportForm.subject || !supportForm.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Support request submitted",
      description: "We'll get back to you within 24-48 hours.",
    })
    setSupportForm({ subject: "", message: "" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-1">Find answers to common questions or contact support</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Find quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length > 0 ? (
                <div className="space-y-6">
                  {filteredFaqs.map((category) => (
                    <div key={category.category}>
                      <h3 className="font-semibold text-gray-900 mb-3">{category.category}</h3>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((faq, index) => (
                          <AccordionItem key={index} value={`${category.category}-${index}`}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600">
                              {faq.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No results found for "{searchQuery}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Support Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Can't find what you're looking for? Send us a message.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitSupport} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    value={supportForm.message}
                    onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                  />
                </div>
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.link}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-100">
                    <resource.icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{resource.title}</p>
                    <p className="text-xs text-gray-500">{resource.type}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Mail className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Support</p>
                  <p className="text-sm text-gray-500">support@educonnect.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Phone className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone Support</p>
                  <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Support Hours</p>
                  <p className="text-sm text-gray-500">Mon-Fri, 9AM-6PM EST</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge variant="secondary" className="mb-3">Typical Response Time</Badge>
                <p className="text-3xl font-bold text-blue-600">24-48 hours</p>
                <p className="text-sm text-gray-600 mt-2">
                  For urgent issues, please call our support hotline
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
