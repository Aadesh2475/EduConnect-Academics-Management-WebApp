import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";
import { errorResponse } from "@/lib/api/helpers";

// GET /api/teacher/messages/students
// Returns all students enrolled (APPROVED) in the teacher's classes – deduplicated
export async function GET() {
    try {
        const session = await getSession();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.role !== "TEACHER") return errorResponse("Forbidden", 403);

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            select: { id: true },
        });

        if (!teacher) return NextResponse.json({ success: true, data: [] });

        // Get all approved enrollments across the teacher's classes
        const enrollments = await prisma.classEnrollment.findMany({
            where: {
                class: { teacherId: teacher.id },
                status: "APPROVED",
            },
            include: {
                student: {
                    include: {
                        user: { select: { id: true, name: true, email: true, image: true } },
                    },
                },
                class: { select: { id: true, name: true, code: true } },
            },
        });

        // Deduplicate by userId, collect class names per student
        const map = new Map<
            string,
            { id: string; name: string; email: string; image: string | null; classes: string[] }
        >();

        for (const enr of enrollments) {
            const uid = enr.student.userId;
            if (!map.has(uid)) {
                map.set(uid, {
                    id: uid,
                    name: enr.student.user.name,
                    email: enr.student.user.email,
                    image: enr.student.user.image,
                    classes: [],
                });
            }
            map.get(uid)!.classes.push(`${enr.class.name} (${enr.class.code})`);
        }

        return NextResponse.json({
            success: true,
            data: Array.from(map.values()),
        });
    } catch (error) {
        console.error("Teacher message students error:", error);
        return errorResponse("Internal server error", 500);
    }
}
