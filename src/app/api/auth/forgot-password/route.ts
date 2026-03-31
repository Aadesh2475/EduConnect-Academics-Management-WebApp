import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { rateLimit, errorResponse, successResponse } from "@/lib/api/helpers"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const rl = await rateLimit(ip, "forgot-password", 3, 300000)
    if (!rl.success) return errorResponse("Too many requests. Try again later.", 429)

    const { email } = await req.json()
    if (!email) return errorResponse("Email is required")

    const user = await prisma.user.findUnique({ where: { email } })
    // Don't reveal if user exists — always return the same response
    if (!user) return successResponse(null, "If an account exists with this email, you will receive a reset link.")

    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } })

    // Create new reset token (UUID-based, expires in 1 hour)
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, token, expires },
    })

    // Build reset URL and send email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

    await sendPasswordResetEmail(email, user.name, resetUrl)

    return successResponse(null, "If an account exists with this email, you will receive a reset link.")
  } catch (error) {
    console.error("Forgot password error:", error)
    return errorResponse("Internal server error", 500)
  }
}
