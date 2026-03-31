"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Code2, Server, Terminal, Database } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ApiReferencePage() {
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
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
                </div>

                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6">
                        <Code2 className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        API Reference
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Build custom integrations and extend EduConnect using a powerful REST API.
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center"
                    >
                        <Terminal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Coming Soon</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Our Developer API is currently in Beta. We are finalizing our OpenAPI specification and SDKs. Full documentation will be available shortly.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                <Server className="h-4 w-4 mr-2" /> REST APIs
                            </div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                <Database className="h-4 w-4 mr-2" /> Webhooks
                            </div>
                        </div>
                    </motion.div>

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
