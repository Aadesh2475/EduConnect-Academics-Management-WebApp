import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

type RouteParams = { params: Promise<{ roomId: string }> }

// GET /api/student/messages/[roomId]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

    const { roomId } = await params
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get("cursor")
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"))

    const membership = await prisma.chatRoomMember.findFirst({ where: { roomId, userId: session.id } })
    if (!membership) return errorResponse("Not a member of this room", 403)

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { members: { include: { user: { select: { id: true, name: true, image: true, role: true } } } } },
    })
    if (!room) return errorResponse("Room not found", 404)

    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { sender: { select: { id: true, name: true, image: true } } },
    })

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()
    const formatted = messages.map((m) => ({
      id: m.id, content: m.content, senderId: m.senderId,
      senderName: m.sender.name, senderImage: m.sender.image,
      isMe: m.senderId === session.id, createdAt: m.createdAt,
    })).reverse()

    await prisma.message.updateMany({ where: { roomId, senderId: { not: session.id }, read: false }, data: { read: true } })

    const otherMembers = room.members.filter((m) => m.userId !== session.id)
    return NextResponse.json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name || otherMembers.map((m) => m.user.name).join(", ") || "Chat",
          type: room.type, classId: room.classId,
          members: room.members.map((m) => ({ id: m.user.id, name: m.user.name, image: m.user.image, role: m.user.role, isMe: m.userId === session.id })),
        },
        messages: formatted, hasMore,
        nextCursor: hasMore && messages.length > 0 ? messages[0].id : null,
      },
    })
  } catch (error) {
    console.error("Get room messages error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/student/messages/[roomId] — send a message + notify recipients
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

    const { roomId } = await params
    const { content } = await req.json()
    if (!content?.trim()) return errorResponse("Content is required", 400)

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { members: { include: { user: { select: { id: true, name: true, role: true } } } } },
    })
    if (!room) return errorResponse("Room not found", 404)

    const membership = room.members.find((m) => m.userId === session.id)
    if (!membership) return errorResponse("Not a member of this room", 403)

    const message = await prisma.message.create({
      data: { roomId, senderId: session.id, content: content.trim() },
      include: { sender: { select: { id: true, name: true, image: true } } },
    })

    await prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } })

    // Notify all other members (teachers get link to teacher messages page)
    const roomName = room.name || session.name
    const preview = content.trim().length > 60 ? content.trim().slice(0, 60) + "…" : content.trim()
    const otherMembers = room.members.filter((m) => m.userId !== session.id)

    if (otherMembers.length > 0) {
      await prisma.notification.createMany({
        data: otherMembers.map((m) => ({
          userId: m.userId,
          title: room.type === "DIRECT" ? `New message from ${session.name}` : `New message in ${roomName}`,
          message: preview,
          type: "info",
          link: m.user.role === "TEACHER" ? "/dashboard/teacher/messages" : "/dashboard/student/messages",
        })),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message.id, content: message.content, senderId: message.senderId,
        senderName: message.sender.name, senderImage: message.sender.image,
        isMe: true, createdAt: message.createdAt,
      },
    })
  } catch (error) {
    console.error("Send student message error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// DELETE /api/student/messages/[roomId]
// ?messageId=X  → delete own message   (no params) → leave/delete conversation
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

    const { roomId } = await params
    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get("messageId")

    if (messageId) {
      const message = await prisma.message.findFirst({ where: { id: messageId, roomId, senderId: session.id } })
      if (!message) return errorResponse("Message not found or not yours", 404)
      await prisma.message.delete({ where: { id: messageId } })
      return NextResponse.json({ success: true, message: "Message deleted" })
    }

    const membership = await prisma.chatRoomMember.findFirst({ where: { roomId, userId: session.id } })
    if (!membership) return errorResponse("Not a member of this room", 403)
    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } })
    if (!room) return errorResponse("Room not found", 404)

    if (room.type === "DIRECT") {
      await prisma.chatRoom.delete({ where: { id: roomId } })
    } else {
      await prisma.chatRoomMember.delete({ where: { id: membership.id } })
    }

    return NextResponse.json({ success: true, message: "Conversation removed" })
  } catch (error) {
    console.error("Delete student conversation error:", error)
    return errorResponse("Internal server error", 500)
  }
}
