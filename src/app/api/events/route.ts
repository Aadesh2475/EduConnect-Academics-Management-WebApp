import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

// GET /api/events - Get events for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = {}

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      where.OR = [
        { startDate: { gte: startDate, lte: endDate } },
        { endDate: { gte: startDate, lte: endDate } },
      ]
    }

    if (type && type !== "all") {
      where.type = type
    }

    // Get global events
    where.OR = [
      { isGlobal: true },
      { createdBy: session.id },
    ]

    const events = await prisma.event.findMany({
      where: where as never,
      orderBy: { startDate: "asc" },
    })

    // Also get class-related events (assignments, exams) for students
    let classEvents: unknown[] = []

    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.id },
        select: {
          classEnrollments: {
            where: { status: "APPROVED" },
            select: { classId: true }
          }
        }
      })

      if (student) {
        const classIds = student.classEnrollments.map(e => e.classId)

        // Get assignments as events
        const assignments = await prisma.assignment.findMany({
          where: {
            classId: { in: classIds },
            isActive: true,
          },
          include: {
            class: { select: { name: true, code: true } }
          }
        })

        // Get exams as events
        const exams = await prisma.exam.findMany({
          where: {
            classId: { in: classIds },
            isActive: true,
          },
          include: {
            class: { select: { name: true, code: true } }
          }
        })

        classEvents = [
          ...assignments.map(a => ({
            id: `assignment-${a.id}`,
            title: `Assignment Due: ${a.title}`,
            type: "assignment",
            date: a.dueDate,
            className: a.class.code,
            description: a.description,
          })),
          ...exams.map(e => ({
            id: `exam-${e.id}`,
            title: e.title,
            type: "exam",
            date: e.startTime,
            endDate: e.endTime,
            className: e.class.code,
            description: e.description,
          })),
        ]
      }
    }

    return NextResponse.json({
      success: true,
      data: [...events, ...classEvents],
    })
  } catch (error) {
    console.error("Events error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/events - Create a new event
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const body = await req.json()
    const { title, description, type, startDate, endDate, allDay, location, isGlobal } = body

    if (!title || !startDate) {
      return errorResponse("Missing required fields", 400)
    }

    // Only admins can create global events
    if (isGlobal && session.role !== "ADMIN") {
      return errorResponse("Only admins can create global events", 403)
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type: type || "event",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay || false,
        location,
        createdBy: session.id,
        isGlobal: isGlobal || false,
      }
    })

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    console.error("Create event error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// DELETE /api/events/:id - Delete an event
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("id")

    if (!eventId) return errorResponse("Event ID required", 400)

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) return errorResponse("Event not found", 404)

    // Only creator or admin can delete
    if (event.createdBy !== session.id && session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403)
    }

    await prisma.event.delete({ where: { id: eventId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete event error:", error)
    return errorResponse("Internal server error", 500)
  }
}
