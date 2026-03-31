import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const student = await prisma.student.findUnique({
            where: { userId: session.userId },
            include: {
                classEnrollments: {
                    where: { status: "APPROVED" },
                    include: {
                        class: {
                            select: {
                                id: true,
                                teacher: { select: { userId: true, id: true } }
                            }
                        }
                    }
                }
            }
        })

        if (!student) {
            return new NextResponse("Student profile not found", { status: 404 })
        }

        const enrolledClassIds = student.classEnrollments.map(e => e.class.id)
        const teacherUserIds = student.classEnrollments.map(e => e.class.teacher.userId)
        const teacherIds = student.classEnrollments.map(e => e.class.teacher.id)

        // Manual events visible to student
        const events = await prisma.event.findMany({
            where: {
                type: { not: "personal" },
                OR: [
                    { classId: { in: enrolledClassIds } },
                    { isGlobal: true },
                    { classId: null, createdBy: { in: teacherUserIds }, isGlobal: false }
                ]
            },
            include: {
                class: {
                    select: {
                        id: true, name: true, code: true,
                        teacher: { select: { user: { select: { name: true } } } }
                    }
                }
            }
        });

        // Assignments for enrolled classes
        const assignments = await prisma.assignment.findMany({
            where: { classId: { in: enrolledClassIds } },
            include: { class: { select: { id: true, name: true, code: true } } }
        });

        // Exams for enrolled classes
        const exams = await prisma.exam.findMany({
            where: { classId: { in: enrolledClassIds } },
            include: { class: { select: { id: true, name: true, code: true } } }
        });

        // Announcements for enrolled classes or from teachers
        const announcements = await prisma.announcement.findMany({
            where: {
                OR: [
                    { classId: { in: enrolledClassIds } },
                    { teacherId: { in: teacherIds }, classId: null },
                    { isGlobal: true }
                ]
            },
            include: { class: { select: { id: true, name: true, code: true } } }
        });

        // Student's own tasks with due dates
        const tasks = await prisma.task.findMany({
            where: { userId: session.userId, dueDate: { not: null } }
        });

        // Map to CalendarEvent format
        const mappedEvents = events.map(e => ({ ...e, isEditable: false }));

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

        let allEvents = [...mappedEvents, ...mappedAssignments, ...mappedExams, ...mappedAnnouncements, ...mappedTasks];
        allEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        return NextResponse.json(allEvents)
    } catch (error) {
        console.error("[STUDENT_EVENTS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
