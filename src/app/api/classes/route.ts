import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { generateClassCode } from "@/lib/utils"
import { getSession } from "@/lib/auth-utils"
import { createNotification } from "@/lib/notifications"
import { parseBody } from "@/lib/validate"
import { createClassSchema } from "@/lib/validators"
import { sanitizeString } from "@/lib/sanitize"
import { parseSanitizedBody } from "@/lib/api/helpers"

// Helper to get user from session
async function getCurrentUser() {
  return await getSession()
}

// GET - Get classes
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "classes-get", 60)
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

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") || "STUDENT"
    const search = sanitizeString(searchParams.get("search") || "", 200)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "10"))
    const skip = (page - 1) * limit

    let classes: any[] = []
    let total: number = 0

    if (role === "TEACHER") {
      // Get teacher's classes
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id },
      })

      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
      }

      const teacherWhere = {
        teacherId: teacher.id,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      }

      const [teacherClasses, teacherTotal] = await Promise.all([
        prisma.class.findMany({
          where: teacherWhere,
          include: {
            _count: {
              select: {
                enrollments: { where: { status: "APPROVED" } },
                assignments: true,
                exams: true,
              },
            },
            enrollments: {
              where: { status: "PENDING" },
              select: { id: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.class.count({ where: teacherWhere }),
      ])
      classes = teacherClasses
      total = teacherTotal
    } else {
      // Get student's enrolled classes
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
      })

      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
      }

      const studentWhere = {
        studentId: student.id,
        status: "APPROVED" as const,
        ...(search && {
          class: {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { subject: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }),
      }

      const [enrollments, totalEnrollments] = await Promise.all([
        prisma.classEnrollment.findMany({
          where: studentWhere,
          include: {
            class: {
              include: {
                teacher: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        image: true,
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    enrollments: { where: { status: "APPROVED" } },
                    assignments: true,
                    exams: true,
                  },
                },
              },
            },
          },
          orderBy: { joinedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.classEnrollment.count({ where: studentWhere }),
      ])

      classes = enrollments.map((e: any) => e.class)
      total = totalEnrollments
    }

    return NextResponse.json(
      {
        classes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: rateLimitResult.headers }
    )
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new class (teacher only)
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "classes-create", 10)
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

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Only teachers can create classes" }, { status: 403 })
    }

    const result = await parseBody(request, createClassSchema)
    if (!result.ok) return result.error

    const { name, description, department, semester, subject } = result.data

    // Generate unique class code
    let code = generateClassCode()
    let existingClass = await prisma.class.findUnique({ where: { code } })
    while (existingClass) {
      code = generateClassCode()
      existingClass = await prisma.class.findUnique({ where: { code } })
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        code,
        description,
        department,
        semester,
        subject,
        teacherId: teacher.id,
      },
    })

    // Create success notification
    await createNotification({
      userId: user.id,
      title: "Class Created",
      message: `${newClass.name} has been created successfully. Code: ${newClass.code}`,
      type: "success",
      link: `/dashboard/teacher/classes/${newClass.id}`,
    })

    return NextResponse.json(newClass, { status: 201, headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error creating class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
