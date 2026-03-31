"use client"
import { useState, memo } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import {
  GraduationCap, Users, BookOpen, BarChart3, Brain, Calendar,
  MessageSquare, ChevronRight, Star, CheckCircle2,
  ArrowRight, Sparkles, Award, Clock, Bell,
  FileText, PieChart, Zap, Globe, TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { type BentoItem } from "@/components/ui/bento-grid"
import { Card } from "@/components/ui/card"

// Dynamic imports for heavy components
const HeroSection = dynamic(() => import("@/components/ui/3d-hero-section-boxes").then(mod => mod.HeroSection), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-black" />
})
const BentoGrid = dynamic(() => import("@/components/ui/bento-grid").then(mod => mod.BentoGrid), { ssr: false })
const Timeline = dynamic(() => import("@/components/ui/timeline").then(mod => mod.Timeline), { ssr: false })
const AnimatedGradient = dynamic(() => import("@/components/ui/animated-gradient-with-svg").then(mod => mod.AnimatedGradient), { ssr: false })
const SplineScene = dynamic(() => import("@/components/ui/splite").then(mod => mod.SplineScene), { ssr: false })
const Spotlight = dynamic(() => import("@/components/ui/spotlight").then(mod => mod.Spotlight), { ssr: false })
const RealTimeAnalytics = dynamic(() => import("@/components/ui/real-time-analytics").then(mod => mod.RealTimeAnalytics), { ssr: false })
const NeoMinimalFooter = dynamic(() => import("@/components/ui/neo-minimal-footer").then(mod => mod.NeoMinimalFooter), { ssr: false })

const MemoizedHeroSection = memo(HeroSection)
MemoizedHeroSection.displayName = "MemoizedHeroSection"

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
}

const features: BentoItem[] = [
  {
    icon: <BookOpen className="w-4 h-4 text-blue-500" />,
    title: "Smart Classrooms",
    description: "Create and manage virtual classrooms with unique join codes. Seamless student enrollment with request-based approval.",
    status: "Live",
    tags: ["Classes", "Enrollment"],
    colSpan: 2,
    hasPersistentHover: true,
  },
  {
    icon: <FileText className="w-4 h-4 text-emerald-500" />,
    title: "Assignment Management",
    description: "Create assignments with rubric-based grading, track submissions, and provide detailed feedback to students.",
    status: "Active",
    tags: ["Grading", "Rubrics"],
  },
  {
    icon: <BarChart3 className="w-4 h-4 text-violet-500" />,
    title: "Performance Analytics",
    description: "Comprehensive dashboards with charts, graphs, and trends to track academic progress in real-time.",
    status: "Live",
    tags: ["Charts", "Reports"],
  },
  {
    icon: <Brain className="w-4 h-4 text-amber-500" />,
    title: "AI-Powered Insights",
    description: "Smart chatbot analyzes performance data and provides personalized suggestions for academic improvement.",
    status: "Beta",
    tags: ["AI", "Suggestions"],
    colSpan: 2,
  },
  {
    icon: <Calendar className="w-4 h-4 text-rose-500" />,
    title: "Attendance & Calendar",
    description: "Mark attendance, schedule events, manage academic calendar with automated tracking and reminders.",
    status: "Active",
    tags: ["Attendance", "Events"],
  },
  {
    icon: <MessageSquare className="w-4 h-4 text-indigo-500" />,
    title: "Real-time Messaging",
    description: "Instant messaging between students and teachers. Class group chats and direct messaging support.",
    status: "Active",
    tags: ["Chat", "Groups"],
  },
]

const faqs = [
  {
    question: "How do students join a class?",
    answer: "Teachers generate a unique 7-character class code. Students enter this code on their dashboard to send a join request, which the teacher can approve or reject."
  },
  {
    question: "What authentication methods are supported?",
    answer: "We support Google OAuth, GitHub OAuth, and traditional email/password authentication. All methods include email verification and password reset functionality."
  },
  {
    question: "How does the AI chatbot work?",
    answer: "Our AI chatbot analyzes your academic data including grades, attendance, submission patterns, and exam scores to provide personalized study suggestions and performance insights."
  },
  {
    question: "Can teachers track student attendance?",
    answer: "Yes! Teachers can mark attendance for each class session, view attendance reports, and students can see their attendance statistics in their dashboard."
  },
  {
    question: "Is the platform free to use?",
    answer: "Yes, the core features are completely free. We offer premium plans for institutions that need advanced analytics, bulk management, and priority support."
  },
  {
    question: "How secure is my data?",
    answer: "We use industry-standard encryption, secure session management, rate limiting, and role-based access control. Your data is stored securely and never shared with third parties."
  }
]

const testimonials = [
  {
    name: "Dr. Sarah",
    role: "Professor, Computer Science",
    content: "EduConnect has transformed how I manage my classes. The analytics dashboard gives me instant insights into student performance.",
    rating: 5
  },
  {
    name: "Alex Rivera",
    role: "Engineering Student",
    content: "The AI chatbot helped me identify my weak areas and suggested study plans. My grades improved significantly in just one semester.",
    rating: 5
  },
  {
    name: "Prof. James Miller",
    role: "Department Head",
    content: "Managing multiple classes and tracking hundreds of students was chaotic before. EduConnect made it seamless and organized.",
    rating: 5
  }
]

// Memoized Sections to prevent re-render of heavy components when FAQ state changes
const MemoizedFeatures = memo(({ features }: { features: BentoItem[] }) => (
  <section id="features" className="py-20 md:py-32 bg-black border-t border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400 mb-4 border border-indigo-500/20">
          <Zap className="h-3.5 w-3.5" /> FEATURES
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Everything You Need for <span className="gradient-text">Academic Excellence</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Comprehensive tools designed for modern education management
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <BentoGrid items={features} />
      </motion.div>
    </div>
  </section>
))
MemoizedFeatures.displayName = "MemoizedFeatures"

const MemoizedAnalytics = memo(() => (
  <section id="analytics" className="py-20 md:py-32 bg-black">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400 mb-4 border border-emerald-500/20">
          <PieChart className="h-3.5 w-3.5" /> ANALYTICS
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Powerful Analytics for <span className="gradient-text">Smarter Decisions</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Track every aspect of academic performance with real-time dashboards, detailed reports, and trend analysis.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14"
      >
        <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-h-[160px]">
          <AnimatedGradient colors={["#6366f1", "#8b5cf6", "#a5b4fc"]} speed={0.05} blur="medium" />
          <div className="relative z-10 p-6 md:p-8 backdrop-blur-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Average Student Score</p>
            <p className="text-5xl md:text-6xl font-semibold text-gray-900 dark:text-white mb-2">87%</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> +5.2% from last semester
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-h-[160px]">
          <AnimatedGradient colors={["#34d399", "#6ee7b7", "#10b981"]} speed={0.04} blur="medium" />
          <div className="relative z-10 p-6 backdrop-blur-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Active Institutions</p>
            <p className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-2">500+</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Across 6 regions</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-h-[160px]">
          <AnimatedGradient colors={["#60a5fa", "#93c5fd", "#3b82f6"]} speed={0.06} blur="medium" />
          <div className="relative z-10 p-6 backdrop-blur-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Students Connected</p>
            <p className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-2">50K+</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Daily active learners</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-h-[160px]">
          <AnimatedGradient colors={["#f59e0b", "#fcd34d", "#f97316"]} speed={0.05} blur="medium" />
          <div className="relative z-10 p-6 backdrop-blur-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Avg. Attendance Rate</p>
            <p className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-2">92%</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> +2.1%
            </p>
          </div>
        </div>

        <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-h-[160px]">
          <AnimatedGradient colors={["#ec4899", "#f472b6", "#a78bfa"]} speed={0.04} blur="medium" />
          <div className="relative z-10 p-6 md:p-8 backdrop-blur-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Assignments Graded</p>
            <p className="text-5xl md:text-6xl font-semibold text-gray-900 dark:text-white mb-2">1M+</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">With rubric-based detailed feedback</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto"
      >
        {[
          "Real-time performance tracking with interactive charts",
          "Attendance analytics with pattern recognition",
          "Assignment completion rates and submission trends",
          "Exam score distribution and grade analysis",
          "Student engagement metrics and activity logs",
          "Predictive AI insights for academic improvement",
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="text-sm text-gray-300">{item}</span>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
))
MemoizedAnalytics.displayName = "MemoizedAnalytics"

const MemoizedAI = memo(() => (
  <section id="ai" className="py-20 md:py-32 bg-black text-white relative overflow-hidden">
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-violet-500 rounded-full blur-3xl" />
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-300 mb-4 border border-white/10">
          <Brain className="h-3.5 w-3.5" /> AI INTEGRATION
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Meet Your AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Academic Advisor</span>
        </h2>
        <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
          Get personalized suggestions based on your attendance, marks, submissions, and activities
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden border-white/10">
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="white"
          />

          <div className="flex h-full">
            <div className="flex-1 p-8 relative z-10 flex flex-col justify-center space-y-6">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-3">
                  EduConnect AI
                </h3>
                <p className="text-neutral-400 text-sm max-w-xs">
                  Your 24/7 academic advisor — powered by AI, driven by your data.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: TrendingUp, title: "Performance Analysis", desc: "Identifies your strengths and weak areas instantly" },
                  { icon: Sparkles, title: "Smart Suggestions", desc: "Personalized study plans tailored to your progress" },
                  { icon: Bell, title: "Proactive Alerts", desc: "Notified before performance dips become critical" },
                  { icon: BarChart3, title: "Predictive Insights", desc: "AI forecasts exam scores and prepares you ahead" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="shrink-0 p-1.5 rounded-lg bg-indigo-500/20 mt-0.5">
                      <item.icon className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-neutral-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <RealTimeAnalytics />
      </motion.div>
    </div>
  </section>
))
MemoizedAI.displayName = "MemoizedAI"

const MemoizedHowItWorks = memo(() => (
  <section id="how-it-works" className="py-20 md:py-32 bg-black border-t border-b border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-4"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-xs font-semibold text-amber-500 mb-4 border border-amber-500/20">
          <Clock className="h-3.5 w-3.5" /> HOW IT WORKS
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Get Started in <span className="gradient-text">4 Simple Steps</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          From sign-up to AI insights — EduConnect gets you productive in minutes.
        </p>
      </motion.div>
    </div>

    <Timeline
      data={[
        {
          title: "Step 01",
          content: (
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Create Your Account</h3>
              <p className="text-neutral-400 text-sm md:text-base mb-6">
                Sign up in seconds as a <strong>Student</strong>, <strong>Teacher</strong>, or <strong>Organization</strong>. Use Google OAuth, GitHub OAuth, or traditional email/password — your choice. Email verification keeps accounts secure.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Google OAuth", "GitHub OAuth", "Email & Password", "Email Verification", "Role-based Access"].map((tag) => (
                  <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{tag}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=300&fit=crop&auto=format"
                  alt="Students signing up"
                  className="rounded-xl object-cover h-36 md:h-52 w-full shadow-md"
                />
                <img
                  src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=500&h=300&fit=crop&auto=format"
                  alt="Teacher registration"
                  className="rounded-xl object-cover h-36 md:h-52 w-full shadow-md"
                />
              </div>
            </div>
          ),
        },
        {
          title: "Step 02",
          content: (
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Set Up Your Classroom</h3>
              <p className="text-neutral-400 text-sm md:text-base mb-6">
                Teachers create virtual classrooms in one click — each gets a unique <strong>7-character join code</strong>. Students enter the code to send a join request; teachers approve or decline instantly. Set student limits and manage your class roster.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Unique Join Codes", "Request-based Approval", "Student Limits", "Roster Management", "Real-time Sync"].map((tag) => (
                  <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{tag}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&h=300&fit=crop&auto=format"
                  alt="Classroom setup"
                  className="rounded-xl object-cover h-36 md:h-52 w-full shadow-md"
                />
                <img
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&h=300&fit=crop&auto=format"
                  alt="Students joining class"
                  className="rounded-xl object-cover h-36 md:h-52 w-full shadow-md"
                />
              </div>
            </div>
          ),
        },
        {
          title: "Step 03",
          content: (
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Manage Academics Effortlessly</h3>
              <p className="text-neutral-400 text-sm md:text-base mb-6">
                Everything in one dashboard — create <strong>assignments</strong> with rubric-based grading, schedule <strong>exams</strong>, mark <strong>attendance</strong>, and track submissions in real-time. Students always know where they stand.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Assignments & Rubrics", "Exam Scheduling", "Attendance Tracking", "Submission Management", "Grade Analytics"].map((tag) => (
                  <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{tag}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&h=300&fit=crop&auto=format"
                  alt="Managing assignments"
                  className="rounded-xl object-cover h-36 md:h-52 w-full shadow-md"
                />
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop&auto=format"
                  alt="Analytics dashboard"
                  className="rounded-xl object-cover h-36 md:h-52 w-full shadow-md"
                />
              </div>
            </div>
          ),
        },
        {
          title: "Step 04",
          content: (
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Get AI-Powered Insights</h3>
              <p className="text-neutral-400 text-sm md:text-base mb-6">
                Our <strong>AI Academic Advisor</strong> analyzes your grades, attendance patterns, submission history, and exam scores. It identifies weak areas, predicts trends, and delivers <strong>personalized improvement suggestions</strong> — like having a personal tutor 24/7.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Performance Analysis", "Smart Suggestions", "Predictive Insights", "Proactive Alerts", "Study Plans"].map((tag) => (
                  <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{tag}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=500&h=300&fit=crop&auto=format"
                  alt="AI insights"
                  className="rounded-xl object-cover h-36 md:h-52 w-full shadow-md"
                />
                <img
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=300&fit=crop&auto=format"
                  alt="Student getting insights"
                  className="rounded-xl object-cover h-36 md:h-52 w-full shadow-md"
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  </section>
))
MemoizedHowItWorks.displayName = "MemoizedHowItWorks"

const MemoizedTestimonials = memo(({ testimonials }: { testimonials: any[] }) => (
  <section className="py-20 bg-black">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Loved by <span className="gradient-text">Educators & Students</span>
        </h2>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <div className="flex gap-1 mb-4">
              {[...Array(t.rating)].map((_, j) => (
                <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">&ldquo;{t.content}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-semibold text-sm">
                {t.name[0]}{t.name.split(" ")[1]?.[0]}
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                <div className="text-xs text-gray-500">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
))
MemoizedTestimonials.displayName = "MemoizedTestimonials"

const MemoizedFAQ = memo(({ openFaq, setOpenFaq, faqs }: { openFaq: number | null, setOpenFaq: (i: number | null) => void, faqs: { question: string, answer: string }[] }) => (
  <section id="faq" className="py-20 md:py-32 bg-black">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Frequently Asked <span className="gradient-text">Questions</span>
        </h2>
        <p className="text-gray-400">Everything you need to know about EduConnect</p>
      </motion.div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a]"
          >
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-white/5 transition-colors"
            >
              <span className="font-medium text-white">{faq.question}</span>
              <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${openFaq === i ? "rotate-90" : ""}`} />
            </button>
            <AnimatePresence>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-sm text-gray-400 leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
))
MemoizedFAQ.displayName = "MemoizedFAQ"

const MemoizedCTA = memo(() => (
  <section className="py-20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative bg-gray-700 rounded-3xl p-8 md:p-12 text-center text-white overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Education?
          </h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-xl mx-auto">
            Join thousands of students and educators already using EduConnect
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white shadow-xl text-base px-8 h-12 transition-all duration-300">
                Get Started Free <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 text-base px-8 h-12 transition-all duration-300">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
))
MemoizedCTA.displayName = "MemoizedCTA"

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { toast } = useToast()

  return (
    <div className="min-h-screen bg-black">
      {/* ========== 3D HERO ========== */}
      <MemoizedHeroSection />

      {/* ========== FEATURES ========== */}
      <MemoizedFeatures features={features} />

      {/* ========== ANALYTICS SECTION ========== */}
      <MemoizedAnalytics />

      {/* ========== AI SECTION ========== */}
      <MemoizedAI />

      {/* ========== HOW IT WORKS ========== */}
      <MemoizedHowItWorks />

      {/* ========== TESTIMONIALS ========== */}
      <MemoizedTestimonials testimonials={testimonials} />

      {/* ========== FAQ ========== */}
      <MemoizedFAQ openFaq={openFaq} setOpenFaq={setOpenFaq} faqs={faqs} />

      {/* ========== CTA ========== */}
      <MemoizedCTA />

      {/* ========== FOOTER ========== */}
      <NeoMinimalFooter />
    </div>
  )
}
