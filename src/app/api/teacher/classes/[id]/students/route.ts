import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const { id } = await params;

        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        });

        if (!teacher) {
            return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 });
        }

        const enrollments = await prisma.classEnrollment.findMany({
            where: {
                classId: id,
                class: { teacherId: teacher.id },
                status: "APPROVED"
            },
            include: {
                student: {
                    include: {
                        user: { select: { name: true, email: true, image: true, id: true } },
                        attendances: {
                            where: { session: { classId: id } },
                            select: { status: true }
                        },
                        submissions: {
                            where: { assignment: { classId: id }, status: "GRADED" },
                            select: { marks: true, assignment: { select: { totalMarks: true } } }
                        },
                        examAttempts: {
                            where: { exam: { classId: id }, status: "GRADED" },
                            select: { percentage: true }
                        }
                    }
                }
            },
            orderBy: {
                student: { user: { name: "asc" } }
            }
        });

        const totalSessions = await prisma.attendanceSession.count({
            where: { classId: id }
        });

        const students = enrollments.map((e: any) => {
            const student = e.student;

            // Calculate Attendance Rate
            const presentCount = student.attendances.filter((a: any) => a.status === "PRESENT").length;
            const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null;

            // Calculate Grade Average
            const assignmentGrades = student.submissions.map((s: any) => (s.marks / s.assignment.totalMarks) * 100);
            const examGrades = student.examAttempts.map((ea: any) => ea.percentage);
            const allGrades = [...assignmentGrades, ...examGrades];
            const averageScore = allGrades.length > 0
                ? Math.round(allGrades.reduce((a, b) => a + b, 0) / allGrades.length)
                : null;

            return {
                id: student.id,
                userId: student.user.id,
                name: student.user.name,
                email: student.user.email,
                image: student.user.image,
                department: student.department,
                semester: student.semester,
                batch: student.batch,
                lastSeen: student.lastSeenAt,
                performance: {
                    overallScore: averageScore,
                    attendanceRate: attendanceRate
                },
                joinedAt: e.joinedAt || e.createdAt
            };
        });

        return NextResponse.json({ success: true, data: students });

    } catch (error) {
        console.error("Error fetching class students:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch class students" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const { id } = await params;

        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json({ success: false, error: "Student ID target required" }, { status: 400 });
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        });

        if (!teacher) {
            return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 });
        }

        // Verify class ownership
        const classData = await prisma.class.findUnique({
            where: { id, teacherId: teacher.id }
        });

        if (!classData) {
            return NextResponse.json({ success: false, error: "Class not found or unauthorized" }, { status: 404 });
        }

        // Delete the enrollment
        await prisma.classEnrollment.delete({
            where: {
                classId_studentId: {
                    classId: id,
                    studentId: studentId
                }
            }
        });

        return NextResponse.json({ success: true, message: "Student removed successfully" });

    } catch (error) {
        console.error("Error removing student:", error);
        return NextResponse.json({ success: false, error: "Failed to remove student" }, { status: 500 });
    }
}
