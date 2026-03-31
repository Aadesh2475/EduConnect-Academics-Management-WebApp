'use client'

import React from 'react'
import Link from 'next/link'
import { Github, Twitter, Linkedin, ArrowRight, GraduationCap, Lock } from 'lucide-react'

export function NeoMinimalFooter() {
    return (
        <footer className="bg-gray-950 border-t border-white/5 pt-16 pb-8 relative overflow-hidden">

            {/* Background Tech Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">

                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-5 flex flex-col gap-6">
                        <Link href="/" className="flex items-center gap-2 w-fit">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">EduConnect</span>
                        </Link>

                        <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                            Empowering education through technology. Connecting students, teachers, and institutions with AI-driven academic management.
                        </p>

                        {/* Email subscribe */}
                        <div className="flex items-center gap-2 mt-2">
                            <div className="relative flex-1 max-w-xs">
                                <input
                                    type="email"
                                    placeholder="Get platform updates..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>
                            <button
                                aria-label="Subscribe"
                                className="p-2.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 transition-colors"
                            >
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Links Columns */}
                    {[
                        {
                            title: "Platform",
                            links: [
                                { label: "Features", href: "#features" },
                                { label: "Analytics", href: "#analytics" },
                                { label: "AI Integration", href: "#ai" },
                                { label: "Pricing", href: "#" },
                            ],
                        },
                        {
                            title: "Resources",
                            links: [
                                { label: "Documentation", href: "/docs" },
                                { label: "API Reference", href: "/api-reference" },
                                { label: "Help Center", href: "/help" },
                                { label: "FAQ", href: "#faq" },
                            ],
                        },
                        {
                            title: "Legal",
                            links: [
                                { label: "Privacy Policy", href: "/privacy" },
                                { label: "Terms of Service", href: "/terms" },
                                { label: "Cookie Policy", href: "/cookie-policy" },
                                { label: "Security", href: "/security" },
                            ],
                        },
                    ].map((section) => (
                        <div key={section.title} className="col-span-6 md:col-span-2 flex flex-col gap-4">
                            <h4 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-widest">
                                {section.title}
                            </h4>
                            <ul className="flex flex-col gap-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm font-mono text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-2 group w-fit"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-gray-700 group-hover:bg-indigo-400 group-hover:w-4 transition-all duration-200" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Lock className="h-3.5 w-3.5" />
                        <p className="text-xs font-mono">
                            © {new Date().getFullYear()} EduConnect · Secured with industry-standard encryption
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Social icons */}
                        <div className="flex gap-4 border-r border-white/10 pr-6 mr-2">
                            {[
                                { Icon: Github, href: "#", label: "GitHub" },
                                { Icon: Twitter, href: "#", label: "Twitter" },
                                { Icon: Linkedin, href: "#", label: "LinkedIn" },
                            ].map(({ Icon, href, label }) => (
                                <a key={label} href={href} aria-label={label} className="text-gray-600 hover:text-white transition-colors">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>

                        {/* Status indicator */}
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] uppercase font-medium text-emerald-500/80 tracking-wider">
                                All Systems Normal
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
