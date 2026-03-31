"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Cookie, Info, ShieldCheck, ToggleRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const sections = [
    {
        icon: Info,
        title: "1. What Are Cookies?",
        content: (
            <div className="space-y-4">
                <p>Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third party to recognize you and make your next visit easier and the Service more useful to you.</p>
                <p>Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your personal computer or mobile device when you go offline, while session cookies are deleted as soon as you close your web browser.</p>
            </div>
        )
    },
    {
        icon: Cookie,
        title: "2. How EduConnect Uses Cookies",
        content: (
            <div className="space-y-4">
                <p>When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    <li><strong>Essential Cookies:</strong> These are cookies that are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website (such as the authentication session tokens).</li>
                    <li><strong>Analytical/Performance Cookies:</strong> These cookies allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it.</li>
                    <li><strong>Functionality Cookies:</strong> These are used to recognize you when you return to our website and remember your preferences (e.g., your choice of light or dark theme).</li>
                </ul>
            </div>
        )
    },
    {
        icon: ToggleRight,
        title: "3. Your Choices Regarding Cookies",
        content: (
            <div className="space-y-4">
                <p>If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.</p>
                <p>Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly (for example, you would be logged out of your EduConnect dashboard).</p>
            </div>
        )
    },
    {
        icon: ShieldCheck,
        title: "4. Third-Party Cookies",
        content: (
            <div className="space-y-4">
                <p>In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service. For example, authentication providers like Google and GitHub use cookies to authorize your login sessions securely.</p>
            </div>
        )
    }
]

export default function CookiePolicyPage() {
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
                        <Cookie className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Cookie Policy
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Understand how we use cookies and similar technologies to improve your experience on EduConnect.
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
