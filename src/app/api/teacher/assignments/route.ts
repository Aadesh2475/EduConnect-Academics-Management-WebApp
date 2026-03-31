import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.id }
    })

    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 })
    }

    // Fetch all assignments across all classes the teacher teaches
    const assignments = await prisma.assignment.findMany({
      where: {
        class: {
          teacherId: teacher.id
        }
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' }
      ]
    })

    // Get total enrolled students for each class to calculate submission rate
    const classIds = [...new Set(assignments.map(a => a.classId))]
    const enrollments = await prisma.classEnrollment.groupBy({
      by: ['classId'],
      where: {
        classId: { in: classIds },
        status: "APPROVED"
      },
      _count: {
        studentId: true
      }
    })

    const enrollmentMap = new Map(enrollments.map(e => [e.classId, e._count.studentId]))

    const formattedAssignments = assignments.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      totalMarks: a.totalMarks,
      isActive: a.isActive,
      className: a.class.name,
      classCode: a.class.code,
      classId: a.class.id,
      submissionsCount: a._count.submissions,
      totalStudents: enrollmentMap.get(a.classId) || 0
    }))

    return NextResponse.json({ success: true, data: formattedAssignments })
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch assignments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, instructions, dueDate, totalMarks, classId, attachments } = await request.json()

    if (!title || !description || !dueDate || !classId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.id }
    })

    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 })
    }

    // Verify teacher owns the class
    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId: teacher.id },
      include: {
        enrollments: {
          where: { status: "APPROVED" },
          include: { student: { include: { user: true } } }
        }
      }
    })

    if (!cls) {
      return NextResponse.json({ success: false, error: "Class not found or unauthorized" }, { status: 403 })
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        instructions: instructions || null,
        dueDate: new Date(dueDate),
        totalMarks: parseInt(totalMarks) || 100,
        classId,
        attachments: attachments ? JSON.stringify(attachments) : null,
        isActive: true
      }
    })

    // Notify all students in the class
    for (const enrollment of cls.enrollments) {
      await createNotification({
        userId: enrollment.student.user.id,
        title: "New Assignment",
        message: `A new assignment "${title}" has been posted in ${cls.code}. Due on ${new Date(dueDate).toLocaleDateString()}.`,
        type: "info",
        link: `/dashboard/student/assignments`
      })
    }

    return NextResponse.json({ success: true, data: assignment }, { status: 201 })
  } catch (error) {
    console.error("Error creating assignment:", error)
    return NextResponse.json({ success: false, error: "Failed to create assignment" }, { status: 500 })
  }
}
