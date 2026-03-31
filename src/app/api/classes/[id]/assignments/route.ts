import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse, successResponse, parsePagination, rateLimit } from "@/lib/api/helpers"

// GET assignments (for a class or all)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("classId")
    const { page, limit, skip } = parsePagination(searchParams)

    const where: Record<string, unknown> = {}
    if (classId) where.classId = classId

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where: where as never,
        include: {
          class: { select: { name: true, subject: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.assignment.count({ where: where as never }),
    ])

    return NextResponse.json({ success: true, data: assignments, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("GET assignments error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST create assignment (teacher only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "TEACHER") return errorResponse("Forbidden", 403)

    const rl = await rateLimit(session.id, "create-assignment", 20, 60000)
    if (!rl.success) return errorResponse("Too many requests", 429)

    const body = await req.json()
    const { title, description, instructions, dueDate, totalMarks, classId } = body

    if (!title || !description || !dueDate || !classId) {
      return errorResponse("Title, description, due date, and class are required")
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        instructions: instructions || null,
        dueDate: new Date(dueDate),
        totalMarks: parseInt(totalMarks) || 100,
        classId,
      },
    })

    return successResponse(assignment, "Assignment created")
  } catch (error) {
    console.error("POST assignment error:", error)
    return errorResponse("Internal server error", 500)
  }
}
