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
    category: "Classes",
    questions: [
      {
        q: "How do I create a new class?",
        a: "Go to Classes > Manage Classes and click 'Create Class'. Fill in the class name, department, semester, and other details. A unique class code will be generated automatically for students to join."
      },
      {
        q: "How do students join my class?",
        a: "Share your class code with students. They can enter the code in their 'Join Class' section. You'll receive an enrollment request which you can approve or reject in the Registrations page."
      },
      {
        q: "Can I archive a class?",
        a: "Yes, go to Classes > Manage Classes, find the class you want to archive, and click the archive icon. Archived classes can be restored later from the Archived tab."
      }
    ]
  },
  {
    category: "Assignments",
    questions: [
      {
        q: "How do I create an assignment?",
        a: "Go to Assignments and click 'Create Assignment'. Fill in the title, instructions, due date, and total marks. You can also attach files and set submission preferences."
      },
      {
        q: "How do I grade submissions?",
        a: "Go to Assignments, select the assignment, and click 'View Submissions'. You can view each submission, provide feedback, and assign marks. Students will be notified when graded."
      },
      {
        q: "Can I extend a deadline?",
        a: "Yes, edit the assignment and modify the due date. You can also enable late submissions with or without penalty in the assignment settings."
      }
    ]
  },
  {
    category: "Exams",
    questions: [
      {
        q: "How do I create an online exam?",
        a: "Go to Examinations and click 'Create Exam'. Set the title, duration, and dates. Then add questions - you can use multiple choice, true/false, or essay questions. Publish when ready."
      },
      {
        q: "Can I set time limits for exams?",
        a: "Yes, specify the duration when creating the exam. Students will have a countdown timer and their exam will auto-submit when time runs out."
      },
      {
        q: "How do I view exam results?",
        a: "Go to Examinations and select the completed exam. You'll see overall statistics and can view individual student attempts and scores."
      }
    ]
  },
  {
    category: "Attendance",
    questions: [
      {
        q: "How do I mark attendance?",
        a: "Go to Attendance and click 'Mark Attendance'. Select a class and mark each student as Present, Absent, Late, or Excused. Don't forget to save when done."
      },
      {
        q: "Can I edit past attendance records?",
        a: "Yes, find the attendance session in the history and click to edit. Make your changes and save the updated record."
      },
      {
        q: "How do I export attendance reports?",
        a: "Go to Attendance and click 'Export Report'. You can filter by class and date range, then download as CSV or PDF."
      }
    ]
  }
]

const resources = [
  { title: "Teacher's Handbook", icon: Book, type: "Documentation", link: "#" },
  { title: "Video Tutorials", icon: Video, type: "Video", link: "#" },
  { title: "Feature Guides", icon: FileText, type: "PDF", link: "#" },
  { title: "What's New", icon: ExternalLink, type: "Blog", link: "#" },
]

export default function TeacherHelpPage() {
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
      description: "Our team will respond within 24-48 hours.",
    })
    setSupportForm({ subject: "", message: "" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-1">Find answers or get assistance</p>
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
                <HelpCircle className="w-5 h-5 text-purple-600" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick answers for common questions
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

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Need more help? Send us a message.
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
          {/* Resources */}
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
                  <div className="p-2 rounded-lg bg-purple-100">
                    <resource.icon className="w-4 h-4 text-purple-600" />
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
                  <p className="text-sm text-gray-500">faculty-support@educonnect.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Phone className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone Support</p>
                  <p className="text-sm text-gray-500">+1 (555) 123-4567 ext. 2</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Support Hours</p>
                  <p className="text-sm text-gray-500">Mon-Fri, 8AM-8PM EST</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge variant="secondary" className="mb-3">Priority Support</Badge>
                <p className="text-3xl font-bold text-purple-600">24 hours</p>
                <p className="text-sm text-gray-600 mt-2">
                  Faculty members receive priority support
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
