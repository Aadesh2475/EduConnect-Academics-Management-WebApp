import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "feedback-submit", 10)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitResult.headers }
      )
    }

    const session = await getSession()
    const data = await request.json()

    if (!data.rating || !data.message) {
      return NextResponse.json({ error: "Rating and message are required" }, { status: 400 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: session?.id || null,
        email: session?.email || data.email || null,
        subject: data.subject || "Platform Feedback",
        message: data.message,
        rating: data.rating,
        type: data.type || "GENERAL",
      },
    })

    return NextResponse.json({ success: true, feedback }, { status: 201, headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
