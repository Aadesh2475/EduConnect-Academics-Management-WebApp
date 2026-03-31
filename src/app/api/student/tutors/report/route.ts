import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "STUDENT") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { teacherId, reason, details } = await req.json();

        if (!teacherId || !reason) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const student = await prisma.student.findUnique({
            where: { userId: session.id },
        });

        if (!student) {
            return NextResponse.json(
                { success: false, error: "Student profile not found" },
                { status: 404 }
            );
        }

        // Create the formal report
        const report = await prisma.teacherReport.create({
            data: {
                studentId: student.id,
                teacherId,
                reason,
                details,
                status: "PENDING",
            },
        });

        return NextResponse.json({ success: true, data: report });
    } catch (error) {
        console.error("Failed to submit report:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit report" },
            { status: 500 }
        );
    }
}
