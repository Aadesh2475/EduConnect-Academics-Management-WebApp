import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"

// Helper for standardized error responses
const errorResponse = (message: string, status: number) => {
    return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Unauthorized", 401)
        }

        const { id } = await params

        if (!id) {
            return errorResponse("Missing session ID", 400)
        }

        // Verify ownership and get session with student details
        const attSession = await prisma.attendanceSession.findUnique({
            where: { id },
            include: {
                class: true,
                attendances: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: { name: true, email: true, image: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!attSession) {
            return errorResponse("Session not found", 404)
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id }
        })

        if (!teacher || teacher.id !== attSession.class.teacherId) {
            return errorResponse("Access denied", 403)
        }

        // Fetch all approved enrollments for this class
        const currentEnrollments = await prisma.classEnrollment.findMany({
            where: {
                classId: attSession.classId,
                status: "APPROVED"
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: { name: true, email: true, image: true }
                        }
                    }
                }
            }
        })

        // Map existing attendance by studentId for quick lookup
        const attendanceMap = new Map(attSession.attendances.map(a => [a.studentId, a]))

        // Create a complete list of students: existing attendance + new enrollments
        const formattedStudents = currentEnrollments.map(e => {
            const existingRecord = attendanceMap.get(e.studentId)
            return {
                id: e.student.id,
                name: e.student.user.name,
                email: e.student.user.email,
                image: e.student.user.image,
                enrollmentNumber: e.student.enrollmentNo || "N/A",
                status: existingRecord ? existingRecord.status : null, // null means not yet marked
                remarks: existingRecord?.remarks || ""
            }
        })

        const payload = {
            classId: attSession.classId,
            className: attSession.class.name,
            classCode: attSession.class.code,
            date: attSession.date,
            topic: attSession.topic,
            createdAt: attSession.createdAt,
            students: formattedStudents
        }

        return NextResponse.json({ success: true, data: payload })

    } catch (error) {
        console.error("Get individual attendance session error:", error)
        return errorResponse("Internal server error", 500)
    }
}
