import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/library - Get materials for user's classes
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return errorResponse("Unauthorized", 401)

        let classIds: string[] = []

        if (session.role === "TEACHER") {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.userId },
                include: { classes: { select: { id: true } } },
            })
            if (!teacher) return errorResponse("Teacher not found", 404)
            classIds = teacher.classes.map((c) => c.id)
        } else if (session.role === "STUDENT") {
            const student = await prisma.student.findUnique({
                where: { userId: session.userId },
                include: {
                    classEnrollments: {
                        where: { status: "APPROVED" },
                        select: { classId: true },
                    },
                },
            })
            if (!student) return errorResponse("Student not found", 404)
            classIds = student.classEnrollments.map((e) => e.classId)
        } else {
            return errorResponse("Forbidden", 403)
        }

        if (classIds.length === 0) {
            return NextResponse.json({ success: true, data: [], classes: [] })
        }

        const materials = await prisma.material.findMany({
            where: { classId: { in: classIds } },
            include: {
                class: {
                    select: { id: true, name: true, code: true },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        // Also return classes for the upload dropdown
        const classes = await prisma.class.findMany({
            where: { id: { in: classIds } },
            select: { id: true, name: true, code: true },
        })

        return NextResponse.json({
            success: true,
            data: materials.map((m) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                type: m.type,
                url: m.url,
                className: m.class.name,
                classCode: m.class.code,
                classId: m.classId,
                uploadedAt: m.createdAt,
            })),
            classes,
        })
    } catch (error) {
        console.error("Library GET error:", error)
        return errorResponse("Internal server error", 500)
    }
}

// POST /api/library - Upload a new material
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return errorResponse("Unauthorized", 401)
        if (session.role !== "TEACHER" && session.role !== "STUDENT") {
            return errorResponse("Forbidden", 403)
        }

        const body = await req.json()
        const { title, description, type, url, classId } = body

        if (!title || !classId || !type) {
            return errorResponse("Title, type, and class are required", 400)
        }

        // Verify user has access to this class
        if (session.role === "TEACHER") {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.userId },
                include: { classes: { where: { id: classId }, select: { id: true } } },
            })
            if (!teacher || teacher.classes.length === 0) {
                return errorResponse("You don't have access to this class", 403)
            }
        } else {
            const enrollment = await prisma.classEnrollment.findFirst({
                where: {
                    student: { userId: session.userId },
                    classId,
                    status: "APPROVED",
                },
            })
            if (!enrollment) {
                return errorResponse("You are not enrolled in this class", 403)
            }
        }

        const material = await prisma.material.create({
            data: {
                title,
                description: description || null,
                type,
                url: url || null,
                classId,
            },
            include: {
                class: { select: { name: true, code: true } },
            },
        })

        // 3. Notify students if it's a teacher upload
        if (session.role === "TEACHER") {
            try {
                const { createNotifications } = await import("@/lib/notifications")
                const enrolledStudents = await prisma.classEnrollment.findMany({
                    where: { classId, status: "APPROVED" },
                    select: { student: { select: { userId: true } } },
                })

                if (enrolledStudents.length > 0) {
                    await createNotifications(
                        enrolledStudents.map((enrollment) => ({
                            userId: enrollment.student.userId,
                            title: "New Material Uploaded",
                            message: `${session.name || "A teacher"} uploaded new material "${title}" to your class "${material.class.name}".`,
                            type: "info",
                            link: "/dashboard/student/library",
                        }))
                    )
                }
            } catch (notifyErr) {
                console.error("Failed to send library notifications:", notifyErr)
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                id: material.id,
                title: material.title,
                description: material.description,
                type: material.type,
                url: material.url,
                className: material.class.name,
                classCode: material.class.code,
                classId: material.classId,
                uploadedAt: material.createdAt,
            },
        })
    } catch (error) {
        console.error("Library POST error:", error)
        return errorResponse("Internal server error", 500)
    }
}

// DELETE /api/library - Delete a material
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return errorResponse("Unauthorized", 401)

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) return errorResponse("Material ID required", 400)

        const material = await prisma.material.findUnique({
            where: { id },
            include: { class: { select: { teacherId: true } } },
        })

        if (!material) return errorResponse("Material not found", 404)

        // Teachers of the class can delete any material; others can verify ownership
        if (session.role === "TEACHER") {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.userId },
            })
            if (!teacher || material.class.teacherId !== teacher.id) {
                return errorResponse("Forbidden", 403)
            }
        } else if (session.role === "STUDENT") {
            // Students cannot delete materials (only teachers can)
            return errorResponse("Only teachers can delete materials", 403)
        }

        await prisma.material.delete({ where: { id } })

        return NextResponse.json({ success: true, message: "Material deleted" })
    } catch (error) {
        console.error("Library DELETE error:", error)
        return errorResponse("Internal server error", 500)
    }
}
