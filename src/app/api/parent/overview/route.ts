import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { cache } from "@/lib/cache";
import { withPerformanceLogging } from "@/lib/performance";

export async function GET(req: Request) {
    return withPerformanceLogging("PARENT_OVERVIEW", async () => {
        try {
            const session = await getSession()
            if (!session || session.role !== "PARENT") {
                return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
            }

            const cacheKey = `parent_overview_${session.id}`;
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                return NextResponse.json({ success: true, data: cachedData });
            }

            const parentRecord = await prisma.parent.findUnique({
                where: { userId: session.id },
                select: { id: true }
            });

            if (!parentRecord) {
                return NextResponse.json({ success: false, error: "Parent profile not found" }, { status: 404 })
            }

            const students = await prisma.student.findMany({
                where: { parentId: parentRecord.id },
                include: {
                    user: { select: { name: true, image: true, email: true } },
                    classEnrollments: {
                        where: { status: "APPROVED" },
                        include: {
                            class: {
                                include: {
                                    assignments: {
                                        where: { dueDate: { gte: new Date() } },
                                        orderBy: { dueDate: 'asc' },
                                        take: 3
                                    },
                                    exams: {
                                        where: { startTime: { gte: new Date() } },
                                        orderBy: { startTime: 'asc' },
                                        take: 3
                                    }
                                }
                            }
                        }
                    },
                    attendances: {
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    },
                    submissions: {
                        orderBy: { submittedAt: 'desc' },
                        take: 5,
                        include: { assignment: true }
                    }
                }
            });

            // Format data: return the list of students with their respective aggregated data.
            const studentsData = students.map((student: any) => {
                const classes = student.classEnrollments.map((ce: any) => ce.class);

                const upcomingAssignments = classes.flatMap((c: any) =>
                    c.assignments.map((a: any) => ({ ...a, className: c.name }))
                ).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);

                const upcomingExams = classes.flatMap((c: any) =>
                    c.exams.map((e: any) => ({ ...e, className: c.name }))
                ).sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 5);

                return {
                    id: student.id,
                    name: student.user.name,
                    email: student.user.email,
                    image: student.user.image,
                    enrollmentNo: student.enrollmentNo,
                    department: student.department,
                    semester: student.semester,
                    points: student.points,
                    currentStreak: student.currentStreak,
                    upcomingAssignments,
                    upcomingExams,
                    recentAttendances: student.attendances,
                    recentSubmissions: student.submissions.map((sub: any) => ({
                        id: sub.id,
                        assignmentTitle: sub.assignment.title,
                        status: sub.status,
                        submittedAt: sub.submittedAt,
                        grade: sub.marks // Map 'marks' to 'grade' as per original logic or common naming
                    }))
                };
            });

            const finalData = { students: studentsData };
            await cache.set(cacheKey, finalData, 300); // 5 minute cache

            return NextResponse.json({ success: true, data: finalData })
        } catch (error) {
            console.error("[PARENT_OVERVIEW_GET]", error);
            return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
        }
    });
}
