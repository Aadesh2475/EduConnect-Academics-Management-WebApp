import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/chat/rooms - Get chat rooms for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const rooms = await prisma.chatRoom.findMany({
      where: {
        members: {
          some: { userId: session.id }
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            content: true,
            createdAt: true,
            sender: { select: { name: true } }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                senderId: { not: session.id }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    const transformedRooms = rooms.map(room => ({
      id: room.id,
      name: room.name || room.members.find(m => m.userId !== session.id)?.user.name || "Chat",
      type: room.type,
      members: room.members.map(m => m.user),
      lastMessage: room.messages[0] || null,
      unreadCount: room._count.messages,
    }))

    return NextResponse.json({ success: true, data: transformedRooms })
  } catch (error) {
    console.error("Chat rooms error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/chat/rooms - Create a new chat room or start direct chat
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const body = await req.json()
    const { type, name, memberIds, classId } = body

    if (type === "DIRECT") {
      if (!memberIds || memberIds.length !== 1) {
        return errorResponse("Direct chat requires exactly one other member", 400)
      }

      // Check if direct chat already exists
      const existingRoom = await prisma.chatRoom.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            { members: { some: { userId: session.id } } },
            { members: { some: { userId: memberIds[0] } } },
          ]
        }
      })

      if (existingRoom) {
        return NextResponse.json({ success: true, data: existingRoom, existing: true })
      }

      // Create new direct chat
      const room = await prisma.chatRoom.create({
        data: {
          type: "DIRECT",
          members: {
            create: [
              { userId: session.id },
              { userId: memberIds[0] },
            ]
          }
        },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, image: true } } }
          }
        }
      })

      return NextResponse.json({ success: true, data: room })
    }

    if (type === "GROUP") {
      if (!name || !memberIds || memberIds.length < 1) {
        return errorResponse("Group chat requires name and at least one member", 400)
      }

      const room = await prisma.chatRoom.create({
        data: {
          type: "GROUP",
          name,
          members: {
            create: [
              { userId: session.id, role: "ADMIN" },
              ...memberIds.map((id: string) => ({ userId: id })),
            ]
          }
        }
      })

      return NextResponse.json({ success: true, data: room })
    }

    if (type === "CLASS") {
      if (!classId) {
        return errorResponse("Class ID required for class chat", 400)
      }

      // Check if class chat already exists
      const existingRoom = await prisma.chatRoom.findFirst({
        where: { type: "CLASS", classId }
      })

      if (existingRoom) {
        return NextResponse.json({ success: true, data: existingRoom, existing: true })
      }

      // Get class info and enrolled students
      const classInfo = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          teacher: { select: { userId: true } },
          enrollments: {
            where: { status: "APPROVED" },
            select: { student: { select: { userId: true } } }
          }
        }
      })

      if (!classInfo) {
        return errorResponse("Class not found", 404)
      }

      const room = await prisma.chatRoom.create({
        data: {
          type: "CLASS",
          name: classInfo.name,
          classId,
          members: {
            create: [
              { userId: classInfo.teacher.userId, role: "ADMIN" },
              ...classInfo.enrollments.map(e => ({ userId: e.student.userId })),
            ]
          }
        }
      })

      return NextResponse.json({ success: true, data: room })
    }

    return errorResponse("Invalid room type", 400)
  } catch (error) {
    console.error("Create chat room error:", error)
    return errorResponse("Internal server error", 500)
  }
}
