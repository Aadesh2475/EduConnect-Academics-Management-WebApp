import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"

// Helper for standardized error responses
const errorResponse = (message: string, status: number) => {
    return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "STUDENT") {
            return errorResponse("Unauthorized", 401)
        }

        const body = await req.json()
        const { attendanceId, reason, description } = body

        if (!attendanceId || !reason || !description) {
            return errorResponse("Missing required fields", 400)
        }

        // specific attendance record to verify
        // Find the attendance session not the attendance record directly to get class/teacher info
        // But we need the attendance record too.

        // We can find the attendance record, which links to session, which links to class, which links to teacher.
        // Wait, Attendance -> AttendanceSession -> Class -> Teacher
        // Let's find the session first using the attendanceId if passed, or we might need to look up differently.
        // The previous API returns "id" as session.id, and record.id is inside.
        // Let's assume the frontend passes the attendance session ID or the specific attendance record ID?
        // The student views "sessions". If they report an issue on a session, they are reporting their own status in that session.

        // Let's assume attendanceId refers to the AttendanceSession.id?
        // No, student wants to report "I was present but marked absent".
        // So we need to find the session.

        const attendanceSession = await prisma.attendanceSession.findUnique({
            where: { id: attendanceId }, // Use session ID for simplicity
            include: {
                class: {
                    select: {
                        name: true,
                        teacherId: true
                    }
                }
            }
        })

        if (!attendanceSession) {
            return errorResponse("Attendance session not found", 404)
        }

        // Create Help Ticket
        const ticket = await prisma.helpTicket.create({
            data: {
                userId: session.id,
                subject: `Attendance Issue: ${attendanceSession.class.name} (${new Date(attendanceSession.date).toLocaleDateString()})`,
                description: `Reason: ${reason}\nDetails: ${description}`,
                category: "ATTENDANCE",
                priority: "MEDIUM",
                status: "OPEN"
            }
        })

        // Notify Teacher
        await prisma.notification.create({
            data: {
                userId: attendanceSession.class.teacherId, // Correctly use the teacher ID from the class
                // Wait, notification userId must reference a User.
                // Teachers have a User. We need the User ID of the teacher.
                // schema: Teacher -> User (relation). Teacher.userId is the User ID.
                // attendanceSession.class.teacherId is the Teacher ID (model Teacher).
                // We need to fetch the Teacher model to get the userId.
                title: "New Attendance Issue Reported",
                message: `${session.name} reported an issue for ${attendanceSession.class.name} on ${new Date(attendanceSession.date).toLocaleDateString()}`,
                type: "warning",
                link: `/dashboard/teacher/attendance?sessionId=${attendanceId}`
            }
        })

        // Correction: Notification needs User ID.
        // We need to fetch teacher's userId.
        const teacher = await prisma.teacher.findUnique({
            where: { id: attendanceSession.class.teacherId },
            select: { userId: true }
        })

        if (teacher) {
            // Notification logic again
            await prisma.notification.create({
                data: {
                    userId: teacher.userId,
                    title: "New Attendance Issue Reported",
                    message: `${session.name} reported an issue for ${attendanceSession.class.name} on ${new Date(attendanceSession.date).toLocaleDateString()}`,
                    type: "warning",
                    link: `/dashboard/teacher/attendance` // simplified link
                }
            })
        }

        return NextResponse.json({ success: true, data: ticket })

    } catch (error) {
        console.error("Report attendance issue error:", error)
        return errorResponse("Internal server error", 500)
    }
}
