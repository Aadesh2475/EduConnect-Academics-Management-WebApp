import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

// GET: Returns current meeting link for a class
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const session = await getSession()
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

        const cls = await prisma.class.findUnique({
            where: { id: params.id },
            select: { id: true, name: true, meetingLink: true, teacherId: true }
        })

        if (!cls) return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 })

        return NextResponse.json({ success: true, data: { meetingLink: cls.meetingLink, className: cls.name } })
    } catch (error) {
        console.error("Meeting GET error:", error)
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
    }
}

// POST: Teacher sets/updates the meeting link (room name)
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const teacher = await prisma.teacher.findUnique({ where: { userId: session.id } })
        if (!teacher) return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 })

        const cls = await prisma.class.findFirst({
            where: { id: params.id, teacherId: teacher.id }
        })
        if (!cls) return NextResponse.json({ success: false, error: "Class not found or not yours" }, { status: 404 })

        const { meetingLink } = await request.json()

        const updated = await prisma.class.update({
            where: { id: params.id },
            data: { meetingLink: meetingLink || null }
        })

        return NextResponse.json({ success: true, data: { meetingLink: updated.meetingLink } })
    } catch (error) {
        console.error("Meeting POST error:", error)
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
    }
}
