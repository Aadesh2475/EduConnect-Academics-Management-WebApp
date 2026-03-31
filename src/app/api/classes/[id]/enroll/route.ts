import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { successResponse, errorResponse, rateLimit } from "@/lib/api/helpers"

// Join class with code / Approve/Reject enrollment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const rl = await rateLimit(ip, "enroll", 10, 60000)
    if (!rl.success) return errorResponse("Too many requests", 429)

    const { id } = await params
    const body = await req.json()

    // Student joining with code
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: session.id } })
      if (!student) return errorResponse("Student profile not found", 404)

      // id is the class code when joining
      const classData = await prisma.class.findFirst({
        where: { OR: [{ id }, { code: id }] },
      })
      if (!classData) return errorResponse("Class not found. Check the code and try again.", 404)

      const existing = await prisma.classEnrollment.findFirst({
        where: { classId: classData.id, studentId: student.id },
      })
      if (existing) return errorResponse(`You have already ${existing.status === "PENDING" ? "requested to join" : "joined"} this class`)

      const enrollment = await prisma.classEnrollment.create({
        data: { classId: classData.id, studentId: student.id, status: "PENDING" },
      })

      return successResponse(enrollment, "Join request sent! Waiting for teacher approval.")
    }

    // Teacher approving/rejecting
    if (session.role === "TEACHER" || session.role === "ADMIN") {
      const { enrollmentId, action } = body
      if (!enrollmentId || !action) return errorResponse("enrollmentId and action are required")

      const enrollment = await prisma.classEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: action === "approve" ? "APPROVED" : "REJECTED",
          joinedAt: action === "approve" ? new Date() : null,
        },
        include: { student: { include: { user: { select: { name: true } } } } },
      })

      // Create notification for student
      await prisma.notification.create({
        data: {
          userId: enrollment.student.userId,
          title: action === "approve" ? "Enrollment Approved" : "Enrollment Rejected",
          message: action === "approve"
            ? `Your request to join has been approved!`
            : `Your request to join has been rejected.`,
          type: action === "approve" ? "success" : "warning",
          link: "/dashboard/classes",
        },
      })

      return successResponse(enrollment, `Enrollment ${action}d`)
    }

    return errorResponse("Invalid role", 403)
  } catch (error) {
    console.error("POST /api/classes/[id]/enroll error:", error)
    return errorResponse("Internal server error", 500)
  }
}
