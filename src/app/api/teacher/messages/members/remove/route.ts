import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        if (session.role !== "TEACHER" && session.role !== "ADMIN") {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
        }

        const { roomId, memberId } = await request.json()

        if (!roomId || !memberId) {
            return NextResponse.json({ success: false, error: "Room ID and Member ID are required" }, { status: 400 })
        }

        // Verify the room exists and the teacher is a member
        const room = await prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: {
                members: {
                    where: { userId: session.id }
                }
            }
        })

        if (!room) {
            return NextResponse.json({ success: false, error: "Chat room not found" }, { status: 404 })
        }

        if (room.members.length === 0 && session.role !== "ADMIN") {
            return NextResponse.json({ success: false, error: "You are not a member of this chat room" }, { status: 403 })
        }

        if (room.type === "DIRECT") {
            return NextResponse.json({ success: false, error: "Cannot remove members from a direct message" }, { status: 400 })
        }

        // You cannot remove yourself using this endpoint
        if (memberId === session.id) {
            return NextResponse.json({ success: false, error: "You cannot remove yourself" }, { status: 400 })
        }

        // Remove the member
        await prisma.chatRoomMember.delete({
            where: {
                roomId_userId: {
                    roomId,
                    userId: memberId
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error removing chat member:", error)
        return NextResponse.json(
            { success: false, error: "Failed to remove member" },
            { status: 500 }
        )
    }
}
