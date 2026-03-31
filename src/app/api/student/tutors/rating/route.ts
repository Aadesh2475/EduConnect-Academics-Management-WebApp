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

        const { teacherId, rating, review } = await req.json();

        if (!teacherId || typeof rating !== "number" || rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, error: "Invalid rating data" },
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

        // Upsert the rating (create if new, update if exists)
        const savedRating = await prisma.teacherRating.upsert({
            where: {
                studentId_teacherId: {
                    studentId: student.id,
                    teacherId: teacherId,
                },
            },
            update: {
                rating,
                review,
            },
            create: {
                studentId: student.id,
                teacherId,
                rating,
                review,
            },
        });

        return NextResponse.json({ success: true, data: savedRating });
    } catch (error) {
        console.error("Failed to submit rating:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit rating" },
            { status: 500 }
        );
    }
}
