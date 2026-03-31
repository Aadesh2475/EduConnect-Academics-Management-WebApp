"use client";

import * as React from "react"
import { GridBackground } from "@/components/ui/glowing-card"


export function GridBackgroundDemo() {
  return (
    <div className="p-20 bg-[#090909] min-h-screen flex items-center justify-center">
      <GridBackground
        title='Welcome to EduConnect'
        description="Transforming your ideas into stunning visual experiences. Explore the world of creative design with us."
      >
        <div className="mt-8 p-6 bg-white/5 rounded-lg border border-white/10 text-white/60 text-center">
            Demo Content Area
        </div>
      </GridBackground>
    </div>
  )
} 
