import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"
import { createNotification } from "@/lib/notifications"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Unauthorized", 401)
        }

        const { id: classId } = await params
        const body = await req.json()
        const { studentId, reason, details } = body

        if (!studentId || !reason) {
            return errorResponse("Missing required fields", 400)
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        })

        if (!teacher) {
            return errorResponse("Teacher profile not found", 404)
        }

        // Verify class ownership
        const classCheck = await prisma.class.findUnique({
            where: { id: classId, teacherId: teacher.id }
        })

        if (!classCheck) {
            return errorResponse("Class not found or unauthorized", 404)
        }

        // Verify student enrollment
        const enrollment = await prisma.classEnrollment.findUnique({
            where: {
                classId_studentId: {
                    classId,
                    studentId
                }
            },
            include: { student: { include: { user: true } } }
        })

        if (!enrollment) {
            return errorResponse("Student not enrolled in this class", 404)
        }

        // Create Report
        const report = await prisma.studentReport.create({
            data: {
                studentId,
                teacherId: teacher.id,
                classId,
                reason,
                details
            }
        })

        // Notify Student (Optional - typically reports might be confidential, but let's notify for now as per "real updates" request implies visibility)
        // User asked for "Notify students about changes done by teacher". A report might be a warning.
        await createNotification({
            userId: enrollment.student.userId,
            title: "Performance Report",
            message: `You have received a report in ${classCheck.name}: ${reason}`,
            type: "warning",
            link: `/dashboard/student/classes/${classId}`
        })

        return NextResponse.json({ success: true, data: report })

    } catch (error) {
        console.error("Report student error:", error)
        return errorResponse("Internal server error", 500)
    }
}
