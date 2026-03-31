import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { after } from "next/server"
import { withPerformanceLogging } from "@/lib/performance"

const err = (msg: string, status = 400) =>
    NextResponse.json({ success: false, error: msg }, { status })

// GET: fetch teacher's own tasks + optionally class-assigned tasks
export async function GET(req: NextRequest) {
    return withPerformanceLogging("GET_TEACHER_TASKS", async () => {
        try {
            const session = await getSession()
            if (!session || session.role !== "TEACHER") return err("Unauthorized", 401)

            // Personal tasks
            const tasks = await prisma.task.findMany({
                where: { userId: session.userId },
                orderBy: [{ status: "asc" }, { createdAt: "desc" }],
            })

            return NextResponse.json({ success: true, data: tasks })
        } catch (error) {
            console.error("[TEACHER_TASKS_GET]", error)
            return err("Internal server error", 500)
        }
    })
}

// POST: create a task
// If classId is provided → assign to each enrolled student + notify them
// Otherwise → create as teacher's personal task
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") return err("Unauthorized", 401)

        const body = await req.json()
        const { title, description, priority, dueDate, classId } = body

        if (!title?.trim()) return err("Title is required")

        if (classId) {
            // Fetch basic info synchronously
            const cls = await prisma.class.findUnique({
                where: { id: classId },
                select: { name: true, code: true }
            })

            // Create teacher's tracking task synchronously for immediate feedback
            const teacherTask = await prisma.task.create({
                data: {
                    userId: session.userId,
                    title: `[${cls?.code || "TASK"}] ${title}`,
                    description: description || null,
                    priority: priority || "MEDIUM",
                    dueDate: dueDate ? new Date(dueDate) : null,
                }
            })

            // Offload student task creation and notifications
            after(async () => {
                await withPerformanceLogging("MASS_TASK_ASSIGNMENT", async () => {
                    const enrollments = await prisma.classEnrollment.findMany({
                        where: { classId, status: "APPROVED" },
                        select: { student: { select: { userId: true } } }
                    })

                    if (enrollments.length > 0) {
                        const taskData = enrollments.map(e => ({
                            userId: e.student.userId,
                            title,
                            description: description || null,
                            priority: priority || "MEDIUM",
                            dueDate: dueDate ? new Date(dueDate) : null,
                            status: "TODO",
                        }))

                        await prisma.task.createMany({ data: taskData })

                        await prisma.notification.createMany({
                            data: enrollments.map(e => ({
                                userId: e.student.userId,
                                title: "New Task Assigned",
                                message: `A new task "${title}" has been assigned for ${cls?.name ?? "your class"}${dueDate ? ` — due ${new Date(dueDate).toLocaleDateString()}` : ""}.`,
                                type: "info",
                                link: "/dashboard/student/tasks",
                            }))
                        })
                    }

                    // Notify teacher
                    await prisma.notification.create({
                        data: {
                            userId: session.userId,
                            title: "Class Task Processed",
                            message: `Task "${title}" assigned to ${enrollments.length} students in ${cls?.name ?? "the class"}.`,
                            type: "success",
                            link: "/dashboard/teacher/tasks",
                        }
                    })
                }, { classId, studentsCount: 'unknown_initially' })
            })

            return NextResponse.json({
                success: true,
                data: teacherTask,
                status: "Processing mass assignment in background",
            })
        } else {
            // Personal task
            const task = await prisma.task.create({
                data: {
                    userId: session.userId,
                    title,
                    description: description || null,
                    priority: priority || "MEDIUM",
                    dueDate: dueDate ? new Date(dueDate) : null,
                }
            })
            return NextResponse.json({ success: true, data: task })
        }
    } catch (error) {
        console.error("[TEACHER_TASKS_POST]", error)
        return err("Internal server error", 500)
    }
}

// PUT: update task (status, title, priority, dueDate)
export async function PUT(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") return err("Unauthorized", 401)

        const body = await req.json()
        const { id, status, title, description, priority, dueDate } = body

        if (!id) return err("Task ID required")

        const existing = await prisma.task.findUnique({ where: { id } })
        if (!existing || existing.userId !== session.userId) return err("Not found", 404)

        const updated = await prisma.task.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(priority !== undefined && { priority }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(status !== undefined && {
                    status,
                    completedAt: status === "COMPLETED" ? new Date() : null,
                }),
            }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error("[TEACHER_TASKS_PUT]", error)
        return err("Internal server error", 500)
    }
}

// DELETE: delete task
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") return err("Unauthorized", 401)

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) return err("Task ID required")

        const existing = await prisma.task.findUnique({ where: { id } })
        if (!existing || existing.userId !== session.userId) return err("Not found", 404)

        await prisma.task.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[TEACHER_TASKS_DELETE]", error)
        return err("Internal server error", 500)
    }
}
