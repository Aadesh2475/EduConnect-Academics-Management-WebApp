
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay, addDays, eachDayOfInterval } from "date-fns"

const errorResponse = (message: string, status: number) => {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "TEACHER") {
      return errorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("classId")

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.id },
      include: { classes: true }
    })

    if (!teacher) return errorResponse("Teacher profile not found", 404)

    const teacherClassIds = teacher.classes.map(c => c.id)
    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    // 1. Daily Overall Stats (for Bar Chart - Current Month)
    const dailyOverall = []
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    for (const day of daysInMonth) {
        if (day > today) break;

        const sessions = await prisma.attendanceSession.findMany({
            where: {
                classId: { in: teacherClassIds },
                date: { gte: startOfDay(day), lte: endOfDay(day) }
            },
            include: {
                attendances: { select: { status: true } }
            }
        })

        const totalMarked = sessions.reduce((acc, s) => acc + s.attendances.length, 0)
        const presents = sessions.reduce((acc, s) => acc + s.attendances.filter(a => a.status === "PRESENT").length, 0)
        const absents = sessions.reduce((acc, s) => acc + s.attendances.filter(a => a.status === "ABSENT").length, 0)

        dailyOverall.push({
            date: format(day, "d"),
            fullDate: format(day, "MMMM do"),
            totalClasses: sessions.length,
            presents,
            absents,
            avgAttendance: totalMarked > 0 ? (presents / totalMarked) * 100 : 0
        })
    }

    // 2. Monthly Overall Stats (for Full Report - Last 6 Months)
    const monthlyOverall = []
    for (let i = 0; i < 6; i++) {
        const targetMonth = subMonths(today, i)
        const start = startOfMonth(targetMonth)
        const end = endOfMonth(targetMonth)

        const sessions = await prisma.attendanceSession.findMany({
            where: {
                classId: { in: teacherClassIds },
                date: { gte: start, lte: end }
            },
            include: {
                attendances: { select: { status: true } }
            }
        })

        const totalMarkedRecords = sessions.reduce((acc, s) => acc + s.attendances.length, 0)
        const totalPresents = sessions.reduce((acc, s) => acc + s.attendances.filter(a => a.status === "PRESENT").length, 0)
        const totalAbsents = sessions.reduce((acc, s) => acc + s.attendances.filter(a => a.status === "ABSENT").length, 0)
        
        monthlyOverall.push({
            month: format(targetMonth, "MMM"),
            fullMonth: format(targetMonth, "MMMM yyyy"),
            totalClasses: sessions.length,
            totalStudentsMarked: totalMarkedRecords,
            presents: totalPresents,
            absents: totalAbsents,
            avgAttendance: totalMarkedRecords > 0 ? (totalPresents / totalMarkedRecords) * 100 : 0
        })
    }

    // 3. Class Trend Daily Stats (for Line Chart)
    let classTrend: any[] = []
    const selectedClassId = classId || (teacher.classes.length > 0 ? teacher.classes.sort((a, b) => a.name.localeCompare(b.name))[0].id : null)

    if (selectedClassId && teacherClassIds.includes(selectedClassId)) {
        const sessions = await prisma.attendanceSession.findMany({
            where: {
                classId: selectedClassId,
                date: { gte: monthStart, lte: monthEnd }
            },
            include: {
                attendances: { select: { status: true } }
            },
            orderBy: { date: "asc" }
        })

        classTrend = sessions.map(s => ({
            date: format(s.date, "d"),
            fullDate: format(s.date, "EEEE, MMMM do"),
            totalStudents: s.attendances.length,
            presents: s.attendances.filter(a => a.status === "PRESENT").length,
            absents: s.attendances.filter(a => a.status === "ABSENT").length,
            attendanceRate: s.attendances.length > 0 ? (s.attendances.filter(a => a.status === "PRESENT").length / s.attendances.length) * 100 : 0
        }))
    }

    return NextResponse.json({
      success: true,
      data: {
        overall: {
            daily: dailyOverall,
            monthly: monthlyOverall.reverse()
        },
        trend: classTrend
      }
    })

  } catch (error) {
    console.error("Attendance stats error:", error)
    return errorResponse("Internal server error", 500)
  }
}
