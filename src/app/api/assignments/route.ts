import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse, parsePagination, sanitizeQueryParam } from "@/lib/api/helpers"
import { parseBody } from "@/lib/validate"
import { createAssignmentSchema } from "@/lib/validators"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const classId = sanitizeQueryParam(searchParams, "classId")
    const status  = sanitizeQueryParam(searchParams, "status")

    const where: Record<string, unknown> = {}

    if (session.role === "STUDENT") {
      // Get student's enrolled classes
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        include: {
          classEnrollments: {
            where: { status: "APPROVED" },
            select: { classId: true }
          }
        }
      })

      if (!student) return errorResponse("Student profile not found", 404)

      where.classId = {
        in: student.classEnrollments.map(e => e.classId)
      }
    } else if (session.role === "TEACHER") {
      // Get teacher's classes
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.userId },
        include: {
          classes: { select: { id: true } }
        }
      })

      if (!teacher) return errorResponse("Teacher profile not found", 404)

      where.classId = {
        in: teacher.classes.map(c => c.id)
      }
    }

    if (classId) where.classId = classId

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where: where as never,
        include: {
          class: {
            select: { name: true, code: true }
          },
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { dueDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.assignment.count({ where: where as never }),
    ])

    // If student, include submission status
    let assignmentsWithStatus = assignments
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId }
      })

      if (student) {
        const submissions = await prisma.submission.findMany({
          where: {
            studentId: student.id,
            assignmentId: { in: assignments.map(a => a.id) }
          }
        })

        const submissionMap = new Map(submissions.map(s => [s.assignmentId, s]))

        assignmentsWithStatus = assignments.map(a => ({
          ...a,
          submission: submissionMap.get(a.id) || null,
        }))
      }
    }

    return NextResponse.json({
      success: true,
      data: assignmentsWithStatus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Get assignments error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "TEACHER") {
      return errorResponse("Forbidden", 403)
    }

    // ✅ Validate + sanitize in one step
    const result = await parseBody(req, createAssignmentSchema)
    if (!result.ok) return result.error

    const { title, description, instructions, dueDate, totalMarks, classId, attachments } = result.data

    // Verify teacher owns this class
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.userId },
      include: {
        classes: { where: { id: classId } }
      }
    })

    if (!teacher || teacher.classes.length === 0) {
      return errorResponse("Class not found or access denied", 403)
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        instructions,
        dueDate: new Date(dueDate),
        totalMarks: totalMarks || 100,
        classId,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
      include: {
        class: { select: { name: true, code: true } }
      }
    })

    return NextResponse.json({ success: true, data: assignment })
  } catch (error) {
    console.error("Create assignment error:", error)
    return errorResponse("Internal server error", 500)
  }
}
