import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const { studentId } = await params;
        const { searchParams } = new URL(request.url);
        const view = searchParams.get("view") || "activity"; // activity | overview | monitoring

        const teacher = await prisma.teacher.findUnique({ where: { userId: session.id } });
        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

        // Validate teacher has this student in one of their classes
        const enrollment = await prisma.classEnrollment.findFirst({
            where: {
                studentId,
                status: "APPROVED",
                class: { teacherId: teacher.id }
            },
            include: { class: true }
        });

        if (!enrollment) {
            return NextResponse.json({ success: false, error: "Student not found in your classes" }, { status: 404 });
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                user: { select: { name: true, email: true, image: true } },
                classEnrollments: {
                    where: { status: "APPROVED", class: { teacherId: teacher.id } },
                    include: {
                        class: {
                            select: { id: true, name: true, code: true, subject: true }
                        }
                    }
                },
                submissions: {
                    include: { assignment: { select: { classId: true, totalMarks: true, title: true, dueDate: true } } },
                    orderBy: { submittedAt: "desc" }
                },
                examAttempts: {
                    where: { status: "SUBMITTED" },
                    include: { exam: { select: { classId: true, title: true, totalMarks: true } } },
                    orderBy: { submittedAt: "desc" }
                },
                attendances: {
                    include: { session: { select: { classId: true, date: true } } }
                },
                activityLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 100
                },
                receivedRatings: {
                    where: { teacherId: teacher.id },
                    select: { rating: true, feedback: true, classId: true }
                },
                studentIssues: {
                    select: { title: true, category: true, status: true, priority: true, createdAt: true }
                }
            }
        });

        if (!student) return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });

        const teacherClassIds = student.classEnrollments.map(e => e.class.id);
        const now = new Date();
        const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

        if (view === "activity") {
            // Last activity log
            const lastLog = student.activityLogs[0];
            const lastSeenAt = student.lastSeenAt;
            const lastActivity = lastLog?.createdAt || lastSeenAt;
            const isOnline = lastActivity
                ? (now.getTime() - new Date(lastActivity).getTime()) < ONLINE_THRESHOLD_MS
                : false;

            // Contributions
            const assignmentsSubmitted = student.submissions.filter(
                s => teacherClassIds.includes(s.assignment.classId) &&
                    (s.status === "SUBMITTED" || s.status === "GRADED" || s.status === "LATE")
            ).length;

            const examsSubmitted = student.examAttempts.filter(
                a => teacherClassIds.includes(a.exam.classId)
            ).length;

            // Tasks submitted (from Task table if we have studentId... tasks are userId-based)
            // We'll use activityLogs for task submissions
            const tasksSubmitted = student.activityLogs.filter(l => l.type === "TASK_SUBMIT").length;

            // Monthly attendance per class
            const monthlyAttendance: Record<string, { classId: string; className: string; rate: number }> = {};
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            for (const enr of student.classEnrollments) {
                const classAttendances = student.attendances.filter(a => {
                    const d = new Date(a.session.date);
                    return a.session.classId === enr.class.id &&
                        d.getMonth() === thisMonth && d.getFullYear() === thisYear;
                });
                const rate = classAttendances.length > 0
                    ? Math.round(classAttendances.filter(a => a.status === "PRESENT" || a.status === "LATE").length / classAttendances.length * 100)
                    : 0;
                monthlyAttendance[enr.class.id] = { classId: enr.class.id, className: enr.class.name, rate };
            }

            // Recent activity list
            const recentActivities = student.activityLogs.slice(0, 20).map(l => ({
                type: l.type,
                description: l.description,
                createdAt: l.createdAt.toISOString()
            }));

            return NextResponse.json({
                success: true,
                data: {
                    view: "activity",
                    student: { id: student.id, userId: student.userId, name: student.user.name, email: student.user.email, image: student.user.image },
                    isOnline,
                    lastActivity: lastActivity ? lastActivity.toISOString() : null,
                    assignmentsSubmitted,
                    tasksSubmitted,
                    examsSubmitted,
                    monthlyAttendance: Object.values(monthlyAttendance),
                    recentActivities,
                }
            });
        }

        if (view === "overview") {
            const subjectPerformance = student.classEnrollments.map(enr => {
                const cls = enr.class;
                // Exam avg: use percentage if available, else (obtainedMarks / exam.totalMarks) * 100
                const attempts = student.examAttempts.filter(
                    (a: any) => a.exam.classId === cls.id
                );
                const examScores = attempts.map((a: any) => {
                    if (a.percentage != null) return a.percentage;
                    if (a.obtainedMarks != null && a.exam.totalMarks && a.exam.totalMarks > 0)
                        return (a.obtainedMarks / a.exam.totalMarks) * 100;
                    return null;
                }).filter((v: any) => v !== null) as number[];
                const examAvg = examScores.length > 0
                    ? Math.round(examScores.reduce((s: number, v: number) => s + v, 0) / examScores.length * 10) / 10
                    : 0;

                // Attendance
                const classAttendances = student.attendances.filter((a: any) => a.session.classId === cls.id);
                const attendance = classAttendances.length > 0
                    ? Math.round(classAttendances.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length / classAttendances.length * 1000) / 10
                    : 0;

                // Assignments
                const submitted = student.submissions.filter(
                    (s: any) => s.assignment.classId === cls.id && (s.status === "SUBMITTED" || s.status === "GRADED" || s.status === "LATE")
                );
                const total = student.submissions.filter((s: any) => s.assignment.classId === cls.id);

                // Assignment avg: marks/totalMarks for each graded submission
                const gradedSubs = total.filter((s: any) => s.status === "GRADED" && s.marks != null);
                const assignmentAvg = gradedSubs.length > 0
                    ? Math.round(gradedSubs.reduce((sum: number, s: any) => {
                        const totalMarks = s.assignment.totalMarks && s.assignment.totalMarks > 0 ? s.assignment.totalMarks : 100;
                        return sum + (s.marks / totalMarks) * 100;
                    }, 0) / gradedSubs.length * 10) / 10
                    : 0;

                // Teacher rating for this class
                const rating = student.receivedRatings.find((r: any) => r.classId === cls.id);

                // Overall: examAvg * 0.5 + attendance * 0.3 + assignmentAvg * 0.2
                const overall = examAvg * 0.5 + attendance * 0.3 + assignmentAvg * 0.2;
                let remark = "Average";
                if (overall >= 80) remark = "Excellent";
                else if (overall < 40) remark = "Needs Attention";
                else if (overall >= 60) remark = "Good";

                return {
                    classId: cls.id,
                    className: cls.name,
                    subject: cls.subject,
                    examAvg,
                    attendance,
                    assignmentsSubmitted: submitted.length,
                    assignmentsTotal: total.length,
                    assignmentAvg,
                    overallPerformance: Math.round(overall * 10) / 10,
                    teacherRating: rating ? { rating: rating.rating, feedback: rating.feedback } : null,
                    remark,
                    email: student.user.email,
                };
            });

            return NextResponse.json({
                success: true,
                data: {
                    view: "overview",
                    student: { id: student.id, userId: student.userId, name: student.user.name, email: student.user.email, image: student.user.image },
                    subjectPerformance,
                }
            });
        }

        if (view === "monitoring") {
            const loginCount = await prisma.studentActivityLog.count({
                where: { studentId, type: "LOGIN" }
            });

            const loginThisMonth = await prisma.studentActivityLog.count({
                where: {
                    studentId,
                    type: "LOGIN",
                    createdAt: {
                        gte: new Date(now.getFullYear(), now.getMonth(), 1)
                    }
                }
            });

            const teacherInteractions = await prisma.studentActivityLog.count({
                where: { studentId, type: "TEACHER_MESSAGE" }
            });

            const libraryAccess = await prisma.studentActivityLog.count({
                where: { studentId, type: "LIBRARY_ACCESS" }
            });

            const complaints = (student.studentIssues || []).map(r => ({
                title: r.title,
                category: r.category,
                status: r.status,
                priority: r.priority,
                createdAt: r.createdAt.toISOString()
            }));
            const complaintsRaised = complaints.length;

            const assignmentsSubmitted = student.submissions.filter(
                s => teacherClassIds.includes(s.assignment.classId) &&
                    (s.status === "SUBMITTED" || s.status === "GRADED" || s.status === "LATE")
            ).length;
            const tasksSubmitted = await prisma.studentActivityLog.count({
                where: { studentId, type: "TASK_SUBMIT" }
            });
            const examsSubmitted = student.examAttempts.filter(a => teacherClassIds.includes(a.exam.classId)).length;

            const activityBreakdown = {
                LOGIN: loginCount,
                ASSIGNMENT_SUBMIT: await prisma.studentActivityLog.count({ where: { studentId, type: "ASSIGNMENT_SUBMIT" } }),
                EXAM_SUBMIT: await prisma.studentActivityLog.count({ where: { studentId, type: "EXAM_SUBMIT" } }),
                TASK_SUBMIT: tasksSubmitted,
                LIBRARY_ACCESS: libraryAccess,
                TEACHER_MESSAGE: teacherInteractions,
                COMPLAINT_RAISED: await prisma.studentActivityLog.count({ where: { studentId, type: "COMPLAINT_RAISED" } }),
            };

            return NextResponse.json({
                success: true,
                data: {
                    view: "monitoring",
                    student: { id: student.id, userId: student.userId, name: student.user.name, email: student.user.email, image: student.user.image },
                    loginCount, loginThisMonth, teacherInteractions, libraryAccess,
                    complaintsRaised, assignmentsSubmitted, tasksSubmitted, examsSubmitted,
                    activityBreakdown, complaints,
                }
            });
        }


        return NextResponse.json({ success: false, error: "Invalid view" }, { status: 400 });

    } catch (error) {
        console.error("Student detail error:", error);
        return NextResponse.json({ success: false, error: "Failed to load student details" }, { status: 500 });
    }
}
