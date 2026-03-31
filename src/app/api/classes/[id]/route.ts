import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { checkRateLimit } from "@/lib/rate-limit"

async function getCurrentUser() {
  return await getSession()
}

// GET - Get class details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await checkRateLimit(request, "class-get", 60)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitResult.headers }
      )
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        enrollments: {
          where: { status: "APPROVED" },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        materials: {
          orderBy: { createdAt: "desc" },
        },
        assignments: {
          orderBy: { dueDate: "asc" },
        },
        exams: {
          orderBy: { startTime: "asc" },
        },
        announcements: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            enrollments: { where: { status: "APPROVED" } },
            materials: true,
            assignments: true,
            exams: true,
          },
        },
      },
    })

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    return NextResponse.json(classData, { headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error fetching class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update class (teacher only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await checkRateLimit(request, "class-update", 30)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitResult.headers }
      )
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Verify teacher owns the class
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const existingClass = await prisma.class.findUnique({
      where: { id },
    })

    if (!existingClass || existingClass.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Class not found or unauthorized" }, { status: 404 })
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        department: data.department,
        semester: data.semester,
        subject: data.subject,
        isActive: data.isActive,
        maxStudents: data.maxStudents ? parseInt(data.maxStudents) : undefined,
      },
    })

    return NextResponse.json(updatedClass, { headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error updating class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete class (teacher only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await checkRateLimit(request, "class-delete", 10)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitResult.headers }
      )
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const existingClass = await prisma.class.findUnique({
      where: { id },
    })

    if (!existingClass || existingClass.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Class not found or unauthorized" }, { status: 404 })
    }

    await prisma.class.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Class deleted" }, { headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error deleting class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
