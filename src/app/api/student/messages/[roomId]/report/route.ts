import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

type RouteParams = { params: Promise<{ roomId: string }> }

// POST /api/student/messages/[roomId]/report
// { messageId, reason }
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await getSession()
        if (!session) return errorResponse("Unauthorized", 401)
        if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

        const student = await prisma.student.findUnique({ where: { userId: session.id } })
        if (!student) return errorResponse("Student profile not found", 404)

        const { roomId } = await params
        const { messageId, reason } = await req.json()
        if (!messageId || !reason?.trim()) return errorResponse("messageId and reason are required", 400)

        // Confirm student is a member
        const membership = await prisma.chatRoomMember.findFirst({
            where: { roomId, userId: session.id },
            include: { room: true }
        })
        if (!membership) return errorResponse("Not a member of this room", 403)

        // Confirm the message exists in this room
        const message = await prisma.message.findFirst({
            where: { id: messageId, roomId },
            include: { sender: { select: { name: true, role: true } } },
        })
        if (!message) return errorResponse("Message not found", 404)

        const preview = message.content.length > 80 ? message.content.slice(0, 80) + "…" : message.content

        // Determine teacher and class for StudentIssue
        let targetTeacherId = null
        let targetClassId = membership.room.classId

        if (membership.room.type === 'DIRECT') {
            const otherMember = await prisma.chatRoomMember.findFirst({
                where: { roomId, userId: { not: session.id } },
                include: { user: { include: { teacher: true } } }
            })
            if (otherMember?.user.teacher) {
                targetTeacherId = otherMember.user.teacher.id
            }
        } else if (targetClassId) {
            const cls = await prisma.class.findUnique({ where: { id: targetClassId } })
            if (cls) targetTeacherId = cls.teacherId
        }

        // Create unified StudentIssue
        await prisma.studentIssue.create({
            data: {
                studentId: student.id,
                teacherId: targetTeacherId,
                classId: targetClassId,
                category: 'MESSAGE',
                title: `Reported message from ${message.sender.name}`,
                description: `Reason: ${reason.trim()}\n\nMessage Content: "${message.content}"`,
                entityId: messageId,
                entityType: 'MESSAGE',
                priority: 'MEDIUM',
                status: 'OPEN'
            }
        })

        // Notify all admins
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.id,
                    title: `Message Reported by ${session.name}`,
                    message: `Sender: ${message.sender.name} · Reason: ${reason.trim()} · Preview: "${preview}"`,
                    type: "warning",
                    link: "/dashboard/admin/messages",
                })),
            })
        }

        // Notify teacher if applicable
        if (targetTeacherId) {
            const teacherUser = await prisma.teacher.findUnique({ where: { id: targetTeacherId }, select: { userId: true } })
            if (teacherUser) {
                await prisma.notification.create({
                    data: {
                        userId: teacherUser.userId,
                        title: "Message Issue Reported",
                        message: `${session.name} reported a message in your chat/class.`,
                        type: "warning",
                        link: "/dashboard/teacher/reports"
                    }
                })
            }
        }

        return NextResponse.json({ success: true, message: "Report submitted successfully" })
    } catch (error) {
        console.error("Student report error:", error)
        return errorResponse("Internal server error", 500)
    }
}
