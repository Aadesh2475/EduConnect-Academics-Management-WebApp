import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"
import { createNotification } from "@/lib/notifications"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "STUDENT") {
            return errorResponse("Forbidden", 403)
        }

        const { id: examId } = await params
        const { answers } = await request.json() // { questionId: answer }

        const student = await prisma.student.findUnique({
            where: { userId: session.userId }
        })

        if (!student) return errorResponse("Student profile not found", 404)

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { questions: true }
        })

        if (!exam) return errorResponse("Exam not found", 404)

        const attempt = await prisma.examAttempt.findUnique({
            where: {
                examId_studentId: {
                    examId,
                    studentId: student.id,
                }
            }
        })

        if (!attempt || attempt.status !== "IN_PROGRESS") {
            return errorResponse("No active attempt found for this exam", 400)
        }

        // Calculate marks
        let obtainedMarks = 0
        const questionAnswers: {
            questionId: string
            answer: string
            isCorrect: boolean
            marksAwarded: number
        }[] = []

        for (const question of exam.questions) {
            const studentAnswer = answers[question.id]
            const isCorrect = studentAnswer === question.answer
            const marksAwarded = isCorrect ? question.marks : 0
            obtainedMarks += marksAwarded

            questionAnswers.push({
                questionId: question.id,
                answer: studentAnswer || "",
                isCorrect,
                marksAwarded,
            })
        }

        const percentage = (obtainedMarks / exam.totalMarks) * 100

        // Update attempt and create question answers
        const updatedAttempt = await prisma.$transaction(async (tx) => {
            // Create detailed answers
            for (const qa of questionAnswers) {
                await tx.questionAnswer.upsert({
                    where: {
                        attemptId_questionId: {
                            attemptId: attempt.id,
                            questionId: qa.questionId,
                        }
                    },
                    update: qa,
                    create: {
                        ...qa,
                        attemptId: attempt.id,
                    }
                })
            }

            // Update attempt status
            return tx.examAttempt.update({
                where: { id: attempt.id },
                data: {
                    submittedAt: new Date(),
                    obtainedMarks,
                    percentage,
                    status: "GRADED", // Since it's objective, we can grade immediately
                }
            })
        })

        // Notify student
        await createNotification({
            userId: session.userId,
            title: "Exam Submitted",
            message: `You have successfully submitted "${exam.title}". Score: ${obtainedMarks}/${exam.totalMarks}`,
            type: "success",
            link: `/dashboard/student/quiz`
        })

        return NextResponse.json({ success: true, data: updatedAttempt })
    } catch (error) {
        console.error("Submit exam error:", error)
        return errorResponse("Internal server error", 500)
    }
}
