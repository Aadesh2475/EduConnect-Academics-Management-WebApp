import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { checkRateLimit } from "@/lib/rate-limit"

// Get current user helper
async function getCurrentUser() {
  return await getSession()
}

// GET - Get student profile
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, "profile-student-get", 60)
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

    const student = await prisma.student.findUnique({
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
        classEnrollments: {
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
              },
            },
          },
        },
        receivedRatings: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    name: true,
                    image: true,
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    // Manually fetch class info for ratings since relation is not defined in schema
    const ratingsWithClass = await Promise.all(
      student.receivedRatings.map(async (rating) => {
        if (!rating.classId) return { ...rating, class: null };
        const classInfo = await prisma.class.findUnique({
          where: { id: rating.classId },
          select: { name: true, code: true }
        });
        return { ...rating, class: classInfo };
      })
    );

    const responseData = {
      ...student,
      receivedRatings: ratingsWithClass
    };

    return NextResponse.json(responseData, { headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error fetching student profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create student profile
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "profile-student-create", 10)
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
    const existing = await prisma.student.findUnique({
      where: { userId: user.id },
    })

    if (existing) {
      return NextResponse.json({ error: "Student profile already exists" }, { status: 400 })
    }

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        phone: data.phone,
        department: data.department,
        semester: data.semester,
        section: data.section,
        batch: data.batch,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
      },
    })

    return NextResponse.json(student, { status: 201, headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error creating student profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update student profile
export async function PUT(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "profile-student-update", 30)
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

    const student = await prisma.student.update({
      where: { userId: user.id },
      data: {
        phone: data.phone,
        department: data.department,
        semester: data.semester,
        section: data.section,
        batch: data.batch,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
      },
    })

    return NextResponse.json(student, { headers: rateLimitResult.headers })
  } catch (error) {
    console.error("Error updating student profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
