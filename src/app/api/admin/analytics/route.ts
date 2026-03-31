import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/admin/analytics - Get platform analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403)
    }

    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalClasses,
      totalAssignments,
      totalExams,
      recentUsers,
      usersByMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.class.count(),
      prisma.assignment.count(),
      prisma.exam.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        }
      }),
      // Get user growth by month (last 6 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(CASE WHEN role = 'STUDENT' THEN 1 END) as students,
          COUNT(CASE WHEN role = 'TEACHER' THEN 1 END) as teachers
        FROM "User"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `.catch(() => []),
    ])

    // Calculate additional metrics
    const activeClasses = await prisma.class.count({ where: { isActive: true } })
    const pendingEnrollments = await prisma.classEnrollment.count({ where: { status: "PENDING" } })
    const totalSubmissions = await prisma.submission.count()
    const gradedSubmissions = await prisma.submission.count({ where: { status: "GRADED" } })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalStudents,
          totalTeachers,
          totalClasses,
          activeClasses,
          totalAssignments,
          totalExams,
          pendingEnrollments,
        },
        submissions: {
          total: totalSubmissions,
          graded: gradedSubmissions,
          gradingRate: totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0,
        },
        userDistribution: {
          students: totalStudents,
          teachers: totalTeachers,
          admins: totalUsers - totalStudents - totalTeachers,
        },
        recentUsers,
        userGrowth: usersByMonth,
      }
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return errorResponse("Internal server error", 500)
  }
}
