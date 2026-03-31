import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { cache } from "@/lib/cache"
import { withPerformanceLogging } from "@/lib/performance"

export async function GET(request: NextRequest) {
  return withPerformanceLogging("STUDENT_ASSIGNMENTS", async () => {
    try {
      const session = await getSession()
      if (!session || session.role !== "STUDENT") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }

      const cacheKey = `student_assignments_${session.id}`;
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json({ success: true, data: cachedData });
      }

      const student = await prisma.student.findUnique({
        where: { userId: session.id },
        include: {
          classEnrollments: {
            where: { status: "APPROVED" },
            select: { classId: true }
          }
        }
      })

      if (!student) {
        return NextResponse.json({ success: false, error: "Student profile not found" }, { status: 404 })
      }

      const classIds = student.classEnrollments.map((e: { classId: string }) => e.classId)

      // Fetch all active assignments for those classes
      const assignments = await prisma.assignment.findMany({
        where: {
          classId: { in: classIds },
          isActive: true
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              code: true,
              teacher: {
                include: { user: { select: { name: true } } }
              }
            }
          },
          submissions: {
            where: { studentId: student.id }
          }
        },
        orderBy: [
          { dueDate: 'asc' }
        ]
      })

      const formattedAssignments = assignments.map(a => {
        const userSubmission = a.submissions[0] || null

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          instructions: a.instructions,
          dueDate: a.dueDate,
          totalMarks: a.totalMarks,
          isActive: a.isActive,
          className: a.class.name,
          classCode: a.class.code,
          teacherName: a.class.teacher.user.name,

          // Submission details specific to this student
          submission: userSubmission ? {
            id: userSubmission.id,
            content: userSubmission.content,
            status: userSubmission.status,
            grade: userSubmission.marks,
            feedback: userSubmission.feedback,
            submittedAt: userSubmission.submittedAt,
            gradedAt: userSubmission.gradedAt
          } : null
        }
      })

      await cache.set(cacheKey, formattedAssignments, 300); // 5 minute cache

      return NextResponse.json({ success: true, data: formattedAssignments })
    } catch (error) {
      console.error("Error fetching assignments for student:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch assignments" }, { status: 500 })
    }
  });
}
