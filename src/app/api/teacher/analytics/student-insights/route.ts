import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { withPerformanceLogging } from "@/lib/performance";

export async function GET(req: Request) {
    return withPerformanceLogging("TEACHER_STUDENT_INSIGHTS", async () => {
        try {
            const session = await getSession();
            if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

            const cacheKey = `teacher_insights_${session.id}`;
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                return NextResponse.json({ success: true, data: cachedData });
            }

            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.id },
                select: {
                    id: true,
                    classes: {
                        where: { isActive: true },
                        select: { id: true, name: true, code: true }
                    }
                }
            });

            if (!teacher || teacher.classes.length === 0) {
                return NextResponse.json({ success: true, data: { topPerformers: [], attentionNeeded: [] } });
            }

            const classIds = teacher.classes.map(c => c.id);

            // Fetch students and their performance metrics in one go with selective fields
            const students = await prisma.student.findMany({
                where: {
                    classEnrollments: { some: { classId: { in: classIds }, status: "APPROVED" } }
                },
                select: {
                    id: true,
                    userId: true,
                    user: { select: { name: true, email: true, image: true } },
                    classEnrollments: {
                        where: { classId: { in: classIds }, status: "APPROVED" },
                        select: { classId: true }
                    },
                    attendances: {
                        where: { session: { classId: { in: classIds } } },
                        select: { status: true, session: { select: { classId: true } } }
                    },
                    submissions: {
                        where: { assignment: { classId: { in: classIds } } },
                        select: { status: true, marks: true, assignment: { select: { classId: true, totalMarks: true } } }
                    },
                    examAttempts: {
                        where: { exam: { classId: { in: classIds } }, status: "SUBMITTED" },
                        select: { percentage: true, obtainedMarks: true, totalMarks: true, exam: { select: { classId: true } } }
                    },
                    receivedRatings: {
                        where: { teacherId: teacher.id, classId: { in: classIds } },
                        select: { rating: true, feedback: true, classId: true }
                    },
                    externalExams: {
                        where: { classId: { in: classIds } },
                        select: { obtainedMarks: true, totalMarks: true, percentage: true, classId: true }
                    }
                }
            });

            interface StudentPerf {
                studentId: string;
                name: string;
                email: string;
                image?: string | null;
                classId: string;
                className: string;
                classCode: string;
                performanceRate: number;
                examAvg: number | null;
                attendanceRate: number;
                assignmentCompletion: number;
                rank: number;
                teacherRating?: { rating: number; feedback: string | null } | null;
            }

            const studentAggregator = new Map<string, any>();

            students.forEach(student => {
                const studentClassIds = student.classEnrollments.map(enr => enr.classId);
                const classNames = student.classEnrollments.map(enr => {
                    const cls = teacher.classes.find(c => c.id === enr.classId);
                    return cls?.name;
                }).filter(Boolean).join(", ");
                const classCodes = student.classEnrollments.map(enr => {
                    const cls = teacher.classes.find(c => c.id === enr.classId);
                    return cls?.code;
                }).filter(Boolean).join(", ");

                // Exam average across all classes
                const studentAttempts = student.examAttempts.filter(a => studentClassIds.includes(a.exam.classId));
                const examScores = studentAttempts.map((a: any) => {
                    if (a.percentage != null) return a.percentage;
                    if (a.obtainedMarks != null && a.totalMarks && a.totalMarks > 0)
                        return (a.obtainedMarks / a.totalMarks) * 100;
                    return null;
                }).filter((v: any) => v !== null) as number[];

                // Include external exams
                const externalAttempts = student.externalExams.filter((e: any) => studentClassIds.includes(e.classId));
                externalAttempts.forEach((e: any) => {
                    if (e.percentage != null) examScores.push(e.percentage);
                    else if (e.obtainedMarks != null && e.totalMarks && e.totalMarks > 0)
                        examScores.push((e.obtainedMarks / e.totalMarks) * 100);
                });

                const examAvg = examScores.length > 0
                    ? Math.round(examScores.reduce((s, v) => s + v, 0) / examScores.length * 10) / 10
                    : null;

                // Attendance rate across all classes
                const studentAttendances = student.attendances.filter(a => studentClassIds.includes(a.session.classId));
                const attendanceRate = studentAttendances.length > 0
                    ? Math.round(studentAttendances.filter(a => a.status === "PRESENT" || a.status === "LATE").length / studentAttendances.length * 1000) / 10
                    : 0;

                // Assignment Grade Average across all classes
                const studentSubmissions = student.submissions.filter(s => studentClassIds.includes(s.assignment.classId));
                const gradedSubs = studentSubmissions.filter(
                    (s: any) => s.status === "GRADED" && s.marks != null
                );
                const assignmentAvg = gradedSubs.length > 0
                    ? Math.round(gradedSubs.reduce((sum: number, s: any) => {
                        const total = s.assignment.totalMarks && s.assignment.totalMarks > 0 ? s.assignment.totalMarks : 100;
                        return sum + (s.marks / total) * 100;
                    }, 0) / gradedSubs.length * 10) / 10
                    : null;

                const subRate = studentSubmissions.length > 0
                    ? Math.round(studentSubmissions.filter(s => ["SUBMITTED", "GRADED", "LATE"].includes(s.status)).length / studentSubmissions.length * 100)
                    : 0;

                // Standardized Performance logic
                let performanceRate: number;
                if (examAvg !== null && assignmentAvg !== null) {
                    performanceRate = Math.round((examAvg * 0.5 + attendanceRate * 0.3 + assignmentAvg * 0.2) * 10) / 10;
                } else if (examAvg !== null) {
                    performanceRate = Math.round((examAvg * 0.7 + attendanceRate * 0.3) * 10) / 10;
                } else if (assignmentAvg !== null) {
                    performanceRate = Math.round((assignmentAvg * 0.7 + attendanceRate * 0.3) * 10) / 10;
                } else {
                    performanceRate = attendanceRate;
                }

                // Just take the first rating for now (or could aggregate)
                const teacherRating = student.receivedRatings[0];

                studentAggregator.set(student.id, {
                    studentId: student.id,
                    userId: student.userId, // Need to make sure userId is selected in findMany
                    name: student.user.name,
                    email: student.user.email,
                    image: student.user.image,
                    classId: "multiple",
                    className: classNames,
                    classCode: classCodes,
                    performanceRate,
                    examAvg,
                    attendanceRate,
                    assignmentCompletion: subRate,
                    rank: 0,
                    teacherRating: teacherRating ? { rating: teacherRating.rating, feedback: teacherRating.feedback } : null,
                });
            });

            const studentPerfs = Array.from(studentAggregator.values());

            const topPerformers = [...studentPerfs]
                .filter(s => s.performanceRate >= 80)
                .sort((a, b) => b.performanceRate - a.performanceRate)
                .map((s, i) => ({ ...s, rank: i + 1 }));

            const attentionNeeded = [...studentPerfs]
                .filter(s => s.performanceRate < 40)
                .sort((a, b) => a.performanceRate - b.performanceRate)
                .map(s => ({
                    ...s,
                    issues: [
                        (s.examAvg !== null && s.examAvg < 40 && s.examAvg > 0) ? "Low exam scores" : null,
                        s.attendanceRate < 50 ? "Poor attendance" : null,
                        s.examAvg === null ? "No exams attempted" : null,
                        s.assignmentCompletion < 50 ? "Missing assignments" : null
                    ].filter(Boolean)
                }));

            const finalData = { topPerformers, attentionNeeded };
            await cache.set(cacheKey, finalData, 300); // 5 minute cache

            return NextResponse.json({ success: true, data: finalData });

        } catch (error) {
            console.error("Student insights error:", error);
            return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
        }
    });
}
