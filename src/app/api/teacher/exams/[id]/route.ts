import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"
import { createNotifications } from "@/lib/notifications"

// GET /api/teacher/exams/[id] - Get exam details and results
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403)
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        })
        if (!teacher) return errorResponse("Teacher profile not found", 404)

        const { id: examId } = await params

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                class: { select: { name: true, code: true, teacherId: true } },
                questions: { orderBy: { order: "asc" } },
                attempts: {
                    include: {
                        student: {
                            include: {
                                user: { select: { name: true, email: true, image: true } }
                            }
                        }
                    },
                    where: { status: "GRADED" } // Only show graded attempts in results for now
                }
            }
        })

        if (!exam || exam.class.teacherId !== teacher.id) {
            return errorResponse("Exam not found or access denied", 403)
        }

        // Get all students enrolled in the class to show who hasn't attempted
        const enrollments = await prisma.classEnrollment.findMany({
            where: { classId: exam.classId, status: "APPROVED" },
            include: {
                student: {
                    include: {
                        user: { select: { name: true, email: true, image: true } }
                    }
                }
            }
        })

        // Map results
        const results = enrollments.map(enrollment => {
            const attempt = exam.attempts.find(a => a.studentId === enrollment.studentId)
            const percentage = attempt?.percentage || 0
            
            let status_classified = "PENDING"
            let remarks = ""
            
            if (attempt) {
                if (percentage >= 60) {
                    status_classified = "PASS"
                    remarks = "Excellent Performance"
                } else if (percentage >= 40) {
                    status_classified = "PASS"
                    remarks = "Good Effort"
                } else if (percentage >= 33) {
                    status_classified = "ATKT"
                    remarks = "Needs Improvement"
                } else {
                    status_classified = "FAIL"
                    remarks = "Failed - Academic Concern"
                }
            }

            return {
                studentId: enrollment.studentId,
                name: enrollment.student.user.name,
                email: enrollment.student.user.email,
                image: enrollment.student.user.image,
                status: attempt ? "ATTEMPTED" : "PENDING",
                status_classified,
                remarks,
                score: attempt?.obtainedMarks || 0,
                percentage,
                submittedAt: attempt?.submittedAt || null
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                ...exam,
                questions: exam.questions.map(q => ({
                    ...q,
                    options: q.options ? JSON.parse(q.options) : null
                })),
                results
            }
        })
    } catch (error) {
        console.error("Get exam details error:", error)
        return errorResponse("Internal server error", 500)
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403)
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        })
        if (!teacher) return errorResponse("Teacher profile not found", 404)

        const { id: examId } = await params
        const body = await req.json()

        // Verify ownership
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { class: true }
        })

        if (!exam || exam.class.teacherId !== teacher.id) {
            return errorResponse("Exam not found or access denied", 403)
        }

        const updated = await prisma.$transaction(async (tx) => {
            // Update exam details
            const examUpdate = await tx.exam.update({
                where: { id: examId },
                data: {
                    title: body.title,
                    description: body.description,
                    startTime: body.startTime ? new Date(body.startTime) : undefined,
                    endTime: body.endTime ? new Date(body.endTime) : undefined,
                    duration: body.duration ? parseInt(body.duration) : undefined,
                    totalMarks: body.totalMarks ? parseInt(body.totalMarks) : undefined,
                    passingMarks: body.passingMarks ? parseInt(body.passingMarks) : undefined,
                    isActive: body.isActive,
                    shuffleQuestions: body.shuffleQuestions,
                    showResults: body.showResults,
                }
            })

            // Update questions if provided
            if (body.questions && Array.isArray(body.questions)) {
                // Delete existing questions not in the update
                const questionIds = body.questions.filter((q: any) => q.id).map((q: any) => q.id)
                await tx.question.deleteMany({
                    where: {
                        examId: examId,
                        id: { notIn: questionIds }
                    }
                })

                // Upsert questions
                for (let i = 0; i < body.questions.length; i++) {
                    const q = body.questions[i]
                    if (q.id) {
                        await tx.question.update({
                            where: { id: q.id },
                            data: {
                                question: q.question,
                                type: q.type,
                                options: JSON.stringify(q.options || []),
                                answer: q.correctAnswer,
                                marks: q.marks,
                                order: i + 1
                            }
                        })
                    } else {
                        await tx.question.create({
                            data: {
                                examId: examId,
                                question: q.question,
                                type: q.type,
                                options: JSON.stringify(q.options || []),
                                answer: q.correctAnswer,
                                marks: q.marks,
                                order: i + 1
                            }
                        })
                    }
                }
            }

            return examUpdate
        })

        // Notify students about updates
        if (updated.isActive) {
            const enrollments = await prisma.classEnrollment.findMany({
                where: { classId: exam.classId, status: "APPROVED" },
                include: { student: { select: { userId: true } } }
            })

            await createNotifications(enrollments.map(e => ({
                userId: e.student.userId,
                title: "Exam Updated",
                message: `The exam "${updated.title}" in ${exam.class.name} details have been modified.`,
                type: "info",
                link: `/dashboard/student/quiz`
            })))
        }

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error("Update exam error:", error)
        return errorResponse("Internal server error", 500)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403)
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        })
        if (!teacher) return errorResponse("Teacher profile not found", 404)

        const { id: examId } = await params

        // Verify ownership
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { class: true }
        })

        if (!exam || exam.class.teacherId !== teacher.id) {
            return errorResponse("Exam not found or access denied", 403)
        }

        await prisma.exam.delete({
            where: { id: examId }
        })

        // Notify students
        const enrollments = await prisma.classEnrollment.findMany({
            where: { classId: exam.classId, status: "APPROVED" },
            include: { student: { select: { userId: true } } }
        })

        await createNotifications(enrollments.map(e => ({
            userId: e.student.userId,
            title: "Exam Cancelled",
            message: `The exam "${exam.title}" in ${exam.class.name} has been cancelled.`,
            type: "warning",
            link: `/dashboard/student/academics`
        })))

        return NextResponse.json({ success: true, message: "Exam deleted" })
    } catch (error) {
        console.error("Delete exam error:", error)
        return errorResponse("Internal server error", 500)
    }
}
