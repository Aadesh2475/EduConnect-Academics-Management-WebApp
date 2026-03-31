import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword } from "@/lib/auth-utils"
import { errorResponse, successResponse } from "@/lib/api/helpers"
import { sendPasswordChangedEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json()

        if (!token || !password) {
            return errorResponse("Token and new password are required")
        }

        if (password.length < 6) {
            return errorResponse("Password must be at least 6 characters")
        }

        // Look up the reset token
        const resetRecord = await prisma.passwordResetToken.findUnique({
            where: { token },
        })

        if (!resetRecord) {
            return errorResponse("Invalid or expired reset link. Please request a new one.", 400)
        }

        if (resetRecord.expires < new Date()) {
            await prisma.passwordResetToken.delete({ where: { token } })
            return errorResponse("This reset link has expired. Please request a new one.", 400)
        }

        // Find user and update password
        const user = await prisma.user.findUnique({ where: { email: resetRecord.email } })
        if (!user) {
            return errorResponse("Account not found.", 404)
        }

        const hashedPassword = await hashPassword(password)

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            }),
            // Invalidate all reset tokens for this email
            prisma.passwordResetToken.deleteMany({ where: { email: resetRecord.email } }),
        ])

        // Send confirmation email (fire-and-forget; don't fail reset if email fails)
        sendPasswordChangedEmail(user.email, user.name).catch(console.error)

        return successResponse(null, "Password reset successfully. You can now log in with your new password.")
    } catch (error) {
        console.error("Reset password error:", error)
        return errorResponse("Internal server error", 500)
    }
}
