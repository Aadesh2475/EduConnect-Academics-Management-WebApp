import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/teacher/registrations - Get all enrollment requests for teacher's classes
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403)
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId },
            include: {
                classes: {
                    select: { id: true }
                }
            }
        })

        if (!teacher) {
            return errorResponse("Teacher profile not found", 404)
        }

        const classIds = teacher.classes.map(c => c.id)

        const registrations = await prisma.classEnrollment.findMany({
            where: {
                classId: { in: classIds }
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    }
                },
                class: {
                    select: {
                        name: true,
                        code: true,
                        department: true,
                        semester: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        const formattedRegistrations = registrations.map(r => ({
            id: r.id,
            studentName: r.student.user.name,
            studentEmail: r.student.user.email,
            studentImage: r.student.user.image,
            className: r.class.name,
            classCode: r.class.code,
            department: r.class.department,
            semester: r.class.semester.toString(),
            requestDate: r.createdAt.toISOString(),
            status: r.status.toLowerCase(),
            enrollmentNumber: r.student.enrollmentNo
        }))

        return NextResponse.json({
            success: true,
            data: formattedRegistrations
        })
    } catch (error) {
        console.error("Teacher registrations error:", error)
        return errorResponse("Internal server error", 500)
    }
}

// PATCH /api/teacher/registrations - Update registration status
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403)
        }

        const body = await req.json()
        const { id, status } = body

        if (!id || !status || !["approved", "rejected"].includes(status)) {
            return errorResponse("Invalid request", 400)
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId },
            include: {
                classes: { select: { id: true, name: true } }
            }
        })

        if (!teacher) {
            return errorResponse("Teacher profile not found", 404)
        }

        // Find the enrollment and check if teacher owns the class
        const enrollment = await prisma.classEnrollment.findUnique({
            where: { id },
            include: { class: true }
        })

        if (!enrollment) {
            return errorResponse("Registration not found", 404)
        }

        const classIds = teacher.classes.map(c => c.id)
        if (!classIds.includes(enrollment.classId)) {
            return errorResponse("Access denied for this class", 403)
        }

        const updatedEnrollment = await prisma.classEnrollment.update({
            where: { id },
            data: {
                status: status.toUpperCase(),
                joinedAt: status === "approved" ? new Date() : null
            }
        })

        // Create notification for student
        await prisma.notification.create({
            data: {
                userId: (await prisma.student.findUnique({ where: { id: enrollment.studentId } }))!.userId,
                title: status === "approved" ? "Enrollment Approved" : "Enrollment Rejected",
                message: status === "approved"
                    ? `Your request to join ${enrollment.class.name} has been approved!`
                    : `Your request to join ${enrollment.class.name} was not approved.`,
                type: status === "approved" ? "success" : "info",
                link: "/dashboard/student/classes"
            }
        })

        return NextResponse.json({
            success: true,
            data: updatedEnrollment
        })
    } catch (error) {
        console.error("Update registration error:", error)
        return errorResponse("Internal server error", 500)
    }
}
