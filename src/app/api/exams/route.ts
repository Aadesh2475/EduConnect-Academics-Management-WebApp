import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse, parsePagination } from "@/lib/api/helpers"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const classId = searchParams.get("classId")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = {}

    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        include: {
          classEnrollments: {
            where: { status: "APPROVED" },
            select: { classId: true }
          }
        }
      })

      if (!student) return errorResponse("Student profile not found", 404)

      where.classId = {
        in: student.classEnrollments.map(e => e.classId)
      }
    } else if (session.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.userId },
        include: {
          classes: { select: { id: true } }
        }
      })

      if (!teacher) return errorResponse("Teacher profile not found", 404)

      where.classId = {
        in: teacher.classes.map(c => c.id)
      }
    }

    if (classId) where.classId = classId
    if (type) where.type = type

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where: where as never,
        include: {
          class: { select: { name: true, code: true } },
          _count: { select: { questions: true, attempts: true } }
        },
        orderBy: { startTime: "asc" },
        skip,
        take: limit,
      }),
      prisma.exam.count({ where: where as never }),
    ])

    // If student, include attempt status
    let examsWithStatus = exams
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId }
      })

      if (student) {
        const attempts = await prisma.examAttempt.findMany({
          where: {
            studentId: student.id,
            examId: { in: exams.map(e => e.id) }
          }
        })

        const attemptMap = new Map(attempts.map(a => [a.examId, a]))

        examsWithStatus = exams.map(e => ({
          ...e,
          attempt: attemptMap.get(e.id) || null,
        }))
      }
    }

    return NextResponse.json({
      success: true,
      data: examsWithStatus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Get exams error:", error)
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
    const { title, description, type, classId, duration, totalMarks, passingMarks, startTime, endTime, questions } = body

    if (!title || !classId || !duration || !startTime || !endTime) {
      return errorResponse("Missing required fields", 400)
    }

    // Verify teacher owns this class
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.userId },
      include: {
        classes: { where: { id: classId } }
      }
    })

    if (!teacher || teacher.classes.length === 0) {
      return errorResponse("Class not found or access denied", 403)
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        type: type || "QUIZ",
        classId,
        duration,
        totalMarks: totalMarks || 100,
        passingMarks,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        questions: questions ? {
          create: questions.map((q: any, index: number) => ({
            type: q.type,
            question: q.question,
            options: q.options,
            answer: q.answer,
            marks: q.marks,
            explanation: q.explanation,
            order: index,
          }))
        } : undefined,
      },
      include: {
        class: { select: { name: true, code: true } },
        questions: true,
      }
    })

    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Create exam error:", error)
    return errorResponse("Internal server error", 500)
  }
}
