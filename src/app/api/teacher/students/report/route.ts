import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id }
        });

        if (!teacher) {
            return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 });
        }

        const body = await request.json();
        const { studentId, classId, reason, details } = body;

        if (!studentId || !reason) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const report = await prisma.studentReport.create({
            data: {
                studentId,
                teacherId: teacher.id,
                classId: classId || null,
                reason,
                details,
            }
        });

        return NextResponse.json({ success: true, data: report });

    } catch (error) {
        console.error("Error creating student report:", error);
        return NextResponse.json({ success: false, error: "Failed to create student report" }, { status: 500 });
    }
}
