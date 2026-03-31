import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const classFilter = searchParams.get("classId") || "all";
        const search = searchParams.get("search") || "";

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            include: {
                classes: {
                    where: { isActive: true },
                    include: {
                        enrollments: {
                            where: { status: "APPROVED" },
                            include: {
                                student: {
                                    include: {
                                        user: { select: { name: true, email: true, image: true } },
                                        attendances: {
                                            include: { session: { select: { classId: true } } }
                                        },
                                        submissions: {
                                            include: { assignment: { select: { classId: true, totalMarks: true } } }
                                        },
                                        examAttempts: {
                                            where: { status: "SUBMITTED" },
                                            select: {
                                                percentage: true,
                                                obtainedMarks: true,
                                                totalMarks: true,
                                                exam: { select: { classId: true } }
                                            }
                                        },
                                        activityLogs: {
                                            orderBy: { createdAt: "desc" },
                                            take: 1,
                                            select: { createdAt: true, type: true }
                                        },
                                        receivedRatings: {
                                            select: { rating: true, teacherId: true, classId: true, feedback: true }
                                        },
                                        externalExams: {
                                            select: { obtainedMarks: true, totalMarks: true, percentage: true, classId: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!teacher) {
            return NextResponse.json({ success: true, data: { students: [], classes: [] } });
        }

        const now = new Date();
        const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

        const studentAggregator = new Map<string, any>();

        for (const cls of teacher.classes) {
            if (classFilter !== "all" && cls.id !== classFilter) continue;

            for (const enr of cls.enrollments) {
                const student = enr.student;

                if (search && !student.user.name.toLowerCase().includes(search.toLowerCase()) &&
                    !student.user.email.toLowerCase().includes(search.toLowerCase())) {
                    continue;
                }

                if (!studentAggregator.has(student.id)) {
                    studentAggregator.set(student.id, {
                        studentId: student.id,
                        userId: student.userId,
                        name: student.user.name,
                        email: student.user.email,
                        image: student.user.image,
                        classes: [],
                        examScores: [],
                        totalAttended: 0,
                        totalSessions: 0,
                        totalSubmissions: 0,
                        gradedSubsCount: 0,
                        totalSubScore: 0,
                        activityLogs: student.activityLogs
                    });
                }

                const agg = studentAggregator.get(student.id);
                agg.classes.push({ id: cls.id, name: cls.name, code: cls.code });

                // Exam scores for this class
                const attempts = student.examAttempts.filter((a: any) => a.exam.classId === cls.id);
                attempts.forEach((a: any) => {
                    if (a.percentage != null) agg.examScores.push(a.percentage);
                    else if (a.obtainedMarks != null && a.totalMarks && a.totalMarks > 0)
                        agg.examScores.push((a.obtainedMarks / a.totalMarks) * 100);
                });

                // External exams
                const externalAttempts = student.externalExams.filter((e: any) => e.classId === cls.id);
                externalAttempts.forEach((e: any) => {
                    if (e.percentage != null) agg.examScores.push(e.percentage);
                    else if (e.obtainedMarks != null && e.totalMarks && e.totalMarks > 0)
                        agg.examScores.push((e.obtainedMarks / e.totalMarks) * 100);
                });

                // Attendance
                const classAttendances = student.attendances.filter((a: any) => a.session.classId === cls.id);
                agg.totalAttended += classAttendances.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length;
                agg.totalSessions += classAttendances.length;

                // Submissions
                const classSubmissions = student.submissions.filter((s: any) => s.assignment.classId === cls.id);
                agg.totalSubmissions += classSubmissions.filter((s: any) => ["SUBMITTED", "GRADED", "LATE"].includes(s.status)).length;
                
                const gradedSubs = classSubmissions.filter((s: any) => s.status === "GRADED" && s.marks != null);
                gradedSubs.forEach((s: any) => {
                    const total = s.assignment.totalMarks && s.assignment.totalMarks > 0 ? s.assignment.totalMarks : 100;
                    agg.totalSubScore += (s.marks / total) * 100;
                    agg.gradedSubsCount++;
                });

                // Rating (just take the first one found or aggregate if needed - here we take the first for simplicity)
                if (!agg.teacherRating) {
                    const rating = student.receivedRatings.find((r: any) => r.teacherId === teacher.id && r.classId === cls.id);
                    if (rating) agg.teacherRating = { rating: rating.rating, feedback: rating.feedback };
                }
            }
        }

        const students = Array.from(studentAggregator.values()).map(agg => {
            const examAvg = agg.examScores.length > 0 ? Math.round(agg.examScores.reduce((s: number, v: number) => s + v, 0) / agg.examScores.length * 10) / 10 : null;
            const attendanceRate = agg.totalSessions > 0 ? Math.round(agg.totalAttended / agg.totalSessions * 1000) / 10 : 0;
            const assignmentAvg = agg.gradedSubsCount > 0 ? Math.round(agg.totalSubScore / agg.gradedSubsCount * 10) / 10 : null;

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

            const lastLog = agg.activityLogs[0];
            const lastActivity = lastLog?.createdAt; // simplified
            const isOnline = lastActivity ? (now.getTime() - new Date(lastActivity).getTime()) < ONLINE_THRESHOLD_MS : false;

            let remark = "Average";
            if (performanceRate >= 80) remark = "Excellent";
            else if (performanceRate < 40) remark = "Needs Attention";
            else if (performanceRate >= 60) remark = "Good";

            return {
                studentId: agg.studentId,
                userId: agg.userId,
                name: agg.name,
                email: agg.email,
                image: agg.image,
                classId: classFilter === "all" ? "multiple" : agg.classes[0].id,
                className: classFilter === "all" ? agg.classes.map((c: any) => c.name).join(", ") : agg.classes[0].name,
                classCode: classFilter === "all" ? agg.classes.map((c: any) => c.code).join(", ") : agg.classes[0].code,
                examAvg: examAvg || 0,
                attendanceRate,
                assignmentAvg,
                assignmentCompletion: agg.totalSubmissions,
                performanceRate,
                isOnline,
                lastActivity: lastActivity ? lastActivity.toISOString() : null,
                remark,
                teacherRating: agg.teacherRating || null
            };
        });

        const classes = teacher.classes.map((c: any) => ({ id: c.id, name: c.name, code: c.code }));

        return NextResponse.json({ success: true, data: { students, classes } });

    } catch (error) {
        console.error("Class performance error:", error);
        return NextResponse.json({ success: false, error: "Failed to load class performance" }, { status: 500 });
    }
}
