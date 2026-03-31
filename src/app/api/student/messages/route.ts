import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/student/messages
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

    const rooms = await prisma.chatRoom.findMany({
      where: { members: { some: { userId: session.id } } },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true, role: true } } },
        },
        messages: {
          take: 1, orderBy: { createdAt: "desc" },
          include: { sender: { select: { name: true } } },
        },
        _count: {
          select: { messages: { where: { read: false, senderId: { not: session.id } } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    const formatted = rooms.map((room) => {
      const otherMembers = room.members.filter((m) => m.userId !== session.id)
      const lastMsg = room.messages[0] || null
      return {
        id: room.id,
        name: room.name || otherMembers.map((m) => m.user.name).join(", ") || "Chat",
        type: room.type, classId: room.classId,
        members: otherMembers.map((m) => ({
          id: m.user.id, name: m.user.name, image: m.user.image, role: m.user.role,
        })),
        lastMessage: lastMsg
          ? { content: lastMsg.content, senderName: lastMsg.sender.name, createdAt: lastMsg.createdAt }
          : null,
        unreadCount: room._count.messages,
        updatedAt: room.updatedAt,
      }
    })

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error("Get student messages error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/student/messages
// action=create_direct  { recipientId }  – start/get direct chat with teacher
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

    const body = await req.json()
    const { action, recipientId } = body

    if (action === "create_direct" || action === "create_room") {
      if (!recipientId) return errorResponse("recipientId required", 400)

      const existing = await prisma.chatRoom.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            { members: { some: { userId: session.id } } },
            { members: { some: { userId: recipientId } } },
          ],
        },
      })

      if (existing) {
        return NextResponse.json({ success: true, data: { roomId: existing.id }, existing: true })
      }

      const room = await prisma.chatRoom.create({
        data: {
          type: "DIRECT",
          members: { create: [{ userId: session.id }, { userId: recipientId }] },
        },
      })

      return NextResponse.json({ success: true, data: { roomId: room.id } })
    }

    return errorResponse("Invalid action", 400)
  } catch (error) {
    console.error("Student messages POST error:", error)
    return errorResponse("Internal server error", 500)
  }
}
