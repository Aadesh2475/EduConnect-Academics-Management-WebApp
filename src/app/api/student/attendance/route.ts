import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"
import { cache } from "@/lib/cache"
import { withPerformanceLogging } from "@/lib/performance"

// GET /api/student/attendance - Get student's attendance records
export async function GET(req: NextRequest) {
  return withPerformanceLogging("STUDENT_ATTENDANCE", async () => {
    try {
      const session = await getSession()
      if (!session) return errorResponse("Unauthorized", 401)
      if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

      const { searchParams } = new URL(req.url)
      const classId = searchParams.get("classId")
      const month = searchParams.get("month")
      const year = searchParams.get("year")

      const cacheKey = `student_attendance_${session.userId}_${classId || 'all'}_${month || 'now'}_${year || 'now'}`;
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json({ success: true, data: cachedData });
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

      const classIds = classId ? [classId] : student.classEnrollments.map(e => e.classId)

      // Build date filter
      let dateFilter = {}
      if (month && year) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        const endDate = new Date(parseInt(year), parseInt(month), 0)
        dateFilter = {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      }

      const sessions = await prisma.attendanceSession.findMany({
        where: {
          classId: { in: classIds },
          ...dateFilter
        },
        include: {
          class: { select: { name: true, code: true } },
          attendances: {
            where: { studentId: student.id }
          }
        },
        orderBy: { date: "desc" }
      })

      const records = sessions.map(s => ({
        id: s.id,
        date: s.date,
        className: s.class.name,
        classCode: s.class.code,
        topic: s.topic,
        status: s.attendances[0]?.status || "ABSENT",
        remarks: s.attendances[0]?.remarks
      }))

      // Calculate stats
      const total = records.length
      const presentSize = records.filter(r => r.status === "PRESENT").length
      const absentSize = records.filter(r => r.status === "ABSENT").length
      const lateSize = records.filter(r => r.status === "LATE").length
      const excusedSize = records.filter(r => r.status === "EXCUSED").length
      const rateSize = total > 0 ? Math.round(((presentSize + lateSize) / total) * 100) : 0

      const finalData = {
        records,
        stats: { 
          total, 
          present: presentSize, 
          absent: absentSize, 
          late: lateSize, 
          excused: excusedSize, 
          rate: rateSize 
        }
      };

      await cache.set(cacheKey, finalData, 300); // 5 minute cache

      return NextResponse.json({
        success: true,
        data: finalData
      })
    } catch (error) {
      console.error("Student attendance error:", error)
      return errorResponse("Internal server error", 500)
    }
  });
}
