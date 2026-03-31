import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const type = searchParams.get("type")

        // Get teacher details to get their classes
        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId },
            include: { classes: true }
        })

        if (!teacher) {
            return new NextResponse("Teacher profile not found", { status: 404 })
        }

        const classIds = teacher.classes.map(c => c.id)

        // Build the query
        const whereClause: any = {
            createdBy: session.userId,
            type: { not: "personal" } // exclude personal events
        }

        if (type) {
            whereClause.type = type
        }

        // Fetch events created by this teacher (manual class/meeting events)
        const manualEvents = await prisma.event.findMany({
            where: whereClause,
            include: {
                class: {
                    select: { id: true, name: true, code: true }
                }
            }
        });

        // Fetch Assignments for the teacher's classes
        const assignments = await prisma.assignment.findMany({
            where: { class: { teacher: { userId: session.userId } } },
            include: { class: { select: { id: true, name: true, code: true } } }
        });

        // Fetch Exams for the teacher's classes
        const exams = await prisma.exam.findMany({
            where: { class: { teacher: { userId: session.userId } } },
            include: { class: { select: { id: true, name: true, code: true } } }
        });

        // Fetch Announcements for the teacher's classes
        const announcements = await prisma.announcement.findMany({
            where: { teacherId: teacher.id },
            include: { class: { select: { id: true, name: true, code: true } } }
        });

        // Fetch Tasks belonging to this teacher
        const tasks = await prisma.task.findMany({
            where: { userId: session.userId, dueDate: { not: null } }
        });

        // Map to CalendarEvent format
        const mappedAssignments = assignments.map(a => ({
            id: `assignment-${a.id}`,
            title: a.title,
            startDate: a.dueDate,
            endDate: a.dueDate,
            type: "assignment",
            description: a.description,
            class: a.class,
            isGlobal: false,
            isEditable: false,
        }));

        const mappedExams = exams.map(e => ({
            id: `exam-${e.id}`,
            title: e.title,
            startDate: e.startTime,
            endDate: e.endTime,
            type: "exam",
            description: `${e.duration} mins · ${e.type}`,
            class: e.class,
            isGlobal: false,
            isEditable: false,
        }));

        const mappedAnnouncements = announcements.map(a => ({
            id: `announcement-${a.id}`,
            title: a.title,
            startDate: a.createdAt,
            endDate: null,
            type: "announcement",
            description: a.content,
            class: a.class,
            isGlobal: a.isGlobal,
            isEditable: false,
        }));

        const mappedTasks = tasks.map(t => ({
            id: `task-${t.id}`,
            title: t.title,
            startDate: t.dueDate!,
            endDate: t.dueDate,
            type: "task",
            description: t.description || t.priority,
            class: null,
            isGlobal: false,
            isEditable: false,
        }));

        const mappedManual = manualEvents.map(e => ({
            ...e,
            isEditable: true,
        }));

        // Combine all events
        let allEvents = [...mappedManual, ...mappedAssignments, ...mappedExams, ...mappedAnnouncements, ...mappedTasks];

        // Sort by date ascending
        allEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        return NextResponse.json({
            events: allEvents,
            classes: teacher.classes
        })
    } catch (error) {
        console.error("[TEACHER_EVENTS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        console.log("[TEACHER_EVENTS_POST] Payload received:", body)
        const { title, description, type, startDate, endDate, allDay, location, color, classId, isGlobal } = body

        if (!title || !type || !startDate) {
            console.log("[TEACHER_EVENTS_POST] Missing required fields:", { title, type, startDate })
            return new NextResponse("Missing required fields", { status: 400 })
        }

        // Create the event
        const event = await prisma.event.create({
            data: {
                title,
                description,
                type,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                allDay: allDay || false,
                location,
                color,
                classId: classId || null,
                isGlobal: isGlobal || false,
                createdBy: session.userId
            } as any,
            include: {
                class: { select: { name: true } }
            } as any
        }) as any

        // Notify students
        let notifications: any[] = []

        if (classId) {
            const enrollments = await prisma.classEnrollment.findMany({
                where: { classId: classId, status: "APPROVED" },
                include: { student: { select: { userId: true } } }
            })
            notifications = enrollments.map(enrollment => ({
                userId: enrollment.student.userId,
                title: "New Class Event",
                message: `A new ${type} "${title}" has been scheduled for ${event.class?.name}.`,
                type: "info",
                link: "/dashboard/student/calendar"
            }))
        } else {
            const classes = await prisma.class.findMany({
                where: { teacher: { userId: session.userId } },
                select: { id: true }
            })
            const classIds = classes.map(c => c.id)
            const enrollments = await prisma.classEnrollment.findMany({
                where: { classId: { in: classIds }, status: "APPROVED" },
                include: { student: { select: { userId: true } } }
            })
            const uniqueStudentIds = Array.from(new Set(enrollments.map(e => e.student.userId)))
            notifications = uniqueStudentIds.map(userId => ({
                userId,
                title: "New Event",
                message: `A new ${type} "${title}" has been scheduled.`,
                type: "info",
                link: "/dashboard/student/calendar"
            }))
        }

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications })
        }

        return NextResponse.json({ ...event, isEditable: true })
    } catch (error) {
        console.error("[TEACHER_EVENTS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
