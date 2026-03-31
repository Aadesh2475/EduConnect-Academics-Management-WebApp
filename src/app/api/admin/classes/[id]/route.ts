import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "ADMIN") {
            return errorResponse("Forbidden", 403)
        }

        const { id } = await params
        const body = await req.json()
        const { name, description, department, semester, subject, teacherId, isActive } = body

        const updatedClass = await prisma.class.update({
            where: { id },
            data: {
                name,
                description,
                department,
                semester: semester ? parseInt(semester) : undefined,
                subject,
                teacherId,
                isActive,
            },
        })

        return NextResponse.json({ success: true, data: updatedClass })
    } catch (error) {
        console.error("Update class error:", error)
        return errorResponse("Internal server error", 500)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== "ADMIN") {
            return errorResponse("Forbidden", 403)
        }

        const { id } = await params

        await prisma.class.delete({
            where: { id },
        })

        return NextResponse.json({ success: true, message: "Class deleted successfully" })
    } catch (error) {
        console.error("Delete class error:", error)
        return errorResponse("Internal server error", 500)
    }
}
