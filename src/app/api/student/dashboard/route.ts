import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { withPerformanceLogging } from "@/lib/performance";

export async function GET() {
  return withPerformanceLogging("STUDENT_DASHBOARD", async () => {
    try {
      const session = await getSession();

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      if (session.role !== "STUDENT") {
        return NextResponse.json(
          { success: false, error: "Forbidden - Student access only" },
          { status: 403 }
        );
      }

      const cacheKey = `student_dashboard_${session.id}`;
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json({ success: true, data: cachedData });
      }
// ... rest of the code

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.id },
      include: {
        classEnrollments: {
          where: { status: "APPROVED" },
          include: {
            class: {
              include: {
                teacher: {
                  include: { user: { select: { name: true } } }
                },
                _count: {
                  select: {
                    enrollments: { where: { status: "APPROVED" } },
                    assignments: true,
                    materials: true,
                  }
                }
              }
            }
          }
        },
        submissions: {
          where: { status: "PENDING" },
          include: { assignment: { select: { title: true, dueDate: true } } }
        },
        examAttempts: true,
        attendances: { where: { status: "PRESENT" } },
      }
    });

    // Get total number of classes enrolled
    const enrolledClassIds = student?.classEnrollments.map(e => e.classId) || [];

    // Get upcoming assignments
    const upcomingAssignments = enrolledClassIds.length > 0 ? await prisma.assignment.findMany({
      where: {
        classId: { in: enrolledClassIds },
        dueDate: { gte: new Date() },
        isActive: true,
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        class: { select: { name: true, subject: true } }
      }
    }) : [];

    // Get upcoming exams
    const upcomingExams = enrolledClassIds.length > 0 ? await prisma.exam.findMany({
      where: {
        classId: { in: enrolledClassIds },
        startTime: { gte: new Date() },
        isActive: true,
      },
      orderBy: { startTime: "asc" },
      take: 5,
      include: {
        class: { select: { name: true, subject: true } }
      }
    }) : [];

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get announcements from enrolled classes
    const announcements = enrolledClassIds.length > 0 ? await prisma.announcement.findMany({
      where: {
        OR: [
          { classId: { in: enrolledClassIds } },
          { isGlobal: true }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } }
      }
    }) : await prisma.announcement.findMany({
      where: { isGlobal: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } }
      }
    });

    // Calculate stats
    const totalClasses = student?.classEnrollments.length || 0;
    const pendingSubmissions = student?.submissions.length || 0;

    // Calculate attendance rate
    const totalAttendanceSessions = enrolledClassIds.length > 0 ? await prisma.attendanceSession.count({
      where: { classId: { in: enrolledClassIds } }
    }) : 0;
    const attendedSessions = student?.attendances.length || 0;
    const attendanceRate = totalAttendanceSessions > 0
      ? Math.round((attendedSessions / totalAttendanceSessions) * 100)
      : 0;

    // Get performance data
    const performance = await prisma.performance.findMany({
      where: { studentId: student?.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 6,
    });

      const finalData = {
        student: {
          id: student?.id,
          name: session.name,
          email: session.email,
          enrollmentNo: student?.enrollmentNo,
          department: student?.department,
          semester: student?.semester,
          section: student?.section,
          batch: student?.batch,
          phone: student?.phone,
        },
        stats: {
          totalClasses,
          pendingSubmissions,
          upcomingExams: upcomingExams.length,
          attendanceRate,
        },
        classes: student?.classEnrollments.map(e => ({
          id: e.class.id,
          name: e.class.name,
          code: e.class.code,
          subject: e.class.subject,
          department: e.class.department,
          teacherName: e.class.teacher.user.name,
          studentCount: e.class._count.enrollments,
          assignmentCount: e.class._count.assignments,
          materialCount: e.class._count.materials,
          joinedAt: e.joinedAt,
        })) || [],
        upcomingAssignments: upcomingAssignments.map(a => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate,
          className: a.class.name,
          subject: a.class.subject,
          totalMarks: a.totalMarks,
        })),
        upcomingExams: upcomingExams.map(e => ({
          id: e.id,
          title: e.title,
          type: e.type,
          startTime: e.startTime,
          duration: e.duration,
          className: e.class.name,
          subject: e.class.subject,
        })),
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt,
        })),
        announcements: announcements.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          priority: a.priority,
          className: a.class?.name || "Global",
          teacherName: a.teacher.user.name,
          createdAt: a.createdAt,
        })),
        performance: performance.map(p => ({
          month: p.month,
          year: p.year,
          attendanceRate: p.attendanceRate,
          assignmentRate: p.assignmentRate,
          examAverage: p.examAverage,
          overallScore: p.overallScore,
        })),
      };

      await cache.set(cacheKey, finalData, 300); // 5 minute cache

      return NextResponse.json({
        success: true,
        data: finalData,
      });
    } catch (error) {
      console.error("Student dashboard error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to load dashboard data" },
        { status: 500 }
      );
    }
  });
}
