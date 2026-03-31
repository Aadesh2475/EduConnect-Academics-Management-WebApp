import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/chat/messages - Get messages for a room
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get("roomId")
    const cursor = searchParams.get("cursor")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!roomId) return errorResponse("Room ID required", 400)

    // Verify user is member of the room
    const isMember = await prisma.chatRoomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId: session.id }
      }
    })

    if (!isMember) return errorResponse("Not a member of this room", 403)

    const messages = await prisma.message.findMany({
      where: { roomId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        roomId,
        senderId: { not: session.id },
        read: false,
      },
      data: { read: true }
    })

    return NextResponse.json({
      success: true,
      data: messages.reverse(),
      nextCursor: messages.length === limit ? messages[0].id : null,
    })
  } catch (error) {
    console.error("Chat messages error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/chat/messages - Send a message
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const body = await req.json()
    const { roomId, content, receiverId } = body

    if (!content) return errorResponse("Message content required", 400)

    // Direct message (without room)
    if (receiverId && !roomId) {
      const message = await prisma.message.create({
        data: {
          content,
          senderId: session.id,
          receiverId,
        },
        include: {
          sender: { select: { id: true, name: true, image: true } }
        }
      })

      return NextResponse.json({ success: true, data: message })
    }

    // Room message
    if (roomId) {
      // Verify user is member of the room
      const isMember = await prisma.chatRoomMember.findUnique({
        where: {
          roomId_userId: { roomId, userId: session.id }
        }
      })

      if (!isMember) return errorResponse("Not a member of this room", 403)

      const message = await prisma.message.create({
        data: {
          content,
          senderId: session.id,
          roomId,
        },
        include: {
          sender: { select: { id: true, name: true, image: true } }
        }
      })

      // Update room's updatedAt
      await prisma.chatRoom.update({
        where: { id: roomId },
        data: { updatedAt: new Date() }
      })

      return NextResponse.json({ success: true, data: message })
    }

    return errorResponse("Room ID or receiver ID required", 400)
  } catch (error) {
    console.error("Send message error:", error)
    return errorResponse("Internal server error", 500)
  }
}
