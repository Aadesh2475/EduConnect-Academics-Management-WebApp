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

    if (session.role !== "TEACHER") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Teacher access only" },
        { status: 403 }
      );
    }

    // Get teacher profile with classes
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.id },
      include: {
        classes: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                enrollments: { where: { status: "APPROVED" } },
                assignments: true,
                exams: true,
                materials: true,
              }
            },
            enrollments: {
              where: { status: "APPROVED" },
              take: 5,
              include: {
                student: {
                  include: { user: { select: { name: true, email: true, image: true } } }
                }
              }
            }
          }
        },
        announcements: {
          orderBy: { createdAt: "desc" },
          take: 5,
        }
      }
    });

    if (!teacher) {
      return NextResponse.json({
        success: true,
        data: {
          teacher: {
            id: null,
            name: session.name,
            email: session.email,
            department: null,
            subject: null,
            university: null,
          },
          stats: {
            totalClasses: 0,
            totalStudents: 0,
            pendingSubmissions: 0,
            upcomingExams: 0,
          },
          classes: [],
          recentSubmissions: [],
          upcomingExams: [],
          announcements: [],
          notifications: [],
        },
      });
    }

    const classIds = teacher.classes.map(c => c.id);

    // Get missing submissions count
    let missingSubmissionsCount = 0;
    if (classIds.length > 0) {
      // 1. Find all active assignments in these classes
      const assignments = await prisma.assignment.findMany({
        where: { classId: { in: classIds }, isActive: true },
        select: { id: true, classId: true }
      });

      // 2. Map assignment IDs
      const assignmentIds = assignments.map(a => a.id);

      if (assignmentIds.length > 0) {
        // 3. For each class, how many students are enrolled?
        const classEnrollmentCounts = new Map<string, number>();
        teacher.classes.forEach(c => {
          classEnrollmentCounts.set(c.id, c._count.enrollments);
        });

        // 4. Calculate total expected submissions (Enrolled Students * Assignments in that class)
        let totalExpectedSubmissions = 0;
        assignments.forEach(a => {
          const enrolledCount = classEnrollmentCounts.get(a.classId) || 0;
          totalExpectedSubmissions += enrolledCount;
        });

        // 5. Calculate total actual submissions for these assignments (regardless of status or late)
        const actualSubmissions = await prisma.submission.count({
          where: { assignmentId: { in: assignmentIds } }
        });

        missingSubmissionsCount = Math.max(0, totalExpectedSubmissions - actualSubmissions);
      }
    }

    // Get recent submissions
    const recentSubmissions = classIds.length > 0 ? await prisma.submission.findMany({
      where: {
        assignment: { classId: { in: classIds } },
        status: { in: ["SUBMITTED", "PENDING"] },
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
      include: {
        assignment: { select: { title: true, totalMarks: true } },
        student: {
          include: { user: { select: { name: true, email: true } } }
        }
      }
    }) : [];

    // Get upcoming exams
    const upcomingExams = classIds.length > 0 ? await prisma.exam.findMany({
      where: {
        classId: { in: classIds },
        endTime: { gte: new Date() },
        isActive: true,
      },
      orderBy: { startTime: "asc" },
      take: 5,
      include: {
        class: { select: { name: true, subject: true } },
        _count: { select: { attempts: true } }
      }
    }) : [];

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // --- ENHANCED ACTIVITY LOGIC ---
    // 1. Get Teacher Tasks
    const teacherTasks = await prisma.task.findMany({
      where: { userId: session.id, status: { not: "COMPLETED" } },
      orderBy: { dueDate: "asc" },
      take: 20
    });

    // 2. Get Live/Upcoming Assignments
    const assignments = classIds.length > 0 ? await prisma.assignment.findMany({
      where: { 
        classId: { in: classIds },
        isActive: true,
        dueDate: { gte: new Date() }
      },
      include: { class: { select: { name: true, code: true } } },
      orderBy: { dueDate: "asc" },
      take: 20
    }) : [];

    // 3. Structured Activity List (Upcoming, Pending, Live)
    const activities: any[] = [];

    // Add Live Exams
    upcomingExams.forEach(exam => {
      const now = new Date();
      const start = new Date(exam.startTime);
      const end = new Date(exam.endTime);
      if (now >= start && now <= end) {
        activities.push({
          id: exam.id,
          type: "EXAM",
          title: exam.title,
          status: "LIVE",
          dueDate: exam.endTime,
          className: exam.class.name,
          classCode: exam.id.substring(0, 4), // Fallback if no code
          description: `${exam._count.attempts} attempts so far`
        });
      } else if (start > now) {
        activities.push({
          id: exam.id,
          type: "EXAM",
          title: exam.title,
          status: "UPCOMING",
          dueDate: exam.startTime,
          className: exam.class.name,
          classCode: exam.id.substring(0, 4),
          description: `Starts in ${Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60))} hours`
        });
      }
    });

    // Add Upcoming Assignments
    assignments.forEach(assign => {
      activities.push({
        id: assign.id,
        type: "ASSIGNMENT",
        title: assign.title,
        status: "UPCOMING",
        dueDate: assign.dueDate,
        className: assign.class.name,
        classCode: assign.class.code,
        description: `Due soon`
      });
    });

    // Add Pending Tasks
    teacherTasks.forEach(task => {
      activities.push({
        id: task.id,
        type: "TASK",
        title: task.title,
        status: "PENDING",
        dueDate: task.dueDate,
        className: "Personal",
        classCode: "TASK",
        description: task.priority + " Priority"
      });
    });

    // Sort by due date
    activities.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    // Calculate total students (unique across all classes)
    const allStudentIds = new Set<string>();
    teacher.classes.forEach(c => {
      c.enrollments.forEach(e => {
        allStudentIds.add(e.student.id);
      });
    });
    const totalStudents = allStudentIds.size;

    return NextResponse.json({
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          name: session.name,
          email: session.email,
          employeeId: teacher.employeeId,
          department: teacher.department,
          subject: teacher.subject,
          university: teacher.university,
          phone: teacher.phone,
          qualification: teacher.qualification,
          experience: teacher.experience,
        },
        stats: {
          totalClasses: teacher.classes.length,
          totalStudents,
          pendingSubmissions: missingSubmissionsCount,
          upcomingExams: upcomingExams.length,
        },
        classes: teacher.classes.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code,
          subject: c.subject,
          department: c.department,
          semester: c.semester,
          studentCount: c._count.enrollments,
          assignmentCount: c._count.assignments,
          examCount: c._count.exams,
          materialCount: c._count.materials,
          recentStudents: c.enrollments.map(e => ({
            id: e.student.id,
            name: e.student.user.name,
            email: e.student.user.email,
            image: e.student.user.image,
          })),
        })),
        recentSubmissions: recentSubmissions.map(s => ({
          id: s.id,
          assignmentTitle: s.assignment.title,
          studentName: s.student.user.name,
          studentEmail: s.student.user.email,
          status: s.status,
          submittedAt: s.submittedAt,
          marks: s.marks,
          totalMarks: s.assignment.totalMarks,
        })),
        upcomingExams: upcomingExams.map(e => ({
          id: e.id,
          title: e.title,
          type: e.type,
          startTime: e.startTime,
          endTime: e.endTime,
          duration: e.duration,
          className: e.class.name,
          subject: e.class.subject,
          attemptCount: e._count.attempts,
        })),
        activities: activities.slice(0, 50), // Send a healthy amount for the detailed version
        announcements: teacher.announcements.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          priority: a.priority,
          isGlobal: a.isGlobal,
          createdAt: a.createdAt,
        })),
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
