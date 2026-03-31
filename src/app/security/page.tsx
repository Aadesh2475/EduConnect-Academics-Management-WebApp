"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, ShieldCheck, Lock, Key, Server, EyeOff } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const sections = [
    {
        icon: Lock,
        title: "1. Data Encryption",
        content: (
            <div className="space-y-4">
                <p>We use industry-standard encryption protocols to protect your personal and academic data.</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li><strong>Data in Transit:</strong> All communication between your device and our servers is secured using HTTPS/TLS encryption.</li>
                    <li><strong>Data at Rest:</strong> Sensitive data stored in our databases is encrypted to prevent unauthorized access in the event of a breach.</li>
                </ul>
            </div>
        )
    },
    {
        icon: Key,
        title: "2. Authentication & Authorization",
        content: (
            <div className="space-y-4">
                <p>Robust access control is vital for maintaining an academic platform.</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li><strong>Secure Logins:</strong> We support both secure password-based authentication and OAuth via trusted providers (Google, GitHub). Passwords are never stored in plain text; they are salted and hashed.</li>
                    <li><strong>Role-Based Access Control (RBAC):</strong> EduConnect strictly segregates permissions for Students, Teachers, and Administrators. A student cannot access another student's exams or grades.</li>
                </ul>
            </div>
        )
    },
    {
        icon: Server,
        title: "3. Infrastructure Security",
        content: (
            <div className="space-y-4">
                <p>Our platform relies on trusted cloud infrastructure to maintain high availability and security.</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li><strong>Continuous Monitoring:</strong> Servers are monitored 24/7 for unusual activity and potential attacks.</li>
                    <li><strong>Database Isolation:</strong> We use reliable, modern database hosting (Neon DB) that logically isolates data and provides point-in-time recovery.</li>
                </ul>
            </div>
        )
    },
    {
        icon: EyeOff,
        title: "4. Vulnerability Disclosure",
        content: (
            <div className="space-y-4">
                <p>We believe that working with skilled security researchers can help keep our platform safe.</p>
                <p>If you believe you've found a security vulnerability in EduConnect, please report it to us immediately at <strong>security@educonnect.app</strong>. We ask that you do not publicly disclose the issue until it has been addressed.</p>
            </div>
        )
    }
]

export default function SecurityPage() {
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
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Security at EduConnect
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        We employ rigorous security measures to protect your academic records and personal data.
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
