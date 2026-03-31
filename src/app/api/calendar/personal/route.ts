import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

const err = (msg: string, status: number) =>
    NextResponse.json({ success: false, error: msg }, { status })

export async function GET() {
    try {
        const session = await getSession()
        if (!session) return err("Unauthorized", 401)

        const events = await prisma.event.findMany({
            where: {
                createdBy: session.userId,
                type: "personal",
            },
            orderBy: { startDate: "asc" },
        })

        return NextResponse.json({ success: true, data: events })
    } catch (error) {
        console.error("[PERSONAL_CALENDAR_GET]", error)
        return err("Internal server error", 500)
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return err("Unauthorized", 401)

        const body = await req.json()
        const { title, description, startDate, endDate, color, subtype } = body

        if (!title || !startDate) {
            return err("Title and start date are required", 400)
        }

        const event = await prisma.event.create({
            data: {
                title,
                description: description || null,
                type: "personal",
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                color: color || subtype || "note", // use color field to store subtype
                createdBy: session.userId,
                isGlobal: false,
            } as any,
        })

        return NextResponse.json({ success: true, data: event })
    } catch (error) {
        console.error("[PERSONAL_CALENDAR_POST]", error)
        return err("Internal server error", 500)
    }
}
