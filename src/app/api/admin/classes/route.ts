import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse, parsePagination } from "@/lib/api/helpers"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403)
    }

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const search = searchParams.get("search") || ""
    const department = searchParams.get("department") || "all"

    const where: Record<string, unknown> = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ]
    }
    
    if (department !== "all") {
      where.department = department
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where: where as never,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true,
              exams: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.class.count({ where: where as never }),
    ])

    return NextResponse.json({
      success: true,
      data: classes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Admin classes error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403)
    }

    const body = await req.json()
    const { name, description, department, semester, subject, teacherId } = body

    if (!name || !department || !semester || !subject || !teacherId) {
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
        teacherId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: newClass })
  } catch (error) {
    console.error("Create class error:", error)
    return errorResponse("Internal server error", 500)
  }
}
