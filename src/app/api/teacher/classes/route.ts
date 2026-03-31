import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/teacher/classes - Get teacher's classes
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "TEACHER") return errorResponse("Forbidden", 403)

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.userId }
    })

    if (!teacher) return errorResponse("Teacher profile not found", 404)

    const classes = await prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        _count: {
          select: { enrollments: true, assignments: true, exams: true, materials: true }
        },
        enrollments: {
          where: { status: "PENDING" },
          select: { id: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    const classesWithStats = classes.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      description: c.description,
      department: c.department,
      semester: c.semester,
      subject: c.subject,
      isActive: c.isActive,
      createdAt: c.createdAt,
      _count: c._count,
      pendingRequests: c.enrollments.length,
    }))

    return NextResponse.json({
      success: true,
      data: classesWithStats
    })
  } catch (error) {
    console.error("Teacher classes error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/teacher/classes - Create a new class
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "TEACHER") return errorResponse("Forbidden", 403)

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.userId }
    })

    if (!teacher) return errorResponse("Teacher profile not found", 404)

    const body = await req.json()
    const { name, description, department, semester, subject } = body

    if (!name || !department || !semester || !subject) {
      return errorResponse("Missing required fields", 400)
    }

    // Generate unique class code
    const code = `${department.substring(0, 2).toUpperCase()}${semester}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const newClass = await prisma.class.create({
      data: {
        name,
        code,
        description,
        department,
        semester: parseInt(semester),
        subject,
        teacherId: teacher.id,
      }
    })

    return NextResponse.json({
      success: true,
      data: newClass
    })
  } catch (error) {
    console.error("Create class error:", error)
    return errorResponse("Internal server error", 500)
  }
}
