'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface AuthPageProps {
    children: React.ReactNode;
    quote?: string;
    quoteAuthor?: string;
    backHref?: string;
    backLabel?: string;
}

export function AuthPage({
    children,
    quote = '"EduConnect has transformed how we manage academics. Real-time insights keep every student on track."',
    quoteAuthor = 'Team EduConnect',
    backHref = '/',
    backLabel = 'Home',
}: AuthPageProps) {
    return (
        <main className="flex min-h-screen w-full">

            {/* ===== LEFT PANEL — hidden below lg, flex at lg+ ===== */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r bg-muted/60 p-10 relative overflow-hidden dark:bg-zinc-900">

                {/* Top gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none z-10" />

                {/* Brand */}
                <div className="relative z-20 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow">
                        <GraduationCap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xl font-semibold">EduConnect</span>
                </div>

                {/* Quote */}
                <div className="relative z-20">
                    <blockquote className="space-y-3">
                        <p className="text-xl leading-relaxed">{quote}</p>
                        <footer className="font-mono text-sm font-semibold text-muted-foreground">
                            {quoteAuthor}
                        </footer>
                    </blockquote>
                </div>

                {/* Animated SVG paths in background */}
                <div className="absolute inset-0 overflow-hidden">
                    <FloatingPaths position={1} />
                    <FloatingPaths position={-1} />
                </div>
            </div>

            {/* ===== RIGHT PANEL ===== */}
            <div className="relative flex flex-1 flex-col items-center justify-start overflow-y-auto px-4 py-16">

                {/* Subtle bg blobs */}
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
                    <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
                </div>

                {/* Back link */}
                <Link
                    href={backHref}
                    className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    {backLabel}
                </Link>

                {/* Mobile brand — only shown below lg where left panel is hidden */}
                <div className="mb-6 flex items-center gap-2 lg:hidden">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-gray-500 to-gray-500 flex items-center justify-center">
                        <GraduationCap className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-lg font-semibold">EduConnect</span>
                </div>

                {/* Form content */}
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </main>
    );
}

/* ===== Floating animated SVG paths — bright glow ===== */
function FloatingPaths({ position }: { position: number }) {
    const filterId = `glow${position > 0 ? 'P' : 'N'}`;
    const paths = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        width: 0.8 + i * 0.07,
        opacity: 0.28 + i * 0.032,
    }));

    return (
        <div className="pointer-events-none absolute inset-0">
            <svg
                className="h-full w-full"
                viewBox="0 -200 696 1100"
                fill="none"
                aria-hidden="true"
            >
                <defs>
                    <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id={`grad${filterId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="55%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                </defs>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke={`url(#grad${filterId})`}
                        strokeWidth={path.width}
                        strokeOpacity={path.opacity}
                        filter={`url(#${filterId})`}
                        fill="none"
                        initial={{ pathLength: 0.2, opacity: 0 }}
                        animate={{
                            pathLength: 1,
                            opacity: [path.opacity * 0.5, path.opacity, path.opacity * 0.5],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 16 + path.id * 0.9,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}
