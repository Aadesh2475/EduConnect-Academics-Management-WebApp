"use client" 

import * as React from "react"
import { cn } from "@/lib/utils"

interface GridBackgroundProps {
  title: string
  description: string
  showAvailability?: boolean
  className?: string
  children?: React.ReactNode
}

export function GridBackground({
  title,
  description,
  showAvailability = false,
  className,
  children,
}: GridBackgroundProps) {
  return (
    <div 
      className={cn(
        'px-6 md:px-10 py-10 md:py-20 rounded-xl relative flex items-center justify-center overflow-hidden border border-white/10',
        className
      )}
      style={{
        backgroundColor: 'rgba(10, 10, 10, 0.8)',
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div 
        className="w-3 h-3 rounded-full absolute shadow-[0_0_15px] shadow-current z-10 bg-current pointer-events-none"
        style={{
          animation: `
            border-follow 6s linear infinite,
            color-change 6s linear infinite
          `
        }}
      />
      <div 
        className="absolute inset-0 border-2 rounded-xl pointer-events-none"
        style={{
          animation: 'border-color-change 6s linear infinite'
        }}
      />

      <div className="relative z-20 w-full max-w-7xl mx-auto">
        <div className="text-center mb-8">
            <h1 className='text-3xl md:text-5xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent'>{title}</h1>
            {description && (
            <p className='text-sm md:text-base mt-4 text-white/40 max-w-2xl mx-auto'>{description}</p>
            )}

            {showAvailability && (
            <div className="available-now text-[#20bb5a] text-sm flex items-center justify-center mt-5">
                <div className="w-2 h-2 bg-[#20bb5a] rounded-full inline-block mr-2 animate-pulse shadow-[0_0_8px_#20bb5a]" />
                System Active
            </div>
            )}
        </div>

        <div className="w-full">
            {children}
        </div>
      </div>
    </div>
  )
} 
