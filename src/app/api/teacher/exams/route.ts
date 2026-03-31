import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/teacher/exams - Get all exams for teacher's classes
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role !== "TEACHER") return errorResponse("Forbidden", 403)

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("classId")
    const status = searchParams.get("status") // upcoming, ongoing, past, all

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.userId }
    })

    if (!teacher) return errorResponse("Teacher profile not found", 404)

    // Get teacher's class IDs
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId: teacher.id },
      select: { id: true }
    })
    const classIds = classId ? [classId] : teacherClasses.map(c => c.id)

    const now = new Date()
    let dateFilter: any = {}
    if (status === "upcoming") {
      dateFilter = { startTime: { gt: now } }
    } else if (status === "ongoing") {
      dateFilter = {
        startTime: { lte: now },
        endTime: { gte: now }
      }
    } else if (status === "past") {
      dateFilter = { endTime: { lt: now } }
    }

    const exams = await prisma.exam.findMany({
      where: {
        classId: { in: classIds },
        ...dateFilter
      },
      include: {
        class: { select: { name: true, code: true } },
        _count: { select: { questions: true, attempts: true } }
      },
      orderBy: { startTime: "asc" }
    })

    // Get detailed stats for each exam
    const examsWithStats = await Promise.all(
      exams.map(async (e) => {
        const totalStudents = await prisma.classEnrollment.count({
          where: { classId: e.classId, status: "APPROVED" }
        })

        const completedAttempts = await prisma.examAttempt.count({
          where: { examId: e.id, status: "GRADED" }
        })

        const averageScore = await prisma.examAttempt.aggregate({
          where: { examId: e.id, status: "GRADED" },
          _avg: { percentage: true }
        })

        let examStatus: string
        if (new Date(e.startTime) > now) {
          examStatus = "UPCOMING"
        } else if (new Date(e.endTime) < now) {
          examStatus = "COMPLETED"
        } else {
          examStatus = "ONGOING"
        }

        return {
          id: e.id,
          title: e.title,
          description: e.description,
          type: e.type,
          className: e.class.name,
          classCode: e.class.code,
          classId: e.classId,
          startTime: e.startTime,
          endTime: e.endTime,
          duration: e.duration,
          totalMarks: e.totalMarks,
          passingMarks: e.passingMarks,
          isActive: e.isActive,
          questionsCount: e._count.questions,
          status: examStatus,
          stats: {
            totalStudents,
            totalAttempts: e._count.attempts,
            completedAttempts,
            notAttempted: totalStudents - e._count.attempts,
            averageScore: averageScore._avg.percentage
              ? Math.round(averageScore._avg.percentage)
              : null,
            attemptRate: totalStudents > 0
              ? Math.round((e._count.attempts / totalStudents) * 100)
              : 0
          }
        }
      })
    )

    // Overall stats
    const stats = {
      total: examsWithStats.length,
      upcoming: examsWithStats.filter(e => e.status === "UPCOMING").length,
      ongoing: examsWithStats.filter(e => e.status === "ONGOING").length,
      completed: examsWithStats.filter(e => e.status === "COMPLETED").length
    }

    return NextResponse.json({
      success: true,
      data: examsWithStats,
      stats
    })
  } catch (error) {
    console.error("Teacher exams error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/teacher/exams - Create a new exam
import { createNotifications } from "@/lib/notifications"
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
    console.log("Exam Creation Payload:", JSON.stringify(body, null, 2))

    const {
      classId,
      title,
      description,
      type,
      startTime,
      endTime,
      duration,
      totalMarks,
      passingMarks,
      questions
    } = body

    if (!classId || !title || !startTime || !endTime || !duration || !totalMarks) {
      return errorResponse("Missing required fields", 400)
    }

    // Verify teacher owns the class
    const classExists = await prisma.class.findFirst({
      where: { id: classId, teacherId: teacher.id }
    })

    if (!classExists) {
      return errorResponse("Class not found or access denied", 403)
    }

    // Create exam with questions
    const exam = await prisma.exam.create({
      data: {
        classId,
        title,
        description,
        type: type || "QUIZ",
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: parseInt(duration),
        totalMarks: parseInt(totalMarks),
        passingMarks: passingMarks ? parseInt(passingMarks) : Math.ceil(parseInt(totalMarks) * 0.4),
        isActive: true,
        questions: questions && questions.length > 0 ? {
          create: questions.map((q: any, index: number) => ({
            question: q.question,
            type: q.type || "MCQ",
            options: JSON.stringify(q.options || []),
            answer: q.correctAnswer,
            marks: q.marks || 1,
            order: index + 1
          }))
        } : undefined
      },
      include: {
        class: { select: { name: true, code: true } },
        _count: { select: { questions: true } }
      }
    })

    // Create notification for enrolled students
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId, status: "APPROVED" },
      include: { student: { select: { userId: true } } }
    })

    await createNotifications(enrollments.map(e => ({
      userId: e.student.userId,
      title: "New Exam Scheduled",
      message: `New ${type || "Quiz"} "${title}" has been scheduled in ${classExists.name}`,
      type: "info",
      link: `/dashboard/student/quiz`
    })))

    return NextResponse.json({
      success: true,
      data: exam,
      message: "Exam created successfully"
    })
  } catch (error) {
    console.error("Create exam error details:", error)
    return errorResponse("Internal server error", 500)
  }
}
