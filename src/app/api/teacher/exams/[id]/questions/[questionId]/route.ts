import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"
import { createNotifications } from "@/lib/notifications"

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403)
        }

        const { id: examId, questionId } = await params

        // Validate teacher ownership
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { class: true }
        })

        if (!exam) return errorResponse("Exam not found", 404)

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        })

        if (!teacher || exam.class.teacherId !== teacher.id) {
            return errorResponse("Access denied", 403)
        }

        // Get question to find marks
        const question = await prisma.question.findUnique({
            where: { id: questionId }
        })

        if (!question) return errorResponse("Question not found", 404)

        // Delete question
        await prisma.question.delete({
            where: { id: questionId }
        })

        // Update exam total marks
        await prisma.exam.update({
            where: { id: examId },
            data: {
                totalMarks: { decrement: question.marks }
            }
        })

        // Notify students
        if (exam.isActive) {
            const enrollments = await prisma.classEnrollment.findMany({
                where: { classId: exam.classId, status: "APPROVED" },
                include: { student: { select: { userId: true } } }
            })

            await createNotifications(enrollments.map(e => ({
                userId: e.student.userId,
                title: "Exam Updated",
                message: `A question has been removed from "${exam.title}" in ${exam.class.name}.`,
                type: "info",
                link: `/dashboard/student/quiz`
            })))
        }

        return NextResponse.json({ success: true, message: "Question deleted" })
    } catch (error) {
        console.error("Delete question error:", error)
        return errorResponse("Internal server error", 500)
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403)
        }

        const { id: examId, questionId } = await params
        const body = await req.json()

        // Validate teacher ownership
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { class: true }
        })

        if (!exam) return errorResponse("Exam not found", 404)

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        })

        if (!teacher || exam.class.teacherId !== teacher.id) {
            return errorResponse("Access denied", 403)
        }

        // Get original question to adjust marks
        const originalQuestion = await prisma.question.findUnique({
            where: { id: questionId }
        })

        if (!originalQuestion) return errorResponse("Question not found", 404)

        // Update question
        const updatedQuestion = await prisma.question.update({
            where: { id: questionId },
            data: {
                type: body.type,
                question: body.question,
                options: body.options ? JSON.stringify(body.options) : undefined,
                answer: body.answer,
                marks: body.marks ? parseInt(body.marks) : undefined,
                explanation: body.explanation,
                order: body.order
            }
        })

        // If marks changed, update exam total marks
        if (body.marks && parseInt(body.marks) !== originalQuestion.marks) {
            const markDiff = parseInt(body.marks) - originalQuestion.marks
            await prisma.exam.update({
                where: { id: examId },
                data: {
                    totalMarks: { increment: markDiff }
                }
            })
        }

        return NextResponse.json({ 
            success: true, 
            data: {
                ...updatedQuestion,
                options: updatedQuestion.options ? JSON.parse(updatedQuestion.options) : null
            } 
        })
    } catch (error) {
        console.error("Update question error:", error)
        return errorResponse("Internal server error", 500)
    }
}
