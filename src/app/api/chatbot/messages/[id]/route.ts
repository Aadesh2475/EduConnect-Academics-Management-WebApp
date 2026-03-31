import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse, successResponse } from "@/lib/api/helpers"

// ── PATCH /api/chatbot/messages/[id] — save thumbs feedback ──────────────────
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) return errorResponse("Unauthorized", 401)

        const { id } = await context.params
        const { feedback } = await req.json() // "up" | "down" | null

        // Verify the message belongs to this user
        const message = await prisma.aIChatMessage.findFirst({
            where: { id },
            include: { session: { select: { userId: true } } },
        })

        if (!message || message.session.userId !== session.id) {
            return errorResponse("Message not found", 404)
        }

        const updated = await prisma.aIChatMessage.update({
            where: { id },
            data: { feedback: feedback ?? null },
        })

        return successResponse({ id: updated.id, feedback: updated.feedback })
    } catch (err) {
        console.error("PATCH /api/chatbot/messages/[id] error:", err)
        return errorResponse("Failed to update feedback", 500)
    }
}
