"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, UserCheck, ShieldAlert, FileText, Ban, AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const sections = [
    {
        icon: BookOpen,
        title: "1. Acceptance of Terms",
        content: (
            <div className="space-y-4">
                <p>By accessing or using EduConnect, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
                <p>These terms apply to all students, teachers, administrators, and others who access or use our platform.</p>
            </div>
        )
    },
    {
        icon: UserCheck,
        title: "2. User Accounts",
        content: (
            <div className="space-y-4">
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li>You are responsible for safeguarding the password that you use to access the service.</li>
                    <li>You agree not to disclose your password to any third party.</li>
                    <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
                    <li>You may not use as a username the name of another person or entity that is not lawfully available for use.</li>
                </ul>
            </div>
        )
    },
    {
        icon: ShieldAlert,
        title: "3. Acceptable Use Policy",
        content: (
            <div className="space-y-4">
                <p>You agree not to use the platform in a way that:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li>Violates any national or international law or regulation.</li>
                    <li>Promotes discrimination, harassment, abuse, or violence.</li>
                    <li>Involves transmitting spam or unsolicited promotional material.</li>
                    <li>Attempts to interfere with the proper working of the service (e.g., hacking, introducing viruses).</li>
                </ul>
            </div>
        )
    },
    {
        icon: FileText,
        title: "4. Intellectual Property",
        content: (
            <div className="space-y-4">
                <p>The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of EduConnect and its licensors.</p>
                <p>Users retain ownership of any content they submit, post, or display on or through the platform, subject to a license granted to us to use, reproduce, and display such content solely to operate the platform.</p>
            </div>
        )
    },
    {
        icon: Ban,
        title: "5. Termination",
        content: (
            <div className="space-y-4">
                <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                <p>Upon termination, your right to use the platform will immediately cease. If you wish to terminate your account, you may simply discontinue using the service or contact support.</p>
            </div>
        )
    },
    {
        icon: AlertCircle,
        title: "6. Limitation of Liability",
        content: (
            <div className="space-y-4">
                <p>In no event shall EduConnect, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
            </div>
        )
    }
]

export default function TermsOfServicePage() {
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
                        <FileText className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Terms of Service
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Please read these terms carefully before accessing or participating in the learning community on EduConnect.
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
