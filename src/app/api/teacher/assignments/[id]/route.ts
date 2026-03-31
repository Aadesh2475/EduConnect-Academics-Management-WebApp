import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

export async function GET(
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
        if (!assignmentId) return NextResponse.json({ success: false, error: "Assignment ID required" }, { status: 400 })

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                class: {
                    select: { name: true, code: true, teacherId: true }
                },
                submissions: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: { name: true, image: true, email: true }
                                }
                            }
                        }
                    },
                    orderBy: {
                        submittedAt: 'desc'
                    }
                }
            }
        })

        if (!assignment) {
            return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 })
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id }
        })

        if (!teacher || assignment.class.teacherId !== teacher.id) {
            return NextResponse.json({ success: false, error: "Unauthorized access to assignment" }, { status: 403 })
        }

        // Total students calculation
        const totalStudents = await prisma.classEnrollment.count({
            where: { classId: assignment.classId, status: "APPROVED" }
        })

        const transformedData = {
            ...assignment,
            totalStudents,
            submissions: assignment.submissions.map(sub => ({
                id: sub.id,
                studentId: sub.studentId,
                studentName: sub.student.user.name,
                studentEmail: sub.student.user.email,
                studentImage: sub.student.user.image,
                content: sub.content,
                attachments: sub.attachments ? JSON.parse(sub.attachments) : null,
                submittedAt: sub.submittedAt,
                status: sub.status,
                grade: sub.marks,
                feedback: sub.feedback,
                gradedAt: sub.gradedAt
            }))
        }

        return NextResponse.json({ success: true, data: transformedData })
    } catch (error) {
        console.error("Error fetching assignment:", error)
        return NextResponse.json({ success: false, error: "Failed to fetch assignment" }, { status: 500 })
    }
}

export async function PATCH(
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
        if (!assignmentId) return NextResponse.json({ success: false, error: "Assignment ID required" }, { status: 400 })

        const body = await request.json()

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            select: { id: true }
        })

        const existing = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { class: { select: { teacherId: true } } }
        })

        if (!existing || existing.class.teacherId !== teacher?.id) {
            return NextResponse.json({ success: false, error: "Assignment not found or unauthorized" }, { status: 404 })
        }

        const updateData: any = {}
        if (body.title) updateData.title = body.title
        if (body.description) updateData.description = body.description
        if (body.instructions) updateData.instructions = body.instructions
        if (body.dueDate) updateData.dueDate = new Date(body.dueDate)
        if (body.totalMarks) updateData.totalMarks = parseInt(body.totalMarks)
        if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive

        const assignment = await prisma.assignment.update({
            where: { id: assignmentId },
            data: updateData
        })

        return NextResponse.json({ success: true, data: assignment })
    } catch (error) {
        console.error("Error updating assignment:", error)
        return NextResponse.json({ success: false, error: "Failed to update assignment" }, { status: 500 })
    }
}

export async function DELETE(
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
        if (!assignmentId) return NextResponse.json({ success: false, error: "Assignment ID required" }, { status: 400 })

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            select: { id: true }
        })

        const existing = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { class: { select: { teacherId: true } } }
        })

        if (!existing || existing.class.teacherId !== teacher?.id) {
            return NextResponse.json({ success: false, error: "Assignment not found or unauthorized" }, { status: 404 })
        }

        await prisma.assignment.delete({
            where: { id: assignmentId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting assignment:", error)
        return NextResponse.json({ success: false, error: "Failed to delete assignment" }, { status: 500 })
    }
}
