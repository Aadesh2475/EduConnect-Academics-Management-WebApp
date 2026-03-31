import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { checkRateLimit } from "@/lib/rate-limit"

async function getCurrentUser() {
  return await getSession()
}

// GET - Get teacher profile
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "profile-teacher-get", 60)
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        classes: {
          include: {
            _count: {
              select: {
                enrollments: {
                  where: { status: "APPROVED" },
                },
              },
            },
          },
        },
        teacherRatings: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, image: true }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
    }

    return NextResponse.json(teacher, { headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error fetching teacher profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create teacher profile
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "profile-teacher-create", 10)
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

    const data = await request.json()

    // Check if profile already exists
    const existing = await prisma.teacher.findUnique({
      where: { userId: user.id },
    })

    if (existing) {
      return NextResponse.json({ error: "Teacher profile already exists" }, { status: 400 })
    }

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        department: data.department,
        subject: data.subject,
        university: data.university,
        phone: data.phone,
        qualification: data.qualification,
        experience: data.experience,
      },
    })

    return NextResponse.json(teacher, { status: 201, headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error creating teacher profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update teacher profile
export async function PUT(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "profile-teacher-update", 30)
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

    const data = await request.json()

    // Update User model fields if provided
    if (data.name || data.image) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.image && { image: data.image }),
        },
      })
    }

    const teacher = await prisma.teacher.update({
      where: { userId: user.id },
      data: {
        department: data.department,
        subject: data.subject,
        university: data.university,
        phone: data.phone,
        qualification: data.qualification,
        experience: (data.experience === null || data.experience === undefined) ? null : Number(data.experience),
        address: data.address,
        alternateEmail: data.alternateEmail,
        purpose: data.purpose,
        interests: data.interests,
        referralSource: data.referralSource,
      },
    })

    return NextResponse.json(teacher, { headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error updating teacher profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
