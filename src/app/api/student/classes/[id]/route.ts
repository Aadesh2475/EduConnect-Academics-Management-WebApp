import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession, ensureStudentProfile } from "@/lib/auth-utils"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/student/classes/[id] - Get comprehensive data for a specific class
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) return errorResponse("Unauthorized", 401)
        if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

        const student = await ensureStudentProfile(session.userId)
        if (!student) return errorResponse("Failed to load student profile", 500)

        const resolvedParams = await params
        const classId = resolvedParams.id
        if (!classId) return errorResponse("Class ID is required", 400)

        // Verify that the student is enrolled in this class
        const enrollment = await prisma.classEnrollment.findUnique({
            where: {
                classId_studentId: {
                    classId: classId,
                    studentId: student.id,
                },
            },
        })

        if (!enrollment) {
            return errorResponse("Class not found or access denied", 404)
        }

        // Fetch full comprehensive class details
        const classData = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                teacher: {
                    include: {
                        user: { select: { name: true, email: true, image: true } },
                    },
                },
                materials: {
                    orderBy: { createdAt: "desc" },
                },
                assignments: {
                    orderBy: { dueDate: "asc" },
                    include: {
                        submissions: {
                            where: { studentId: student.id },
                        },
                    },
                },
                exams: {
                    orderBy: { startTime: "asc" },
                    include: {
                        attempts: {
                            where: { studentId: student.id },
                        },
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                        materials: true,
                        assignments: true,
                        exams: true,
                    },
                },
            },
        })

        if (!classData) {
            return errorResponse("Class not found", 404)
        }

        // Format assignments to simplify client logic by flattening the student's submission status
        const formattedAssignments = classData.assignments.map((assignment) => {
            const submission = assignment.submissions.length > 0 ? assignment.submissions[0] : null
            return {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                dueDate: assignment.dueDate,
                totalMarks: assignment.totalMarks,
                isActive: assignment.isActive,
                submission: submission
                    ? {
                        status: submission.status,
                        marks: submission.marks,
                        submittedAt: submission.submittedAt,
                        feedback: submission.feedback,
                    }
                    : null,
            }
        })

        // Format exams to simplify client logic
        const formattedExams = classData.exams.map((exam) => {
            const attempt = exam.attempts.length > 0 ? exam.attempts[0] : null
            return {
                id: exam.id,
                title: exam.title,
                description: exam.description,
                type: exam.type,
                duration: exam.duration,
                totalMarks: exam.totalMarks,
                startTime: exam.startTime,
                endTime: exam.endTime,
                isActive: exam.isActive,
                attempt: attempt
                    ? {
                        status: attempt.status,
                        obtainedMarks: attempt.obtainedMarks,
                        percentage: attempt.percentage,
                        startedAt: attempt.startedAt,
                        submittedAt: attempt.submittedAt,
                    }
                    : null,
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                id: classData.id,
                name: classData.name,
                code: classData.code,
                description: classData.description,
                subject: classData.subject,
                department: classData.department,
                semester: classData.semester,
                teacher: classData.teacher.user,
                materials: classData.materials,
                assignments: formattedAssignments,
                exams: formattedExams,
                stats: classData._count,
            },
        })
    } catch (error) {
        console.error("Student class details API error:", error)
        return errorResponse("Internal server error", 500)
    }
}
