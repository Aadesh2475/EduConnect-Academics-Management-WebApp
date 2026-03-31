"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, User, GraduationCap, Settings, ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const categories = [
    {
        icon: GraduationCap,
        title: "Student Guide",
        description: "Learn how to join classes, submit assignments, and view your grades.",
        link: "#"
    },
    {
        icon: User,
        title: "Teacher Guide",
        description: "Find out how to manage classes, create exams, and grade submissions.",
        link: "#"
    },
    {
        icon: Settings,
        title: "Admin Guide",
        description: "Documentation on managing users, system settings, and analytics.",
        link: "#"
    }
]

export default function DocumentationPage() {
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
                        <BookOpen className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Documentation
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Everything you need to know about using EduConnect. Explore our comprehensive guides and tutorials.
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-6">
                        {categories.map((category, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Link href={category.link} className="block h-full bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all group">
                                    <div className="p-2.5 w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                                        <category.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{category.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{category.description}</p>
                                    <div className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-auto">
                                        View Guide <ArrowRight className="h-4 w-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Can't find what you're looking for?</p>
                        <Link href="/help" className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                            Visit Help Center
                        </Link>
                    </div>

                    {/* Footer inside layout */}
                    <div className="pt-12 mt-16 border-t border-gray-200 dark:border-gray-800 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            &copy; {new Date().getFullYear()} EduConnect. All rights reserved.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
