import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse, successResponse } from "@/lib/api/helpers"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { student: true, teacher: true },
    })
    if (!user) return errorResponse("User not found", 404)
    const profile: Record<string, unknown> = { name: user.name, email: user.email, image: user.image, role: user.role }
    if (user.student) Object.assign(profile, user.student)
    if (user.teacher) Object.assign(profile, user.teacher)
    return successResponse(profile)
  } catch (error) {
    console.error("GET profile error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    const body = await req.json()
    await prisma.user.update({ where: { id: session.id }, data: { name: body.name || undefined } })
    if (session.role === "STUDENT") {
      await prisma.student.upsert({
        where: { userId: session.id },
        update: { phone: body.phone, department: body.department, semester: body.semester ? parseInt(body.semester) : undefined, section: body.section, batch: body.batch, address: body.address, guardianName: body.guardianName, guardianPhone: body.guardianPhone, dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined },
        create: { userId: session.id, phone: body.phone, department: body.department },
      })
    } else if (session.role === "TEACHER") {
      await prisma.teacher.update({
        where: { userId: session.id },
        data: { phone: body.phone, department: body.department || undefined, subject: body.subject || undefined, university: body.university || undefined, qualification: body.qualification, experience: body.experience ? parseInt(body.experience) : undefined },
      })
    }
    return successResponse(null, "Profile updated")
  } catch (error) {
    console.error("PUT profile error:", error)
    return errorResponse("Internal server error", 500)
  }
}
