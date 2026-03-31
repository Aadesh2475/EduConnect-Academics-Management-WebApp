import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session || session.role !== "STUDENT") {
      return errorResponse("Forbidden", 403)
    }

    const { id: assignmentId } = await params
    const body = await req.json()
    const { content, attachments } = body

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId: session.userId }
    })

    if (!student) {
      return errorResponse("Student profile not found", 404)
    }

    // Get assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          include: {
            enrollments: {
              where: { studentId: student.id, status: "APPROVED" }
            }
          }
        }
      }
    })

    if (!assignment) {
      return errorResponse("Assignment not found", 404)
    }

    // Check if student is enrolled
    if (assignment.class.enrollments.length === 0) {
      return errorResponse("Not enrolled in this class", 403)
    }

    // Check if already submitted
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        }
      }
    })

    if (existingSubmission) {
      return errorResponse("Already submitted", 400)
    }

    // Determine status
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    const status = now > dueDate ? "LATE" : "SUBMITTED"

    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: student.id,
        content,
        attachments,
        status,
        submittedAt: now,
      }
    })

    return NextResponse.json({ success: true, data: submission })
  } catch (error) {
    console.error("Submit assignment error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const { id: assignmentId } = await params

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true, image: true }
            }
          }
        }
      },
      orderBy: { submittedAt: "desc" }
    })

    return NextResponse.json({ success: true, data: submissions })
  } catch (error) {
    console.error("Get submissions error:", error)
    return errorResponse("Internal server error", 500)
  }
}
