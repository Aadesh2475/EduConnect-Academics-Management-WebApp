"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, LifeBuoy, Search, Mail, MessageCircle, FileQuestion } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function HelpCenterPage() {
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
            <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center bg-indigo-50/50 dark:bg-indigo-900/10">
                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 mb-6">
                        <LifeBuoy className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Help Center
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                        Advice and answers from the EduConnect Team
                    </p>

                    <div className="max-w-xl mx-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            type="text"
                            placeholder="Search for articles..."
                            className="pl-12 h-14 text-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all"
                        />
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-16">

                    <div className="grid md:grid-cols-2 gap-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center"
                        >
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-6">
                                <FileQuestion className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">FAQs</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                Find quick answers to common questions about accounts, billing, and using the platform.
                            </p>
                            <Link href="/#faq">
                                <Button className="rounded-xl px-8" variant="outline">Browse FAQs</Button>
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center"
                        >
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400 mb-6">
                                <MessageCircle className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Support</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                Need more help? Get in touch with our dedicated support team. We're here for you.
                            </p>
                            <a href="mailto:support@educonnect.app">
                                <Button className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 text-white">Email Us</Button>
                            </a>
                        </motion.div>
                    </div>

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
