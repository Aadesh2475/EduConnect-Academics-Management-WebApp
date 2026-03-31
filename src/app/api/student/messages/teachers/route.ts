import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";
import { errorResponse } from "@/lib/api/helpers";

// GET /api/student/messages/teachers
// Returns the teachers of classes the student is enrolled in (for New Message dialog)
export async function GET() {
    try {
        const session = await getSession();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.role !== "STUDENT") return errorResponse("Forbidden", 403);

        const student = await prisma.student.findUnique({
            where: { userId: session.id },
            select: { id: true },
        });
        if (!student) return NextResponse.json({ success: true, data: [] });

        const enrollments = await prisma.classEnrollment.findMany({
            where: { studentId: student.id, status: "APPROVED" },
            include: {
                class: {
                    select: {
                        id: true, name: true, code: true,
                        teacher: {
                            include: {
                                user: { select: { id: true, name: true, email: true, image: true } },
                            },
                        },
                    },
                },
            },
        });

        // Deduplicate teachers by userId
        const map = new Map<
            string,
            { id: string; name: string; email: string; image: string | null; classes: string[] }
        >();

        for (const enr of enrollments) {
            const teacher = enr.class.teacher;
            if (!teacher) continue;
            const uid = teacher.userId;
            if (!map.has(uid)) {
                map.set(uid, {
                    id: uid,
                    name: teacher.user.name,
                    email: teacher.user.email,
                    image: teacher.user.image,
                    classes: [],
                });
            }
            map.get(uid)!.classes.push(`${enr.class.name} (${enr.class.code})`);
        }

        return NextResponse.json({ success: true, data: Array.from(map.values()) });
    } catch (error) {
        console.error("Student teachers list error:", error);
        return errorResponse("Internal server error", 500);
    }
}
