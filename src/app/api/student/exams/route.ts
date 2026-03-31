import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"
import { cache } from "@/lib/cache"
import { withPerformanceLogging } from "@/lib/performance"

// GET /api/student/exams - Get student's exams
export async function GET(req: NextRequest) {
  return withPerformanceLogging("STUDENT_EXAMS", async () => {
    try {
      const session = await getSession()
      if (!session) return errorResponse("Unauthorized", 401)
      if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

      const { searchParams } = new URL(req.url)
      const type = searchParams.get("type") || "all"

      const cacheKey = `student_exams_${session.userId}_${type}`;
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json({ success: true, ...cachedData });
      }

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

      const classIds = student.classEnrollments.map(e => e.classId)

      const exams = await prisma.exam.findMany({
        where: {
          classId: { in: classIds },
          isActive: true,
          ...(type !== "all" ? { type: type as any } : {})
        },
        include: {
          class: { select: { name: true, code: true } },
          attempts: {
            where: { studentId: student.id }
          },
          _count: { select: { questions: true } }
        },
        orderBy: { startTime: "asc" }
      })

      const now = new Date()
      const examsWithStatus = exams.map(e => {
        const attempt = e.attempts[0]
        let status: string

        if (attempt) {
          if (attempt.status === "GRADED" || attempt.submittedAt) {
            status = "COMPLETED"
          } else {
            status = "IN_PROGRESS"
          }
        } else if (new Date(e.endTime) < now) {
          status = "MISSED"
        } else if (new Date(e.startTime) <= now && new Date(e.endTime) >= now) {
          status = "AVAILABLE"
        } else {
          status = "UPCOMING"
        }

        return {
          id: e.id,
          title: e.title,
          description: e.description,
          type: e.type,
          className: e.class.name,
          classCode: e.class.code,
          duration: e.duration,
          totalMarks: e.totalMarks,
          passingMarks: e.passingMarks,
          startTime: e.startTime,
          endTime: e.endTime,
          questionsCount: e._count.questions,
          status,
          attempt: attempt ? {
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            obtainedMarks: attempt.obtainedMarks,
            percentage: attempt.percentage,
          } : null
        }
      })

      const stats = {
        total: examsWithStatus.length,
        available: examsWithStatus.filter(e => e.status === "AVAILABLE").length,
        completed: examsWithStatus.filter(e => e.status === "COMPLETED").length,
        upcoming: examsWithStatus.filter(e => e.status === "UPCOMING").length,
        avgScore: (() => {
          const completed = examsWithStatus.filter(e => e.attempt?.percentage !== null && e.attempt?.percentage !== undefined)
          if (completed.length === 0) return 0
          return Math.round(completed.reduce((acc, e) => acc + (e.attempt?.percentage || 0), 0) / completed.length)
        })()
      }

      await cache.set(cacheKey, { data: examsWithStatus, stats }, 300);

      return NextResponse.json({
        success: true,
        data: examsWithStatus,
        stats
      })
    } catch (error) {
      console.error("Student exams error:", error)
      return errorResponse("Internal server error", 500)
    }
  });
}
