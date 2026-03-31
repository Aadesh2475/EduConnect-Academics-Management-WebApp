import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"
import { createNotification } from "@/lib/notifications"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/teacher/classes/[id]/requests - Get pending join requests
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "TEACHER") return errorResponse("Forbidden", 403)

    const { id: classId } = await params

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.userId },
      include: {
        classes: { where: { id: classId } }
      }
    })

    if (!teacher || teacher.classes.length === 0) {
      return errorResponse("Class not found or access denied", 403)
    }

    const requests = await prisma.classEnrollment.findMany({
      where: {
        classId,
        status: "PENDING"
      },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, image: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    const formattedRequests = requests.map(r => ({
      id: r.id,
      student: {
        id: r.student.id,
        name: r.student.user.name,
        email: r.student.user.email,
        image: r.student.user.image,
        enrollmentNo: r.student.enrollmentNo,
        department: r.student.department,
        semester: r.student.semester,
      },
      createdAt: r.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: formattedRequests
    })
  } catch (error) {
    console.error("Get requests error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/teacher/classes/[id]/requests - Approve/Reject request
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "TEACHER") return errorResponse("Forbidden", 403)

    const { id: classId } = await params
    const body = await req.json()
    const { enrollmentId, action } = body

    if (!enrollmentId || !action || !["approve", "reject"].includes(action)) {
      return errorResponse("Invalid request", 400)
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.userId },
      include: {
        classes: { where: { id: classId } }
      }
    })

    if (!teacher || teacher.classes.length === 0) {
      return errorResponse("Class not found or access denied", 403)
    }

    const enrollment = await prisma.classEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        joinedAt: action === "approve" ? new Date() : null,
      },
      include: {
        student: {
          include: { user: { select: { name: true } } }
        }
      }
    })

    // Create notification for student
    await createNotification({
      userId: enrollment.student.userId,
      title: action === "approve" ? "Enrollment Approved" : "Enrollment Rejected",
      message: action === "approve"
        ? `Your request to join ${teacher.classes[0].name} has been approved!`
        : `Your request to join ${teacher.classes[0].name} was not approved.`,
      type: action === "approve" ? "success" : "info",
      link: "/dashboard/student/classes"
    })

    return NextResponse.json({
      success: true,
      message: `Request ${action}d successfully`
    })
  } catch (error) {
    console.error("Handle request error:", error)
    return errorResponse("Internal server error", 500)
  }
}
