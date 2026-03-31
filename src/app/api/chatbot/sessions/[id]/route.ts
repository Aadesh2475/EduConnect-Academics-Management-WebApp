import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse, successResponse } from "@/lib/api/helpers"

// ── GET /api/chatbot/sessions/[id] — load session with all messages ──────────
export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) return errorResponse("Unauthorized", 401)

        const { id } = await context.params

        const chatSession = await prisma.aIChatSession.findFirst({
            where: { id, userId: session.id },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        role: true,
                        content: true,
                        feedback: true,
                        tokenCount: true,
                        createdAt: true,
                    },
                },
            },
        })

        if (!chatSession) return errorResponse("Session not found", 404)

        return successResponse(chatSession)
    } catch (err) {
        console.error("GET /api/chatbot/sessions/[id] error:", err)
        return errorResponse("Failed to load session", 500)
    }
}

// ── DELETE /api/chatbot/sessions/[id] — delete a session ─────────────────────
export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) return errorResponse("Unauthorized", 401)

        const { id } = await context.params

        const chatSession = await prisma.aIChatSession.findFirst({
            where: { id, userId: session.id },
        })
        if (!chatSession) return errorResponse("Session not found", 404)

        await prisma.aIChatSession.delete({ where: { id } })

        return successResponse({ deleted: true })
    } catch (err) {
        console.error("DELETE /api/chatbot/sessions/[id] error:", err)
        return errorResponse("Failed to delete session", 500)
    }
}

// ── PATCH /api/chatbot/sessions/[id] — rename session title ──────────────────
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) return errorResponse("Unauthorized", 401)

        const { id } = await context.params
        const { title } = await req.json()

        const chatSession = await prisma.aIChatSession.findFirst({
            where: { id, userId: session.id },
        })
        if (!chatSession) return errorResponse("Session not found", 404)

        const updated = await prisma.aIChatSession.update({
            where: { id },
            data: { title },
        })

        return successResponse(updated)
    } catch (err) {
        console.error("PATCH /api/chatbot/sessions/[id] error:", err)
        return errorResponse("Failed to update session", 500)
    }
}
