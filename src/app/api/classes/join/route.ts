import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getSession, ensureStudentProfile } from "@/lib/auth-utils"
import { createNotification } from "@/lib/notifications"

async function getCurrentUser() {
  return await getSession()
}

// POST - Join a class using code
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "classes-join", 20)
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

    // Ensure student profile exists, creating it if necessary
    const student = await ensureStudentProfile(user.id)

    if (!student) {
      return NextResponse.json({ error: "Only students can join classes" }, { status: 403 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Class code is required" }, { status: 400 })
    }

    // Find class by code
    const classToJoin = await prisma.class.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!classToJoin) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    if (!classToJoin.isActive) {
      return NextResponse.json({ error: "This class is no longer active" }, { status: 400 })
    }

    // Check class capacity
    const currentEnrollments = await prisma.classEnrollment.count({
      where: {
        classId: classToJoin.id,
        status: "APPROVED",
      },
    })

    if (currentEnrollments >= classToJoin.maxStudents) {
      return NextResponse.json({ error: "This class is full" }, { status: 400 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classToJoin.id,
          studentId: student.id,
        },
      },
    })

    if (existingEnrollment) {
      if (existingEnrollment.status === "PENDING") {
        return NextResponse.json({ error: "Your request is already pending" }, { status: 400 })
      }
      if (existingEnrollment.status === "APPROVED") {
        return NextResponse.json({ error: "You are already enrolled in this class" }, { status: 400 })
      }
      if (existingEnrollment.status === "REJECTED") {
        // Allow re-request after rejection
        await prisma.classEnrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: "PENDING" },
        })
        return NextResponse.json({ message: "Join request submitted" }, { headers: rateLimitResult.headers })
      }
    }

    // Create enrollment request
    await prisma.classEnrollment.create({
      data: {
        classId: classToJoin.id,
        studentId: student.id,
        status: "PENDING",
      },
    })

    // Create notification for teacher
    const teacherUser = await prisma.teacher.findUnique({
      where: { id: classToJoin.teacherId },
      select: { userId: true },
    })

    if (teacherUser) {
      // Use helper to create notification
      await createNotification({
        userId: teacherUser.userId,
        title: "New Join Request",
        message: `${user.name || "A student"} wants to join ${classToJoin.name}`,
        type: "info",
        link: `/dashboard/teacher/classes/${classToJoin.id}`,
      })
    }

    // Create success notification for student
    await createNotification({
      userId: user.id,
      title: "Join Request Sent",
      message: `Your request to join ${classToJoin.name} has been sent successfully.`,
      type: "success",
    })

    return NextResponse.json(
      { message: "Join request submitted successfully" },
      { status: 201, headers: rateLimitResult.headers }
    )
  } catch (error) {
    console.error("Error joining class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
