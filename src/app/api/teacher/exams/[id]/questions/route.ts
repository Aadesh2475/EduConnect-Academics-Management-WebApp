import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"
import { createNotifications } from "@/lib/notifications"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403)
        }

        const { id: examId } = await params
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

        // Create question
        const question = await prisma.question.create({
            data: {
                examId,
                type: body.type,
                question: body.question,
                options: body.options ? JSON.stringify(body.options) : undefined,
                answer: body.answer,
                marks: parseInt(body.marks),
                explanation: body.explanation,
                order: (await prisma.question.count({ where: { examId } })) + 1
            }
        })

        // Update exam total marks and question count (if stored, but schema calculates dynamically or we should update exam metadata if valid)
        // Verify schema: Exam has `totalMarks` field. We should update it.
        await prisma.exam.update({
            where: { id: examId },
            data: {
                totalMarks: { increment: question.marks }
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
                message: `New questions added to "${exam.title}" in ${exam.class.name}.`,
                type: "info",
                link: `/dashboard/student/quiz`
            })))
        }

        return NextResponse.json({ 
            success: true, 
            data: {
                ...question,
                options: question.options ? JSON.parse(question.options) : null
            } 
        })
    } catch (error) {
        console.error("Add question error:", error)
        return errorResponse("Internal server error", 500)
    }
}
