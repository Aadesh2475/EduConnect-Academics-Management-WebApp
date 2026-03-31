import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: session.id } })
      if (!student) return NextResponse.json({ success: true, data: { totalClasses: 0, totalAssignments: 0, upcomingExams: 0, attendanceRate: 0 } })
      const [classes, assignments] = await Promise.all([
        prisma.classEnrollment.count({ where: { studentId: student.id, status: "APPROVED" } }),
        prisma.submission.count({ where: { studentId: student.id } }),
      ])
      return NextResponse.json({ success: true, data: { totalClasses: classes, totalAssignments: assignments, upcomingExams: 0, attendanceRate: 0, pendingSubmissions: 0 } })
    }
    if (session.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.id } })
      if (!teacher) return NextResponse.json({ success: true, data: { totalClasses: 0, totalStudents: 0, totalAssignments: 0, pendingSubmissions: 0 } })
      const [classes, students, assignments] = await Promise.all([
        prisma.class.count({ where: { teacherId: teacher.id } }),
        prisma.classEnrollment.count({ where: { class: { teacherId: teacher.id }, status: "APPROVED" } }),
        prisma.assignment.count({ where: { class: { teacherId: teacher.id } } }),
      ])
      return NextResponse.json({ success: true, data: { totalClasses: classes, totalStudents: students, totalAssignments: assignments, pendingSubmissions: 0 } })
    }
    const [users, classes, assignments] = await Promise.all([prisma.user.count(), prisma.class.count(), prisma.assignment.count()])
    return NextResponse.json({ success: true, data: { totalStudents: users, totalClasses: classes, totalAssignments: assignments, pendingSubmissions: 0 } })
  } catch (error) {
    console.error("Stats error:", error)
    return errorResponse("Internal server error", 500)
  }
}
