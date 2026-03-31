import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession, ensureStudentProfile } from "@/lib/auth-utils"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/student/assignments/[id] - Get specific assignment details
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
        const assignmentId = resolvedParams.id
        if (!assignmentId) return errorResponse("Assignment ID is required", 400)

        // Fetch assignment and verify student is enrolled
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                class: {
                    include: {
                        enrollments: {
                            where: { studentId: student.id, status: "APPROVED" }
                        },
                        teacher: {
                            include: { user: { select: { name: true } } }
                        }
                    }
                },
                submissions: {
                    where: { studentId: student.id }
                }
            }
        })

        if (!assignment) {
            return errorResponse("Assignment not found", 404)
        }

        if (assignment.class.enrollments.length === 0) {
            return errorResponse("You don't have access to this assignment", 403)
        }

        const submission = assignment.submissions.length > 0 ? assignment.submissions[0] : null

        return NextResponse.json({
            success: true,
            data: {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                instructions: assignment.instructions,
                dueDate: assignment.dueDate,
                totalMarks: assignment.totalMarks,
                isActive: assignment.isActive,
                className: assignment.class.name,
                classCode: assignment.class.code,
                teacherName: assignment.class.teacher.user.name,
                submission: submission ? {
                    id: submission.id,
                    content: submission.content,
                    status: submission.status,
                    grade: submission.marks,
                    feedback: submission.feedback,
                    submittedAt: submission.submittedAt,
                    gradedAt: submission.gradedAt,
                } : null
            }
        })
    } catch (error) {
        console.error("Student single assignment API error:", error)
        return errorResponse("Internal server error", 500)
    }
}
