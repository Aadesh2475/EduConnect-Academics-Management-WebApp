import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession, ensureStudentProfile } from "@/lib/auth-utils"
import { errorResponse, parsePagination } from "@/lib/api/helpers"

// GET /api/student/classes - Get student's enrolled classes
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

    // Ensure student profile exists
    const student = await ensureStudentProfile(session.userId)

    if (!student) return errorResponse("Failed to load student profile", 500)

    const enrollments = await prisma.classEnrollment.findMany({
      where: { studentId: student.id },
      include: {
        class: {
          include: {
            teacher: {
              include: {
                user: { select: { name: true, email: true, image: true } }
              }
            },
            _count: {
              select: { enrollments: true, assignments: true, exams: true, materials: true }
            },
            assignments: {
              where: {
                dueDate: { gte: new Date() },
                submissions: { none: { studentId: student.id } }
              },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Calculate progress for each class
    const classesWithProgress = await Promise.all(
      enrollments.map(async (e) => {
        const totalAssignments = await prisma.assignment.count({
          where: { classId: e.classId }
        })
        const completedAssignments = await prisma.submission.count({
          where: {
            studentId: student.id,
            assignment: { classId: e.classId }
          }
        })
        const progress = totalAssignments > 0
          ? Math.round((completedAssignments / totalAssignments) * 100)
          : 0

        return {
          id: e.class.id,
          name: e.class.name,
          code: e.class.code,
          description: e.class.description,
          subject: e.class.subject,
          department: e.class.department,
          semester: e.class.semester,
          isActive: e.class.isActive,
          enrollmentStatus: e.status,
          joinedAt: e.joinedAt,
          teacher: {
            name: e.class.teacher.user.name,
            email: e.class.teacher.user.email,
            image: e.class.teacher.user.image,
          },
          _count: e.class._count,
          assignmentsDue: e.class.assignments.length,
          progress,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: classesWithProgress
    })
  } catch (error) {
    console.error("Student classes error:", error)
    return errorResponse("Internal server error", 500)
  }
}
