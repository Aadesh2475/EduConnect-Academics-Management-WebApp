"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, UserCheck, MessageSquare, Brain } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const sections = [
    {
        icon: Eye,
        title: "1. Information We Collect",
        content: (
            <div className="space-y-4">
                <p>When you use EduConnect, we collect the following types of information to provide and improve our services:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li><strong>Account Information:</strong> Name, email address, role (Student, Teacher, or Admin), and profile picture. If you sign in via Google or GitHub, we receive basic profile information from these providers.</li>
                    <li><strong>Academic Data:</strong> Enrollment details, course progression, assignment submissions, grades, exam results, and attendance records.</li>
                    <li><strong>Communication Data:</strong> Messages sent within our platform, announcements, and feedback on assignments.</li>
                    <li><strong>Usage Data:</strong> Information about how you interact with our platform, such as feature usage, time spent on pages, and device/browser details.</li>
                </ul>
            </div>
        )
    },
    {
        icon: Database,
        title: "2. How We Use Your Information",
        content: (
            <div className="space-y-4">
                <p>We use the information we collect for the following purposes:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li><strong>Service Delivery:</strong> To create and manage accounts, facilitate virtual classrooms, process assignments, and track attendance.</li>
                    <li><strong>Performance Analytics:</strong> To provide teachers and institutions with insights into student performance and class trends.</li>
                    <li><strong>Communication:</strong> To send important notifications, class announcements, and system updates.</li>
                    <li><strong>Security:</strong> To verify your identity, prevent fraud, and secure the platform against unauthorized access.</li>
                </ul>
            </div>
        )
    },
    {
        icon: Brain,
        title: "3. Artificial Intelligence and Analytics",
        content: (
            <div className="space-y-4">
                <p>EduConnect integrates AI-powered features to enhance the learning experience:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li><strong>AI Academic Advisor:</strong> Our system analyzes your grades, attendance, and submission patterns to provide customized study recommendations. This analysis is performed securely within our infrastructure.</li>
                    <li><strong>Automated Insights:</strong> We process aggregated and anonymized academic data to generate performance trends. This data is never used to arbitrarily penalize students, but rather to highlight areas for improvement.</li>
                    <li><strong>Data Privacy in AI:</strong> Your personal academic data is not sold to third-party AI companies or used to train public machine learning models.</li>
                </ul>
            </div>
        )
    },
    {
        icon: Globe,
        title: "4. Information Sharing and Disclosure",
        content: (
            <div className="space-y-4">
                <p>We do not sell your personal information. We only share information under the following circumstances:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li><strong>Within the Platform:</strong> Student academic data, attendance, and assignment submissions are visible to the teachers and administrators managing the respective classes.</li>
                    <li><strong>Service Providers:</strong> We may share data with trusted third-party services (e.g., cloud hosting, database providers like Neon DB, and authentication services like Better Auth) strictly for operational purposes.</li>
                    <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or governmental request.</li>
                </ul>
            </div>
        )
    },
    {
        icon: Lock,
        title: "5. Data Security Strategy",
        content: (
            <div className="space-y-4">
                <p>Your data security is paramount. We employ multiple safeguards to protect your personal information:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li>Industry-standard encryption for data at rest and in transit.</li>
                    <li>Secure session management and robust password hashing algorithms.</li>
                    <li>Strict Role-Based Access Control (RBAC) preventing students from viewing other students' sensitive academic data.</li>
                </ul>
            </div>
        )
    },
    {
        icon: UserCheck,
        title: "6. Your Rights and Choices",
        content: (
            <div className="space-y-4">
                <p>Depending on your location, you have rights regarding your personal data:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li>The right to access, update, or delete your personal information.</li>
                    <li>The right to export your academic data.</li>
                    <li>The right to opt-out of optional analytical tracking.</li>
                    <li>To exercise these rights, please contact your institution's administrator or email our support team.</li>
                </ul>
            </div>
        )
    },
    {
        icon: MessageSquare,
        title: "7. Contact Us",
        content: (
            <div className="space-y-4">
                <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at:</p>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="font-medium text-gray-900 dark:text-gray-100">EduConnect Privacy Team</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Email: privacy@educonnect.app</p>
                    <p className="text-gray-600 dark:text-gray-400">Address: 123 Education Lane, Tech District</p>
                </div>
            </div>
        )
    }
]

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back to Home
                        </Link>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-100 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
                </div>

                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-6">
                        <Shield className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Privacy Policy
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Your privacy is critically important to us. This policy details how EduConnect handles your data, ensuring a secure and transparent academic environment.
                    </p>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                        Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto space-y-12">
                    {sections.map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5 }}
                            className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <section.icon className="h-6 w-6" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    {section.title}
                                </h2>
                            </div>
                            <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                                {section.content}
                            </div>
                        </motion.div>
                    ))}

                    {/* Footer inside layout */}
                    <div className="pt-12 mt-12 border-t border-gray-200 dark:border-gray-800 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            &copy; {new Date().getFullYear()} EduConnect. All rights reserved.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
