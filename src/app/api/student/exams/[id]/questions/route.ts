import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "STUDENT") {
            return errorResponse("Forbidden", 403)
        }

        const { id: examId } = await params

        const student = await prisma.student.findUnique({
            where: { userId: session.userId },
            include: {
                classEnrollments: { where: { status: "APPROVED" } }
            }
        })

        if (!student) return errorResponse("Student profile not found", 404)

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                questions: {
                    orderBy: { order: "asc" },
                    select: {
                        id: true,
                        question: true,
                        type: true,
                        options: true,
                        marks: true,
                    }
                }
            }
        })

        if (!exam) return errorResponse("Exam not found", 404)

        // Check if student is enrolled in the class
        const isEnrolled = student.classEnrollments.some(e => e.classId === exam.classId)
        if (!isEnrolled) return errorResponse("Not enrolled in this class", 403)

        // Check if exam is currently available
        const now = new Date()
        if (now < new Date(exam.startTime)) return errorResponse("Exam has not started yet", 400)
        if (now > new Date(exam.endTime)) return errorResponse("Exam has ended", 400)

        // Log or create the attempt if not already exists (simplified: just fetch questions)
        // In a real app, you'd create the ExamAttempt record here if it doesn't exist
        let attempt = await prisma.examAttempt.findUnique({
            where: {
                examId_studentId: {
                    examId,
                    studentId: student.id,
                }
            },
            include: { answers: true }
        })

        if (!attempt) {
            attempt = await prisma.examAttempt.create({
                data: {
                    examId,
                    studentId: student.id,
                    status: "IN_PROGRESS",
                    startedAt: now,
                },
                include: { answers: true }
            })
        } else if (attempt.status !== "IN_PROGRESS") {
            return errorResponse("Exam already submitted", 400)
        }

        return NextResponse.json({ 
            success: true, 
            data: exam.questions, 
            attempt: {
                id: attempt.id,
                startedAt: attempt.startedAt,
                status: attempt.status,
                // Include answers if available to resume
                answers: attempt.answers.reduce((acc: Record<string, string | null>, cur: { questionId: string; answer: string | null }) => {
                    acc[cur.questionId] = cur.answer;
                    return acc;
                }, {} as Record<string, string | null>)
            }
        })
    } catch (error) {
        console.error("Fetch exam questions error:", error)
        return errorResponse("Internal server error", 500)
    }
}
