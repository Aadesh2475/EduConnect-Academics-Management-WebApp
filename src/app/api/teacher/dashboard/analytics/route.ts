import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { format, subDays, getDay, getHours } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getSession();

        if (!session || session.role !== "TEACHER") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse date filters
        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        // Default to Current Month if no dates provided
        const now = new Date();
        const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const fromDate = fromParam ? new Date(fromParam) : defaultFrom;
        const toDate = toParam ? new Date(toParam) : defaultTo;

        // Heatmap always looks a bit further back if the range is small, but we will respect the bounds
        // For heatmap, if range is > 90 days, we might cap it to 90 days for performance, but let's use the provided range for now.
        const heatmapFromDate = fromDate;
        if (!session || session.role !== "TEACHER") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            include: {
                classes: {
                    where: { isActive: true },
                    select: { id: true, name: true }
                }
            }
        });

        if (!teacher) {
            return NextResponse.json({
                success: true,
                data: {
                    attendanceTrend: [],
                    activityDistribution: [],
                    heatmapData: {},
                    performanceTimeSeries: [],
                    totalStudents: 0,
                    performanceTrend: { todayAvg: null, yesterdayAvg: null }
                }
            });
        }

        const classIds = teacher.classes.map(c => c.id);

        // 1. ATTENDANCE TREND (Bar Chart - Using the Date Range)
        const attendanceSessions = await prisma.attendanceSession.findMany({
            where: {
                classId: { in: classIds },
                date: { gte: fromDate, lte: toDate }
            },
            include: {
                attendances: true,
                class: { select: { name: true } }
            },
            orderBy: { date: 'asc' }
        });

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const attendanceMap = new Map();
        daysOfWeek.forEach(day => {
            attendanceMap.set(day, { present: 0, classes: {} as Record<string, { present: number, absent: number }> });
        });

        attendanceSessions.forEach(session => {
            const dayStr = format(session.date, 'eee');
            if (attendanceMap.has(dayStr)) {
                const stats = attendanceMap.get(dayStr);

                const presentCount = session.attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
                const absentCount = session.attendances.filter(a => a.status === 'ABSENT').length;

                stats.present += presentCount;

                const className = session.class.name;
                if (!stats.classes[className]) {
                    stats.classes[className] = { present: 0, absent: 0 };
                }
                stats.classes[className].present += presentCount;
                stats.classes[className].absent += absentCount;
            }
        });

        const attendanceTrend = Array.from(attendanceMap.entries()).map(([day, stats]) => {
            const details = Object.entries(stats.classes).map(([name, counts]: [string, any]) => ({
                name,
                present: counts.present,
                absent: counts.absent
            }));

            return {
                day,
                value: stats.present,
                details
            };
        });


        // 2. ACTIVITY DISTRIBUTION (Gauge/Donut Chart)
        const [assignmentsCount, examsCount, announcementsCount, tasksCount, attendanceCount, studentRequestsCount, classesCount, eventsCount, materialsCount] = await Promise.all([
            prisma.assignment.count({ where: { classId: { in: classIds }, createdAt: { gte: fromDate, lte: toDate } } }),
            prisma.exam.count({ where: { classId: { in: classIds }, createdAt: { gte: fromDate, lte: toDate } } }),
            prisma.announcement.count({ where: { teacherId: teacher.id, createdAt: { gte: fromDate, lte: toDate } } }),
            prisma.task.count({ where: { userId: session.id, createdAt: { gte: fromDate, lte: toDate } } }),
            prisma.attendanceSession.count({ where: { classId: { in: classIds }, createdAt: { gte: fromDate, lte: toDate } } }),
            prisma.classEnrollment.count({ where: { classId: { in: classIds }, status: "PENDING", createdAt: { gte: fromDate, lte: toDate } } }),
            prisma.class.count({ where: { teacherId: teacher.id, createdAt: { gte: fromDate, lte: toDate } } }),
            prisma.event.count({ where: { createdBy: session.id, createdAt: { gte: fromDate, lte: toDate } } }),
            prisma.material.count({ where: { classId: { in: classIds }, createdAt: { gte: fromDate, lte: toDate } } })
        ]);

        const activityDistribution = [
            { name: 'Exams', value: examsCount },
            { name: 'Assignments', value: assignmentsCount },
            { name: 'Announcements', value: announcementsCount },
            { name: 'Tasks', value: tasksCount },
            { name: 'Attendance Reports', value: attendanceCount },
            { name: 'Student Requests', value: studentRequestsCount },
            { name: 'Classes Created', value: classesCount },
            { name: 'Events', value: eventsCount },
            { name: 'Materials', value: materialsCount }
        ];


        // 3. ACTIVITY HEATMAP (GitHub Style: Daily counts over 180 days)
        const heatmapStart = subDays(now, 180);
        const [
            recentAssignments, recentExams, recentAnnouncements, recentTasks, 
            recentClasses, recentEvents, recentMaterials,
            recentRatings, recentReports, recentContactReqs, recentIssues, recentCerts,
            recentExternalExams, recentAttendance
        ] = await Promise.all([
            prisma.assignment.findMany({ where: { classId: { in: classIds }, createdAt: { gte: heatmapStart, lte: now } }, select: { title: true, createdAt: true } }),
            prisma.exam.findMany({ where: { classId: { in: classIds }, createdAt: { gte: heatmapStart, lte: now } }, select: { title: true, createdAt: true } }),
            prisma.announcement.findMany({ where: { teacherId: teacher.id, createdAt: { gte: heatmapStart, lte: now } }, select: { title: true, createdAt: true } }),
            prisma.task.findMany({ where: { userId: session.id, createdAt: { gte: heatmapStart, lte: now } }, select: { title: true, createdAt: true } }),
            prisma.class.findMany({ where: { teacherId: teacher.id, createdAt: { gte: heatmapStart, lte: now } }, select: { name: true, createdAt: true } }),
            prisma.event.findMany({ where: { createdBy: session.id, createdAt: { gte: heatmapStart, lte: now } }, select: { title: true, createdAt: true } }),
            prisma.material.findMany({ where: { classId: { in: classIds }, createdAt: { gte: heatmapStart, lte: now } }, select: { title: true, createdAt: true } }),
            prisma.studentRating.findMany({ where: { teacherId: teacher.id, createdAt: { gte: heatmapStart, lte: now } }, select: { feedback: true, createdAt: true } }),
            prisma.studentReport.findMany({ where: { teacherId: teacher.id, createdAt: { gte: heatmapStart, lte: now } }, select: { reason: true, createdAt: true } }),
            prisma.parentalContactRequest.findMany({ where: { teacherId: teacher.id, createdAt: { gte: heatmapStart, lte: now } }, select: { reason: true, createdAt: true } }),
            prisma.studentIssue.findMany({ where: { teacherId: teacher.id, createdAt: { gte: heatmapStart, lte: now } }, select: { title: true, createdAt: true } }),
            prisma.certificate.findMany({ where: { teacherId: teacher.id, issueDate: { gte: heatmapStart, lte: now } }, select: { certificateNo: true, issueDate: true } }),
            prisma.externalExamReport.findMany({ where: { teacherId: teacher.id, createdAt: { gte: heatmapStart, lte: now } }, select: { testName: true, createdAt: true } }),
            prisma.attendanceSession.findMany({ where: { classId: { in: classIds }, createdAt: { gte: heatmapStart, lte: now } }, select: { class: { select: { name: true } }, createdAt: true } })
        ]);

        const heatmapMap = new Map();
        const allActivities = [
            ...recentAssignments.map(a => ({ type: 'Assignment', title: a.title, date: a.createdAt })),
            ...recentExams.map(e => ({ type: 'Exam', title: e.title, date: e.createdAt })),
            ...recentAnnouncements.map(a => ({ type: 'Announcement', title: a.title, date: a.createdAt })),
            ...recentTasks.map(t => ({ type: 'Task', title: t.title, date: t.createdAt })),
            ...recentClasses.map(c => ({ type: 'Class Created', title: c.name, date: c.createdAt })),
            ...recentEvents.map(e => ({ type: 'Event', title: e.title, date: e.createdAt })),
            ...recentMaterials.map(m => ({ type: 'Material', title: m.title, date: m.createdAt })),
            ...recentRatings.map(r => ({ type: 'Student Rating', title: r.feedback || 'New Rating', date: r.createdAt })),
            ...recentReports.map(r => ({ type: 'Student Report', title: r.reason, date: r.createdAt })),
            ...recentContactReqs.map(r => ({ type: 'Parental contact', title: r.reason, date: r.createdAt })),
            ...recentIssues.map(i => ({ type: 'Student Issue', title: i.title, date: i.createdAt })),
            ...recentCerts.map(c => ({ type: 'Certificate Issued', title: c.certificateNo, date: c.issueDate })),
            ...recentExternalExams.map(e => ({ type: 'Exam Report', title: e.testName || 'External Exam', date: e.createdAt })),
            ...recentAttendance.map(a => ({ type: 'Attendance Session', title: a.class?.name || 'Session', date: a.createdAt }))
        ];

        allActivities.forEach(act => {
            const hour = getHours(act.date);
            const dayOfWeek = getDay(act.date); // 0 (Sun) - 6 (Sat)
            const slotKey = `${hour}-${dayOfWeek}`;
            
            if (!heatmapMap.has(slotKey)) {
                heatmapMap.set(slotKey, { count: 0, activities: [] });
            }
            const dayData = heatmapMap.get(slotKey);
            dayData.count++;
            dayData.activities.push({
                type: act.type,
                title: act.title,
                date: format(act.date, 'MMM dd'),
                time: format(act.date, 'h:mm a')
            });
        });

        const heatmapData = Object.fromEntries(heatmapMap);

        // 4. STUDENT PERFORMANCE TIME SERIES & TREND
        const seriesStart = subDays(now, 30); // 30 day detailed view
        const submissions = await prisma.submission.findMany({
            where: {
                assignment: { classId: { in: classIds } },
                status: 'GRADED',
                submittedAt: { gte: subDays(now, 31), lte: now } // One extra day for trend
            },
            include: { assignment: { select: { totalMarks: true } } }
        });

        const performanceByDay = new Map();
        submissions.forEach(sub => {
            if (!sub.submittedAt) return;
            const dateKey = format(sub.submittedAt, 'yyyy-MM-dd');
            if (!performanceByDay.has(dateKey)) {
                performanceByDay.set(dateKey, []);
            }
            const marks = sub.marks ?? 0;
            const total = sub.assignment.totalMarks ?? 100;
            performanceByDay.get(dateKey).push((marks / total) * 100);
        });

        const todayKey = format(now, 'yyyy-MM-dd');
        const yesterdayKey = format(subDays(now, 1), 'yyyy-MM-dd');

        const getAvg = (key: string) => {
            const scores = performanceByDay.get(key) || [];
            if (scores.length === 0) return null;
            return scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        };

        const todayAvg = getAvg(todayKey);
        const yesterdayAvg = getAvg(yesterdayKey);

        const performanceTimeSeries = [];
        for (let i = 29; i >= 0; i--) {
            const d = subDays(now, i);
            const key = format(d, 'yyyy-MM-dd');
            const avg = getAvg(key);
            performanceTimeSeries.push({
                date: format(d, 'MMM dd'),
                classAverage: avg
            });
        }

        // Smooth nulls
        let lastKnownPerf = 50;
        performanceTimeSeries.forEach(p => {
            if (p.classAverage === null) p.classAverage = lastKnownPerf;
            else lastKnownPerf = p.classAverage;
        });

        const totalStudentsCount = await prisma.student.count({
            where: { classEnrollments: { some: { classId: { in: classIds }, status: 'APPROVED' } } }
        });

        return NextResponse.json({
            success: true,
            data: {
                attendanceTrend,
                activityDistribution,
                heatmapData,
                performanceTimeSeries,
                totalStudents: totalStudentsCount,
                performanceTrend: {
                    todayAvg: todayAvg ? Math.round(todayAvg) : null,
                    yesterdayAvg: yesterdayAvg ? Math.round(yesterdayAvg) : null
                }
            }
        });

    } catch (error) {
        console.error("Teacher dashboard analytics error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to load dashboard analytics" },
            { status: 500 }
        );
    }
}
