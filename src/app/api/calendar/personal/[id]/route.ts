import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

const err = (msg: string, status: number) =>
    NextResponse.json({ success: false, error: msg }, { status })

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) return err("Unauthorized", 401)

        const { id } = await params
        const body = await req.json()
        const { title, description, startDate, endDate, color, subtype } = body

        const existing = await prisma.event.findUnique({ where: { id } })
        if (!existing) return err("Event not found", 404)
        if (existing.createdBy !== session.userId) return err("Access denied", 403)
        if (existing.type !== "personal") return err("Not a personal event", 400)

        const updated = await prisma.event.update({
            where: { id },
            data: {
                title,
                description: description || null,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null,
                color: color || subtype || existing.color,
            } as any,
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error("[PERSONAL_CALENDAR_PUT]", error)
        return err("Internal server error", 500)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) return err("Unauthorized", 401)

        const { id } = await params

        const existing = await prisma.event.findUnique({ where: { id } })
        if (!existing) return err("Event not found", 404)
        if (existing.createdBy !== session.userId) return err("Access denied", 403)
        if (existing.type !== "personal") return err("Not a personal event", 400)

        await prisma.event.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[PERSONAL_CALENDAR_DELETE]", error)
        return err("Internal server error", 500)
    }
}
