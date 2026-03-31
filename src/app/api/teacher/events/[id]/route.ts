import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params
        const body = await req.json()
        const { title, description, type, startDate, endDate, allDay, location, color, classId, isGlobal } = body

        // Verify ownership
        const existingEvent = await prisma.event.findUnique({
            where: { id }
        })

        if (!existingEvent) {
            return new NextResponse("Event not found", { status: 404 })
        }

        if (existingEvent.createdBy !== session.userId) {
            return new NextResponse("Unauthorized to update this event", { status: 403 })
        }

        // Update the event
        const updatedEvent = await prisma.event.update({
            where: { id },
            data: {
                title,
                description,
                type,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null,
                allDay: allDay !== undefined ? allDay : undefined,
                location,
                color,
                classId: classId || null,
                isGlobal: isGlobal !== undefined ? isGlobal : undefined,
            } as any,
            include: {
                class: {
                    select: { name: true }
                }
            } as any
        })

        return NextResponse.json(updatedEvent)
    } catch (error) {
        console.error("[TEACHER_EVENTS_PUT]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params

        // Verify ownership
        const existingEvent = await prisma.event.findUnique({
            where: { id }
        })

        if (!existingEvent) {
            return new NextResponse("Event not found", { status: 404 })
        }

        if (existingEvent.createdBy !== session.userId) {
            return new NextResponse("Unauthorized to delete this event", { status: 403 })
        }

        await prisma.event.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[TEACHER_EVENTS_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
