import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { studentId, classId, rating, feedback } = body;

        if (!studentId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ success: false, error: "Invalid rating data" }, { status: 400 });
        }

        const teacher = await prisma.teacher.findUnique({ where: { userId: session.id } });
        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

        // Verify the teacher has this student
        const enrollment = await prisma.classEnrollment.findFirst({
            where: { studentId, status: "APPROVED", class: { teacherId: teacher.id } }
        });
        if (!enrollment) {
            return NextResponse.json({ success: false, error: "Student not in your class" }, { status: 403 });
        }

        // Upsert rating
        const existingRating = await prisma.studentRating.findFirst({
            where: { teacherId: teacher.id, studentId, classId: classId || null }
        });

        let ratingRecord;
        if (existingRating) {
            ratingRecord = await prisma.studentRating.update({
                where: { id: existingRating.id },
                data: { rating, feedback: feedback || null }
            });
        } else {
            ratingRecord = await prisma.studentRating.create({
                data: { teacherId: teacher.id, studentId, classId: classId || null, rating, feedback: feedback || null }
            });
        }

        return NextResponse.json({ success: true, data: ratingRecord });

    } catch (error) {
        console.error("Student rating error:", error);
        return NextResponse.json({ success: false, error: "Failed to save rating" }, { status: 500 });
    }
}
