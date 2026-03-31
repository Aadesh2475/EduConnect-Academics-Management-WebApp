import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/teacher/assignments/[id]/submissions - Get submissions for an assignment
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "TEACHER") return errorResponse("Forbidden", 403)

    const { id: assignmentId } = await params

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.userId }
    })

    if (!teacher) return errorResponse("Teacher profile not found", 404)

    // Verify assignment belongs to teacher's class
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        class: { teacherId: teacher.id }
      },
      include: {
        class: { select: { id: true, name: true, code: true } }
      }
    })

    if (!assignment) {
      return errorResponse("Assignment not found or access denied", 403)
    }

    // Get all submissions for this assignment
    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, image: true } }
          }
        }
      },
      orderBy: { submittedAt: "desc" }
    })

    // Get all enrolled students
    const enrolledStudents = await prisma.classEnrollment.findMany({
      where: {
        classId: assignment.classId,
        status: "APPROVED"
      },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, image: true } }
          }
        }
      }
    })

    // Create a map of submitted students
    const submittedStudentIds = new Set(submissions.map(s => s.studentId))

    // Format submissions
    const formattedSubmissions = submissions.map(s => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.student.user.name,
      studentEmail: s.student.user.email,
      studentImage: s.student.user.image,
      enrollmentNo: s.student.enrollmentNo,
      submittedAt: s.submittedAt,
      status: s.status,
      marks: s.marks,
      feedback: s.feedback,
      content: s.content,
      attachments: s.attachments,
      isLate: s.submittedAt && assignment.dueDate ? new Date(s.submittedAt) > new Date(assignment.dueDate) : false
    }))

    // Get students who haven't submitted
    const notSubmitted = enrolledStudents
      .filter(e => !submittedStudentIds.has(e.studentId))
      .map(e => ({
        studentId: e.studentId,
        studentName: e.student.user.name,
        studentEmail: e.student.user.email,
        studentImage: e.student.user.image,
        enrollmentNo: e.student.enrollmentNo
      }))

    // Calculate stats
    const stats = {
      totalStudents: enrolledStudents.length,
      submitted: submissions.length,
      graded: submissions.filter(s => s.marks !== null).length,
      pending: submissions.filter(s => s.marks === null).length,
      notSubmitted: notSubmitted.length,
      lateSubmissions: submissions.filter(s => s.submittedAt && assignment.dueDate ? new Date(s.submittedAt) > new Date(assignment.dueDate) : false).length,
      averageMarks: (() => {
        const graded = submissions.filter(s => s.marks !== null)
        if (graded.length === 0) return null
        return Math.round(graded.reduce((acc, s) => acc + (s.marks || 0), 0) / graded.length)
      })()
    }

    return NextResponse.json({
      success: true,
      data: {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          instructions: assignment.instructions,
          dueDate: assignment.dueDate,
          totalMarks: assignment.totalMarks,
          className: assignment.class.name,
          classCode: assignment.class.code
        },
        submissions: formattedSubmissions,
        notSubmitted,
        stats
      }
    })
  } catch (error) {
    console.error("Get submissions error:", error)
    return errorResponse("Internal server error", 500)
  }
}
