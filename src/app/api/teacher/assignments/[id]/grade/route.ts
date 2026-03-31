import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const assignmentId = params.id
        const { submissionId, grade, feedback } = await request.json()

        if (!assignmentId || !submissionId || grade === undefined) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id }
        })

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                assignment: {
                    include: { class: true }
                },
                student: {
                    include: { user: true }
                }
            }
        })

        if (!submission || !teacher || submission.assignment.class.teacherId !== teacher.id || submission.assignmentId !== assignmentId) {
            return NextResponse.json({ success: false, error: "Submission not found or unauthorized" }, { status: 404 })
        }

        const parsedGrade = parseFloat(grade)
        if (isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > submission.assignment.totalMarks) {
            return NextResponse.json({ success: false, error: `Grade must be between 0 and ${submission.assignment.totalMarks}` }, { status: 400 })
        }

        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                marks: parsedGrade,
                feedback: feedback || null,
                status: "GRADED",
                gradedAt: new Date()
            }
        })

        // Notify the student that their assignment has been graded
        await createNotification({
            userId: submission.student.user.id,
            title: "Assignment Graded",
            message: `Your assignment "${submission.assignment.title}" has been graded: ${parsedGrade}/${submission.assignment.totalMarks}.`,
            type: "success",
            link: `/dashboard/student/assignments`
        })

        return NextResponse.json({ success: true, data: updatedSubmission })
    } catch (error) {
        console.error("Error grading submission:", error)
        return NextResponse.json({ success: false, error: "Failed to grade submission" }, { status: 500 })
    }
}
