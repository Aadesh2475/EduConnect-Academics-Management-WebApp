import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/helpers";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403);
        }

        const { id } = await params;

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        });

        if (!teacher) {
            return errorResponse("Teacher profile not found", 404);
        }

        const announcement = await prisma.announcement.findUnique({
            where: { id }
        });

        if (!announcement || announcement.teacherId !== teacher.id) {
            return errorResponse("Announcement not found or unauthorized", 404);
        }

        await prisma.announcement.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Announcement deleted" });
    } catch (error) {
        console.error("Delete announcement error:", error);
        return errorResponse("Internal server error", 500);
    }
}
