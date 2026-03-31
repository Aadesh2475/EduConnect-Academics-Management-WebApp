import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/helpers";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403);
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId },
            include: {
                classes: {
                    select: { id: true }
                }
            }
        });

        if (!teacher) {
            return errorResponse("Teacher profile not found", 404);
        }

        const classIds = teacher.classes.map(c => c.id);

        // Fetch students enrolled in these classes with extra info for better data
        const enrollments = await prisma.classEnrollment.findMany({
            where: {
                classId: { in: classIds },
                status: "APPROVED",
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            }
                        },
                        submissions: {
                            include: {
                                assignment: {
                                    select: { totalMarks: true }
                                }
                            }
                        },
                        attendances: true,
                        receivedRatings: {
                            where: { teacherId: teacher.id },
                            take: 1,
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        assignments: {
                            select: { id: true }
                        }
                    }
                }
            },
            orderBy: {
                student: {
                    user: {
                        name: "asc"
                    }
                }
            }
        });

        // Group by student and include their classes
        const studentsMap = new Map();

        enrollments.forEach(en => {
            if (!studentsMap.has(en.studentId)) {
                // Calculate performance
                const studentSubmissions = en.student.submissions || [];
                let totalMarksObtained = 0;
                let totalPossibleMarks = 0;
                let gradedSubmissionsCount = 0;

                studentSubmissions.forEach(sub => {
                    if (sub.status === "GRADED" && sub.marks !== null) {
                        totalMarksObtained += sub.marks;
                        totalPossibleMarks += sub.assignment.totalMarks;
                        gradedSubmissionsCount++;
                    }
                });

                const performance = totalPossibleMarks > 0
                    ? Math.round((totalMarksObtained / totalPossibleMarks) * 100)
                    : 0;

                // Calculate attendance
                const studentAttendances = en.student.attendances || [];
                const attendedCount = studentAttendances.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
                const totalAttendanceSessions = studentAttendances.length;
                const attendanceRate = totalAttendanceSessions > 0
                    ? Math.round((attendedCount / totalAttendanceSessions) * 100)
                    : 100; // Default to 100 if no sessions found

                // Calculate progress (graded assignments vs total assignments in those classes)
                // This is a bit simplified: total assignments across ALL classes the student is in
                const studentClassIds = enrollments.filter(e => e.studentId === en.studentId).map(e => e.classId);
                const totalAssignmentsCount = enrollments
                    .filter(e => e.studentId === en.studentId)
                    .reduce((acc, e) => acc + e.class.assignments.length, 0);

                const progress = totalAssignmentsCount > 0
                    ? Math.round((gradedSubmissionsCount / totalAssignmentsCount) * 100)
                    : 0;

                studentsMap.set(en.studentId, {
                    id: en.studentId,
                    userId: en.student.user.id,
                    name: en.student.user.name,
                    email: en.student.user.email,
                    image: en.student.user.image,
                    enrollmentNo: en.student.enrollmentNo,
                    department: en.student.department,
                    semester: en.student.semester,
                    classes: [],
                    attendanceRate,
                    performance,
                    progress,
                    rating: en.student.receivedRatings[0]?.rating || 0,
                    feedback: en.student.receivedRatings[0]?.feedback || "",
                    lastActive: "Today" // Mock for now
                });
            }
            studentsMap.get(en.studentId).classes.push(en.class.name);
        });

        const studentList = Array.from(studentsMap.values());

        return NextResponse.json({ success: true, data: studentList });
    } catch (error) {
        console.error("Fetch teacher students error:", error);
        return errorResponse("Internal server error", 500);
    }
}
