import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403)
    }

    // Get overall statistics
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalAssignments,
      totalExams,
      recentUsers,
      recentClasses,
      enrollmentStats,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.assignment.count(),
      prisma.exam.count(),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        }
      }),
      prisma.class.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          teacher: {
            include: {
              user: { select: { name: true } }
            }
          },
          _count: { select: { enrollments: true } }
        }
      }),
      prisma.classEnrollment.groupBy({
        by: ["status"],
        _count: true,
      }),
    ])

    // Calculate monthly growth
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [newStudentsThisMonth, newTeachersThisMonth] = await Promise.all([
      prisma.student.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.teacher.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalAssignments,
          totalExams,
          activeUsers: Math.floor((totalStudents + totalTeachers) * 0.4), // Simulated
        },
        growth: {
          studentsThisMonth: newStudentsThisMonth,
          teachersThisMonth: newTeachersThisMonth,
          studentGrowthRate: totalStudents > 0 ? ((newStudentsThisMonth / totalStudents) * 100).toFixed(1) : 0,
          teacherGrowthRate: totalTeachers > 0 ? ((newTeachersThisMonth / totalTeachers) * 100).toFixed(1) : 0,
        },
        recentUsers,
        recentClasses,
        enrollmentStats: enrollmentStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count
          return acc
        }, {} as Record<string, number>),
      }
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return errorResponse("Internal server error", 500)
  }
}
