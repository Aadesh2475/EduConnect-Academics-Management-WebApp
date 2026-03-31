import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access only" },
        { status: 403 }
      );
    }

    // Get overall stats
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalAssignments,
      pendingEnrollments,
      openTickets,
      recentUsers,
      recentClasses,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count({ where: { isActive: true } }),
      prisma.assignment.count({ where: { isActive: true } }),
      prisma.classEnrollment.count({ where: { status: "PENDING" } }),
      prisma.helpTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.class.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          teacher: {
            include: { user: { select: { name: true } } }
          },
          _count: {
            select: { enrollments: { where: { status: "APPROVED" } } }
          }
        }
      }),
    ]);

    // Get user growth data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const usersByMonth = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      _count: true,
    });

    // Get user distribution by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // Get recent help tickets
    const recentTickets = await prisma.helpTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    // Get recent feedback
    const recentFeedback = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get recent audit logs
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        admin: {
          id: session.id,
          name: session.name,
          email: session.email,
        },
        stats: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalAssignments,
          pendingEnrollments,
          openTickets,
          totalUsers: totalStudents + totalTeachers + 1, // +1 for admin
        },
        recentUsers: recentUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        })),
        recentClasses: recentClasses.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code,
          subject: c.subject,
          department: c.department,
          teacherName: c.teacher.user.name,
          studentCount: c._count.enrollments,
          createdAt: c.createdAt,
        })),
        usersByRole: usersByRole.map(r => ({
          role: r.role,
          count: r._count,
        })),
        recentTickets: recentTickets.map(t => ({
          id: t.id,
          subject: t.subject,
          category: t.category,
          status: t.status,
          priority: t.priority,
          userName: t.user.name,
          userEmail: t.user.email,
          createdAt: t.createdAt,
        })),
        recentFeedback: recentFeedback.map(f => ({
          id: f.id,
          subject: f.subject,
          message: f.message,
          type: f.type,
          rating: f.rating,
          status: f.status,
          userName: f.user?.name || "Anonymous",
          createdAt: f.createdAt,
        })),
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt,
        })),
        auditLogs: auditLogs.map(l => ({
          id: l.id,
          action: l.action,
          entity: l.entity,
          entityId: l.entityId,
          createdAt: l.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
