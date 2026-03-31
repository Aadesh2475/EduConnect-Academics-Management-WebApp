import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"
import { after } from "next/server"
import { withPerformanceLogging } from "@/lib/performance"

type RouteParams = { params: Promise<{ id: string }> }

// PUT /api/teacher/submissions/[id]/grade - Grade a submission
export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withPerformanceLogging("GRADE_SUBMISSION", async () => {
    try {
      const session = await getSession()
      if (!session) return errorResponse("Unauthorized", 401)
      if (session.role !== "TEACHER") return errorResponse("Forbidden", 403)

      const { id: submissionId } = await params
      const body = await req.json()
      const { marks, feedback } = body

      if (marks === undefined || marks === null) {
        return errorResponse("Marks are required", 400)
      }

      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.userId }
      })

      if (!teacher) return errorResponse("Teacher profile not found", 404)

      // Verify submission belongs to teacher's assignment
      const submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
          assignment: {
            class: { teacherId: teacher.id }
          }
        },
        include: {
          assignment: { select: { totalMarks: true, title: true } },
          student: { include: { user: { select: { name: true } } } }
        }
      })

      if (!submission) {
        return errorResponse("Submission not found or access denied", 403)
      }

      // Validate marks
      const numericMarks = parseInt(marks)
      if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > submission.assignment.totalMarks) {
        return errorResponse(`Marks must be between 0 and ${submission.assignment.totalMarks}`, 400)
      }

      // Update submission
      const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          marks: numericMarks,
          feedback: feedback || null,
          status: "GRADED"
        }
      })

      // Create notification for student in background
      after(async () => {
        await withPerformanceLogging("GRADE_NOTIFICATION", async () => {
          await prisma.notification.create({
            data: {
              userId: submission.student.userId,
              title: "Assignment Graded",
              message: `Your submission for "${submission.assignment.title}" has been graded. Score: ${numericMarks}/${submission.assignment.totalMarks}`,
              type: "success",
              link: "/dashboard/student/assignments"
            }
          })
        });
      })

      return NextResponse.json({
        success: true,
        data: updatedSubmission,
        message: "Submission graded successfully"
      })
    } catch (error) {
      console.error("Grade submission error:", error)
      return errorResponse("Internal server error", 500)
    }
  });
}

// GET /api/teacher/submissions/[id]/grade - Get submission details for grading
export async function GET(req: NextRequest, { params }: RouteParams) {
  return withPerformanceLogging("GET_SUBMISSION_FOR_GRADING", async () => {
    try {
      const session = await getSession()
      if (!session) return errorResponse("Unauthorized", 401)
      if (session.role !== "TEACHER") return errorResponse("Forbidden", 403)

      const { id: submissionId } = await params

      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.userId }
      })

      if (!teacher) return errorResponse("Teacher profile not found", 404)

      const submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
          assignment: {
            class: { teacherId: teacher.id }
          }
        },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              description: true,
              instructions: true,
              dueDate: true,
              totalMarks: true,
              attachments: true,
              class: { select: { name: true, code: true } }
            }
          },
          student: {
            include: {
              user: { select: { name: true, email: true, image: true } }
            }
          }
        }
      })

      if (!submission) {
        return errorResponse("Submission not found or access denied", 403)
      }

      return NextResponse.json({
        success: true,
        data: {
          id: submission.id,
          submittedAt: submission.submittedAt,
          status: submission.status,
          marks: submission.marks,
          feedback: submission.feedback,
          content: submission.content,
          attachments: submission.attachments,
          isLate: submission.submittedAt && submission.assignment.dueDate ? new Date(submission.submittedAt) > new Date(submission.assignment.dueDate) : false,
          student: {
            id: submission.studentId,
            name: submission.student.user.name,
            email: submission.student.user.email,
            image: submission.student.user.image,
            enrollmentNo: submission.student.enrollmentNo
          },
          assignment: submission.assignment
        }
      })
    } catch (error) {
      console.error("Get submission error:", error)
      return errorResponse("Internal server error", 500)
    }
  });
}
