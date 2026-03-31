"use client";

import React, { useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

function HeroSplineBackground() {
    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100vh',
            pointerEvents: 'auto',
            overflow: 'hidden',
        }}>
            <Spline
                style={{
                    width: '100%',
                    height: '100vh',
                    pointerEvents: 'auto',
                }}
                scene="https://prod.spline.design/dJqTIQ-tE3ULUPMi/scene.splinecode"
            />
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    background: `
            linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.8)),
            linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.9))
          `,
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}

function ScreenshotSection({ screenshotRef }: { screenshotRef: React.RefObject<HTMLDivElement | null> }) {
    return (
        <section className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 mt-11 md:mt-16 pb-8">
            {/* Glow halo */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto w-[70%] h-40 bg-indigo-600/30 blur-3xl rounded-full pointer-events-none" />

            <div
                ref={screenshotRef}
                className="relative w-full md:w-[82%] lg:w-[72%] mx-auto rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.25)] border border-white/10"
            >
                {/* Browser chrome bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/95 border-b border-white/10">
                    <span className="w-3 h-3 rounded-full bg-red-500/90" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/90" />
                    <span className="w-3 h-3 rounded-full bg-green-500/90" />
                    <div className="flex-1 mx-3 bg-gray-800/80 rounded-md px-3 py-1 text-xs text-gray-400 font-mono truncate">
                        app.educonnect.io/dashboard
                    </div>
                </div>

                {/* Dashboard screenshot */}
                <img
                    src="https://signoz.io/img/docs/dashboards/dashboard-templates/web-vitals-dashboard.webp"
                    alt="EduConnect Dashboard Preview"
                    className="w-full h-auto block"
                />

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </div>
        </section>
    );
}

function HeroContent() {
    return (
        <div className="text-white px-4 max-w-screen-xl mx-auto w-full flex flex-col lg:flex-row justify-between items-start lg:items-center py-16">

            <div className="w-full lg:w-1/2 pr-0 lg:pr-8 mb-8 lg:mb-0">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight tracking-wide">
                    Transform Your<br />Academic Experience
                </h1>
                <div className="text-sm text-gray-300 opacity-90 mt-4">
                    AI-POWERED • WEB-BASED • ANALYTICS • MODERN UI
                </div>
            </div>

            <div className="w-full lg:w-1/2 pl-0 lg:pl-8 flex flex-col items-start">
                <p className="text-base sm:text-lg opacity-80 mb-6 max-w-md">
                    A comprehensive platform connecting students, teachers, and institutions. Manage classrooms, track performance, and get AI-powered insights — all in one place.
                </p>
                <div className="flex pointer-events-auto flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-3">
                    <Link href="#how-it-works">
                        <button className="border border-white text-white font-semibold py-2.5 sm:py-3.5 px-6 sm:px-8 rounded-2xl transition duration-300 w-full sm:w-auto hover:bg-white hover:text-black">
                            See How it Works
                        </button>
                    </Link>
                    <Link href="/auth/register">
                        <button className="pointer-events-auto bg-white text-black font-semibold py-2.5 sm:py-3.5 px-6 sm:px-8 rounded-2xl transition duration-300 hover:scale-105 flex items-center justify-center w-full sm:w-auto">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4C11.4477 4 11 4.44772 11 5V11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H11V19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19V13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11H13V5C13 4.44772 12.5523 4 12 4Z" fill="currentColor" />
                            </svg>
                            Start for Free
                        </button>
                    </Link>
                </div>
            </div>

        </div>
    );
}

function EduNavbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" 
             style={{ 
                 backgroundColor: 'rgba(5, 5, 10, 0.6)', 
                 backdropFilter: 'blur(12px)', 
                 WebkitBackdropFilter: 'blur(12px)', 
                 borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                 boxShadow: '0 4px 24px -1px rgba(99, 102, 241, 0.15), 0 0 1px 0 rgba(255, 255, 255, 0.1)'
             }}>
            <div className="container mx-auto px-4 py-3.5 md:px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gray-600 to-gray-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Edu<span className="text-indigo-400">Connect</span></span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-6">
                        <a href="#features" className="text-gray-300 hover:text-white text-sm transition duration-150">Features</a>
                        <a href="#analytics" className="text-gray-300 hover:text-white text-sm transition duration-150">Analytics</a>
                        <a href="#ai" className="text-gray-300 hover:text-white text-sm transition duration-150">AI</a>
                        <a href="#how-it-works" className="text-gray-300 hover:text-white text-sm transition duration-150">How it Works</a>
                        <a href="#faq" className="text-gray-300 hover:text-white text-sm transition duration-150">FAQ</a>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/auth/login">
                        <span className="text-gray-300 hover:text-white px-4 py-2 text-sm transition duration-150 cursor-pointer">
                            Log in
                        </span>
                    </Link>
                    <Link href="/auth/register">
                        <span className="border border-white text-white px-5 py-2 rounded-full text-sm hover:bg-white hover:text-black transition duration-300 cursor-pointer">
                            Get Started
                        </span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}

const HeroSection = () => {
    const screenshotRef = useRef<HTMLDivElement>(null);
    const heroContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (screenshotRef.current && heroContentRef.current) {
                requestAnimationFrame(() => {
                    const scrollPosition = window.pageYOffset;

                    if (screenshotRef.current) {
                        screenshotRef.current.style.transform = `translateY(-${scrollPosition * 0.5}px)`;
                    }

                    const maxScroll = 400;
                    const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
                    if (heroContentRef.current) {
                        heroContentRef.current.style.opacity = opacity.toString();
                    }
                });
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="relative">
            <EduNavbar />

            <div className="relative min-h-screen">
                <div className="absolute inset-0 z-0 pointer-events-auto">
                    <HeroSplineBackground />
                </div>

                <div ref={heroContentRef} style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100vh',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, pointerEvents: 'none'
                }}>
                    <HeroContent />
                </div>
            </div>

            <div className="bg-[#090909] relative z-10" style={{ marginTop: '-10vh' }}>
                <ScreenshotSection screenshotRef={screenshotRef} />
            </div>
        </div>
    );
};

export { HeroSection };
