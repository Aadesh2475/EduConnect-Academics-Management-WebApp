import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"

// Helper for standardized error responses
const errorResponse = (message: string, status: number) => {
  return NextResponse.json({ success: false, error: message }, { status })
}

// 48 hours in milliseconds
const LOCK_WINDOW_MS = 48 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("classId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const todayOnly = searchParams.get("today") === "true"

    // Return class IDs that already have attendance marked for today
    if (todayOnly && session.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.id },
        include: { classes: { select: { id: true } } }
      })
      if (!teacher) return errorResponse("Teacher profile not found", 404)

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const todaySessions = await prisma.attendanceSession.findMany({
        where: {
          classId: { in: teacher.classes.map(c => c.id) },
          date: { gte: todayStart, lte: todayEnd }
        },
        select: { classId: true, createdAt: true }
      })

      return NextResponse.json({
        success: true,
        data: todaySessions.map(s => ({ classId: s.classId, createdAt: s.createdAt }))
      })
    }

    const where: Record<string, unknown> = {}

    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.id },
        include: {
          classEnrollments: {
            where: { status: "APPROVED" },
            select: { classId: true }
          }
        }
      })

      if (!student) return errorResponse("Student profile not found", 404)

      // Filter by classId if provided, otherwise all enrolled classes
      const classIds = classId ? [classId] : student.classEnrollments.map(e => e.classId)

      const sessions = await prisma.attendanceSession.findMany({
        where: {
          classId: { in: classIds },
          ...(startDate && endDate ? {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          } : {})
        },
        include: {
          class: { select: { name: true, code: true } },
          attendances: {
            where: { studentId: student.id }
          }
        },
        orderBy: { date: "desc" }
      })

      const attendanceData = sessions.map(s => ({
        id: s.id,
        date: s.date,
        className: s.class.name,
        classCode: s.class.code,
        topic: s.topic,
        status: s.attendances[0]?.status || "ABSENT",
        remarks: s.attendances[0]?.remarks,
      }))

      // Calculate stats
      const total = attendanceData.length
      const present = attendanceData.filter(a => a.status === "PRESENT").length
      const absent = attendanceData.filter(a => a.status === "ABSENT").length
      const late = attendanceData.filter(a => a.status === "LATE").length
      const excused = attendanceData.filter(a => a.status === "EXCUSED").length

      return NextResponse.json({
        success: true,
        data: {
          records: attendanceData,
          stats: {
            total,
            present,
            absent,
            late,
            excused,
            rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
          }
        }
      })
    }

    // For teachers
    if (session.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.id },
        include: {
          classes: { select: { id: true } }
        }
      })

      if (!teacher) return errorResponse("Teacher profile not found", 404)

      const sessions = await prisma.attendanceSession.findMany({
        where: {
          classId: classId || {
            in: teacher.classes.map(c => c.id)
          }
        },
        include: {
          class: { select: { name: true, code: true } },
          _count: { select: { attendances: true } },
          attendances: {
            select: { status: true }
          }
        },
        orderBy: { date: "desc" }
      })

      const formattedSessions = sessions.map(s => ({
        id: s.id,
        date: s.date,
        className: s.class.name,
        classCode: s.class.code,
        topic: s.topic,
        createdAt: s.createdAt,
        totalPresent: s.attendances.filter(a => a.status === "PRESENT").length,
        totalAbsent: s.attendances.filter(a => a.status === "ABSENT").length,
        totalStudents: s._count.attendances // or just s.attendances.length approx
      }))

      return NextResponse.json({ success: true, data: formattedSessions })
    }

    return errorResponse("Invalid role", 400)
  } catch (error) {
    console.error("Get attendance error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "TEACHER") {
      return errorResponse("Forbidden", 403)
    }

    const body = await req.json()
    const { classId, date, topic, attendances } = body

    if (!classId || !date || !attendances) {
      return errorResponse("Missing required fields", 400)
    }

    // Verify teacher owns this class
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.id },
      include: {
        classes: { where: { id: classId } }
      }
    })

    if (!teacher || teacher.classes.length === 0) {
      return errorResponse("Class not found or access denied", 403)
    }

    // No future-date attendance allowed
    const submittedDate = new Date(date)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    if (submittedDate > todayEnd) {
      return errorResponse("Attendance can only be reported in real-time. Future dates are not allowed.", 400)
    }

    // Create or update attendance session
    const attendanceSession = await prisma.attendanceSession.upsert({
      where: {
        classId_date: {
          classId,
          date: new Date(date)
        }
      },
      create: {
        classId,
        date: new Date(date),
        topic,
      },
      update: { topic }
    })

    // Create attendance records
    for (const att of attendances) {
      await prisma.attendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId: attendanceSession.id,
            studentId: att.studentId,
          }
        },
        create: {
          sessionId: attendanceSession.id,
          studentId: att.studentId,
          status: att.status,
          remarks: att.remarks || "",
        },
        update: {
          status: att.status,
          remarks: att.remarks || "",
        }
      })
    }

    return NextResponse.json({ success: true, data: attendanceSession })
  } catch (error) {
    console.error("Mark attendance error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "TEACHER") {
      return errorResponse("Forbidden", 403)
    }

    const body = await req.json()
    const { sessionId, topic, attendances } = body

    if (!sessionId) {
      return errorResponse("Missing session ID", 400)
    }

    // Verify ownership
    const attSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { class: true }
    })

    if (!attSession) return errorResponse("Session not found", 404)

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.id }
    })

    if (!teacher || teacher.id !== attSession.class.teacherId) {
      return errorResponse("Access denied", 403)
    }

    // 48-hour security lockout
    const ageMs = Date.now() - new Date(attSession.createdAt).getTime()
    if (ageMs > LOCK_WINDOW_MS) {
      return errorResponse("Edit window has expired (48h limit)", 403)
    }

    // Update session topic
    if (topic) {
      await prisma.attendanceSession.update({
        where: { id: sessionId },
        data: { topic }
      })
    }

    // Update records
    if (attendances && Array.isArray(attendances)) {
      for (const att of attendances) {
        await prisma.attendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId: sessionId,
              studentId: att.studentId
            }
          },
          create: {
            sessionId: sessionId,
            studentId: att.studentId,
            status: att.status,
            remarks: att.remarks || ""
          },
          update: {
            status: att.status,
            remarks: att.remarks
          }
        })
      }
    }

    return NextResponse.json({ success: true, message: "Attendance updated" })

  } catch (error) {
    console.error("Update attendance error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "TEACHER") {
      return errorResponse("Forbidden", 403)
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return errorResponse("Missing session ID", 400)
    }

    // Verify ownership
    const attSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { class: true }
    })

    if (!attSession) return errorResponse("Session not found", 404)

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.id }
    })

    if (!teacher || teacher.id !== attSession.class.teacherId) {
      return errorResponse("Access denied", 403)
    }

    // 48-hour security lockout
    const ageMs = Date.now() - new Date(attSession.createdAt).getTime()
    if (ageMs > LOCK_WINDOW_MS) {
      return errorResponse("Delete window has expired (48h limit)", 403)
    }

    await prisma.attendanceSession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({ success: true, message: "Attendance session deleted" })
  } catch (error) {
    console.error("Delete attendance error:", error)
    return errorResponse("Internal server error", 500)
  }
}
