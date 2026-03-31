import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { subDays, format, startOfMonth, eachDayOfInterval } from "date-fns";
import { cache } from "@/lib/cache";
import { withPerformanceLogging } from "@/lib/performance";
export async function GET(req: Request) {
    return withPerformanceLogging("TEACHER_ANALYTICS", async () => {
        try {
            const { searchParams } = new URL(req.url);
            const period = searchParams.get("period") || "semester";

            const session = await getSession();
            if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

            const cacheKey = `teacher_analytics_${session.id}_${period}`;
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                return NextResponse.json({ success: true, data: cachedData });
            }

            // Determine date range
            const now = new Date();
            let fromDate: Date;
            switch (period) {
                case "week":
                    fromDate = new Date(now); fromDate.setDate(now.getDate() - 7); break;
                case "month":
                    fromDate = new Date(now); fromDate.setMonth(now.getMonth() - 1); break;
                case "year":
                    fromDate = new Date(now); fromDate.setFullYear(now.getFullYear() - 1); break;
                default: // semester ~ 6 months
                    fromDate = new Date(now); fromDate.setMonth(now.getMonth() - 6); break;
            }

        // Get teacher's class IDs
        const teacherClasses = await prisma.class.findMany({
            where: { teacher: { userId: session.id } },
            select: { id: true, name: true, code: true }
        });
        const classIds = teacherClasses.map(c => c.id);

        if (classIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    overview: { totalStudents: 0, averageAttendance: 0, averageGrade: 0, assignmentCompletion: 0, trend: "up", trendValue: 0 },
                    classPerformance: [], gradeDistribution: [], attendanceTrend: [], topPerformers: [], atRiskStudents: []
                }
            });
        }

        // ── Overview Stats (Optimized) ───────────────────────────────────────────────
        const [
            totalStudents,
            attendanceCounts,
            gradeStats,
            totalSubmissions,
            classDetails
        ] = await Promise.all([
            prisma.classEnrollment.findMany({
                where: { classId: { in: classIds }, status: "APPROVED" },
                select: { studentId: true }
            }).then(enrs => new Set(enrs.map(e => e.studentId)).size),
            prisma.attendance.groupBy({
                by: ["status"],
                where: { session: { classId: { in: classIds }, date: { gte: fromDate } } },
                _count: true
            }),
            prisma.examAttempt.findMany({
                where: { exam: { classId: { in: classIds } }, status: "SUBMITTED", submittedAt: { gte: fromDate } },
                select: { percentage: true, obtainedMarks: true, totalMarks: true }
            }),
            prisma.submission.count({
                where: { assignment: { classId: { in: classIds } }, status: { in: ["SUBMITTED", "GRADED", "LATE"] }, submittedAt: { gte: fromDate } }
            }),
            prisma.class.findMany({
                where: { id: { in: classIds } },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    _count: {
                        select: {
                            enrollments: { where: { status: "APPROVED" } },
                            assignments: { where: { createdAt: { gte: fromDate } } }
                        }
                    }
                }
            })
        ]);

        // Calculate average attendance
        const totalAttendanceRecords = attendanceCounts.reduce((sum, item) => sum + item._count, 0);
        const presentCount = attendanceCounts
            .filter(item => item.status === "PRESENT" || item.status === "LATE")
            .reduce((sum, item) => sum + item._count, 0);
        const averageAttendance = totalAttendanceRecords > 0
            ? Math.round((presentCount / totalAttendanceRecords) * 1000) / 10
            : 0;

        // Compute exam avg using obtainedMarks/totalMarks when percentage is missing
        const examScores = (gradeStats as any[]).map((a: any) => {
            if (a.percentage != null) return a.percentage;
            if (a.obtainedMarks != null && a.totalMarks && a.totalMarks > 0) return (a.obtainedMarks / a.totalMarks) * 100;
            return null;
        }).filter((v: any) => v !== null) as number[];
        const averageGrade = examScores.length > 0
            ? Math.round(examScores.reduce((s, v) => s + v, 0) / examScores.length * 10) / 10
            : 0;

        // Calculate expected total submissions (enrollments * assignments per class)
        const expectedSubmissions = classDetails.reduce((sum, cls) => sum + (cls._count.enrollments * cls._count.assignments), 0);
        const assignmentCompletion = expectedSubmissions > 0
            ? Math.round((totalSubmissions / expectedSubmissions) * 1000) / 10
            : 0;

        // ── Class-wise Summary (Optimized) ───────────────────────────────────────────
        // We'll use the already fetched classDetails and add specific metrics
        const classPerformance = await Promise.all(classDetails.map(async (cls) => {
            const [clsAttendance, clsGrades, clsSubmissions] = await Promise.all([
                prisma.attendance.groupBy({
                    by: ["status"],
                    where: { session: { classId: cls.id, date: { gte: fromDate } } },
                    _count: true
                }),
                prisma.examAttempt.findMany({
                    where: { exam: { classId: cls.id }, status: "SUBMITTED", submittedAt: { gte: fromDate } },
                    select: { percentage: true, obtainedMarks: true, totalMarks: true }
                }),
                prisma.submission.count({
                    where: { assignment: { classId: cls.id }, status: { in: ["SUBMITTED", "GRADED", "LATE"] }, submittedAt: { gte: fromDate } }
                })
            ]);

            const clsTotalAtt = clsAttendance.reduce((s, i) => s + i._count, 0);
            const clsPresent = clsAttendance
                .filter(i => i.status === "PRESENT" || i.status === "LATE")
                .reduce((s, i) => s + i._count, 0);
            
            const clsExpectedSub = cls._count.enrollments * cls._count.assignments;

            // Compute per-class exam avg properly
            const clsExamScores = (clsGrades as any[]).map((a: any) => {
                if (a.percentage != null) return a.percentage;
                if (a.obtainedMarks != null && a.totalMarks && a.totalMarks > 0) return (a.obtainedMarks / a.totalMarks) * 100;
                return null;
            }).filter((v: any) => v !== null) as number[];
            const clsAvgGrade = clsExamScores.length > 0
                ? Math.round(clsExamScores.reduce((s: number, v: number) => s + v, 0) / clsExamScores.length * 10) / 10
                : 0;

            return {
                className: `${cls.name} (${cls.code})`,
                students: cls._count.enrollments,
                avgGrade: clsAvgGrade,
                attendance: clsTotalAtt > 0 ? Math.round((clsPresent / clsTotalAtt) * 1000) / 10 : 0,
                completion: clsExpectedSub > 0 ? Math.round((clsSubmissions / clsExpectedSub) * 1000) / 10 : 0,
            };
        }));

        // ── Grade Distribution (Optimized) ──────────────────────────────────────────
        const examAttempts = await prisma.examAttempt.findMany({
            where: { exam: { classId: { in: classIds } }, status: "SUBMITTED" },
            select: { percentage: true, obtainedMarks: true, totalMarks: true }
        });

        const gradeBuckets = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        examAttempts.forEach((attempt: any) => {
            let pct: number;
            if (attempt.percentage != null) {
                pct = attempt.percentage;
            } else if (attempt.obtainedMarks != null && attempt.totalMarks && attempt.totalMarks > 0) {
                pct = (attempt.obtainedMarks / attempt.totalMarks) * 100;
            } else {
                pct = 0;
            }
            if (pct >= 90) gradeBuckets.A++;
            else if (pct >= 80) gradeBuckets.B++;
            else if (pct >= 70) gradeBuckets.C++;
            else if (pct >= 60) gradeBuckets.D++;
            else gradeBuckets.F++;
        });

        const totalGraded = examAttempts.length;
        const gradeDistribution = [
            { grade: "A (90-100)", count: gradeBuckets.A, percentage: totalGraded > 0 ? Math.round((gradeBuckets.A / totalGraded) * 100) : 0 },
            { grade: "B (80-89)", count: gradeBuckets.B, percentage: totalGraded > 0 ? Math.round((gradeBuckets.B / totalGraded) * 100) : 0 },
            { grade: "C (70-79)", count: gradeBuckets.C, percentage: totalGraded > 0 ? Math.round((gradeBuckets.C / totalGraded) * 100) : 0 },
            { grade: "D (60-69)", count: gradeBuckets.D, percentage: totalGraded > 0 ? Math.round((gradeBuckets.D / totalGraded) * 100) : 0 },
            { grade: "F (<60)", count: gradeBuckets.F, percentage: totalGraded > 0 ? Math.round((gradeBuckets.F / totalGraded) * 100) : 0 },
        ];

        // ── Attendance Trend (Optimized) ─────────────────────────────────────────────
        const attendanceTrend: { week: string; rate: number }[] = [];
        let intervals = 6;
        let intervalType = "week";

        if (period === "week") { intervals = 7; intervalType = "day"; }
        else if (period === "month") { intervals = 4; intervalType = "week"; }
        else if (period === "semester") { intervals = 6; intervalType = "month"; }
        else if (period === "year") { intervals = 12; intervalType = "month"; }

        const trendData = await Promise.all(Array.from({ length: intervals }).map(async (_, i) => {
            const index = intervals - 1 - i;
            const start = new Date(now);
            const end = new Date(now);
            let label = "";

            if (intervalType === "day") {
                start.setDate(now.getDate() - (index + 1));
                end.setDate(now.getDate() - index);
                label = start.toLocaleDateString('en-US', { weekday: 'short' });
            } else if (intervalType === "week") {
                start.setDate(now.getDate() - (index + 1) * 7);
                end.setDate(now.getDate() - index * 7);
                label = `W${intervals - index}`;
            } else if (intervalType === "month") {
                start.setMonth(now.getMonth() - (index + 1));
                end.setMonth(now.getMonth() - index);
                label = start.toLocaleDateString('en-US', { month: 'short' });
            }

            const counts = await prisma.attendance.groupBy({
                by: ["status"],
                where: { session: { classId: { in: classIds }, date: { gte: start, lt: end } } },
                _count: true
            });

            const total = counts.reduce((acc: number, curr: any) => acc + curr._count, 0);
            const present = counts.filter((c: any) => c.status === "PRESENT" || c.status === "LATE").reduce((acc: number, curr: any) => acc + curr._count, 0);
            
            return { week: label, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
        }));

        attendanceTrend.push(...trendData);

        // ── Top Performers & At-Risk Students (Optimized) ───────────────────────────
        const studentPerformanceData = await prisma.student.findMany({
            where: {
                classEnrollments: {
                    some: { classId: { in: classIds }, status: "APPROVED" }
                }
            },
            select: {
                id: true,
                user: { select: { name: true } },
                classEnrollments: {
                    where: { classId: { in: classIds }, status: "APPROVED" },
                    select: { class: { select: { code: true, id: true } } }
                },
                examAttempts: {
                    where: { exam: { classId: { in: classIds } }, status: "SUBMITTED" },
                    select: { percentage: true, exam: { select: { classId: true } } }
                },
                attendances: {
                    where: { session: { classId: { in: classIds }, date: { gte: fromDate } } },
                    select: { status: true, session: { select: { classId: true } } }
                },
                submissions: {
                    where: { assignment: { classId: { in: classIds } }, createdAt: { gte: fromDate } },
                    select: { status: true, assignment: { select: { classId: true } } }
                }
            }
        });

        const studentStats = studentPerformanceData.map(student => {
            // Aggregate metrics across ALL teacher's classes for this student
            const studentClassIds = student.classEnrollments.map(enr => enr.class.id);
            const classCodes = student.classEnrollments.map(enr => enr.class.code).join(", ");
            
            // Grades for ALL teacher's classes
            const studentAttempts = student.examAttempts.filter((a: any) => studentClassIds.includes(a.exam.classId));
            const avgGrade = studentAttempts.length > 0
                ? Math.round(studentAttempts.reduce((s: number, a: any) => s + (a.percentage || 0), 0) / studentAttempts.length * 10) / 10
                : 0;

            // Attendance for ALL teacher's classes
            const studentAtts = student.attendances.filter((a: any) => studentClassIds.includes(a.session.classId));
            const attRate = studentAtts.length > 0
                ? Math.round(studentAtts.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length / studentAtts.length * 1000) / 10
                : 0;

            // Assignments for ALL teacher's classes
            const studentSubs = student.submissions.filter((s: any) => studentClassIds.includes(s.assignment.classId));
            const subRate = studentSubs.length > 0
                ? Math.round(studentSubs.filter((s: any) => ["SUBMITTED", "GRADED", "LATE"].includes(s.status)).length / studentSubs.length * 100)
                : 100;

            return {
                name: student.user.name,
                class: classCodes,
                grade: avgGrade,
                attendance: attRate,
                subRate
            };
        });

        const topPerformers = [...studentStats]
            .sort((a, b) => b.grade - a.grade)
            .slice(0, 5)
            .map(s => ({ name: s.name, class: s.class, grade: s.grade, attendance: s.attendance }));

        const atRiskStudents = studentStats
            .filter(s => s.attendance < 70 || s.subRate < 60 || (s.grade > 0 && s.grade < 60))
            .slice(0, 5)
            .map(s => ({
                name: s.name,
                class: s.class,
                issue: s.attendance < 70 ? "Low attendance" : s.subRate < 60 ? "Missing assignments" : "Low grades",
                grade: s.grade
            }));

        // ── STUDENT PERFORMANCE TIME SERIES (Area Chart Data) ────────────────────────
        // Aggregate graded submissions AND exam attempts for the timeline
        const allStudentsForTimeSeries = await prisma.student.findMany({
            where: { classEnrollments: { some: { classId: { in: classIds }, status: 'APPROVED' } } },
            include: {
                submissions: {
                    where: {
                        assignment: { classId: { in: classIds } },
                        status: 'GRADED',
                        submittedAt: { gte: fromDate, lte: new Date() }
                    },
                    include: { assignment: { select: { totalMarks: true } } }
                },
                examAttempts: {
                    where: {
                        exam: { classId: { in: classIds } },
                        status: 'SUBMITTED',
                        submittedAt: { gte: fromDate, lte: new Date() }
                    },
                    select: { percentage: true, obtainedMarks: true, totalMarks: true, submittedAt: true }
                }
            }
        });

        const timeSeriesMap = new Map<string, { date: string, classAverage: number[] }>();

        // Generate daily buckets for the current month
        const monthStart = startOfMonth(now);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: now });

        daysInMonth.forEach(day => {
            const dateStr = format(day, 'MMM dd');
            timeSeriesMap.set(dateStr, { date: dateStr, classAverage: [] });
        });

        const findBucket = (submittedAt: Date): string | null => {
            const dateStr = format(submittedAt, 'MMM dd');
            return timeSeriesMap.has(dateStr) ? dateStr : null;
        };

        allStudentsForTimeSeries.forEach((student: any) => {
            // Assignment submissions
            student.submissions.forEach((sub: any) => {
                if (!sub.submittedAt) return;
                const bucketKey = findBucket(sub.submittedAt);
                if (bucketKey) {
                    const bucket = timeSeriesMap.get(bucketKey);
                    if (bucket) {
                        const marks = typeof sub.marks === 'number' ? sub.marks : 0;
                        const totalMarks = typeof sub.assignment.totalMarks === 'number' ? sub.assignment.totalMarks : 100;
                        bucket.classAverage.push(totalMarks > 0 ? (marks / totalMarks) * 100 : 0);
                    }
                }
            });
            // Exam attempts
            student.examAttempts.forEach((attempt: any) => {
                if (!attempt.submittedAt) return;
                const bucketKey = findBucket(attempt.submittedAt);
                if (bucketKey) {
                    const bucket = timeSeriesMap.get(bucketKey);
                    if (bucket) {
                        let pct: number;
                        if (attempt.percentage != null) pct = attempt.percentage;
                        else if (attempt.obtainedMarks != null && attempt.totalMarks > 0) pct = (attempt.obtainedMarks / attempt.totalMarks) * 100;
                        else pct = 0;
                        bucket.classAverage.push(pct);
                    }
                }
            });
        });

        const performanceTimeSeries = Array.from(timeSeriesMap.values()).map(bucket => {
            const result: { date: string, classAverage: number | null } = { date: bucket.date, classAverage: null };
            const scores = bucket.classAverage;

            if (scores.length > 0) {
                result.classAverage = Math.round(scores.reduce((acc: number, curr: number) => acc + curr, 0) / scores.length);
            }
            return result;
        });

        // ── PERFORMANCE TREND (Today vs Yesterday) ──────────────────────────────────
        // Only using the last 2 days for the delta badge
        const submissionsForTrend = await prisma.submission.findMany({
            where: {
                assignment: { classId: { in: classIds } },
                status: 'GRADED',
                submittedAt: { gte: subDays(now, 2) }
            },
            include: { assignment: { select: { totalMarks: true } } }
        });

        const trendByDay = new Map<string, number[]>();
        submissionsForTrend.forEach(sub => {
            if (!sub.submittedAt) return;
            const dateKey = format(sub.submittedAt, 'yyyy-MM-dd');
            if (!trendByDay.has(dateKey)) trendByDay.set(dateKey, []);
            const marks = sub.marks ?? 0;
            const total = sub.assignment.totalMarks ?? 100;
            trendByDay.get(dateKey)!.push((marks / total) * 100);
        });

        const tTodayKey = format(now, 'yyyy-MM-dd');
        const tYesterdayKey = format(subDays(now, 1), 'yyyy-MM-dd');

        const getTrAvg = (key: string) => {
            const scores = trendByDay.get(key) || [];
            return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        };

        const todayAvg = getTrAvg(tTodayKey);
        const yesterdayAvg = getTrAvg(tYesterdayKey);

        const finalData = {
            overview: {
                totalStudents,
                averageAttendance,
                averageGrade,
                assignmentCompletion,
                trend: averageGrade >= 60 ? "up" : "down",
                trendValue: (todayAvg && yesterdayAvg) ? todayAvg - yesterdayAvg : 0,
            },
            classPerformance,
            gradeDistribution,
            attendanceTrend,
            performanceTimeSeries,
            topPerformers,
            atRiskStudents,
            performanceTrend: {
                todayAvg,
                yesterdayAvg
            }
        };

        await cache.set(cacheKey, finalData, 300); // 5 minute cache

        return NextResponse.json({
            success: true,
            data: finalData
        });

        } catch (error) {
            console.error("Teacher analytics error:", error);
            return NextResponse.json({ success: false, error: "Failed to load analytics" }, { status: 500 });
        }
    });
}
