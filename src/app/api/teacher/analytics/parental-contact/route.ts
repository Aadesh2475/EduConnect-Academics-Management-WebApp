import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { studentId, classId, reason, details } = body;

        if (!studentId || !reason) {
            return NextResponse.json({ success: false, error: "Student ID and reason are required" }, { status: 400 });
        }

        const teacher = await prisma.teacher.findUnique({ where: { userId: session.id } });
        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

        // Verify teacher has this student
        const enrollment = await prisma.classEnrollment.findFirst({
            where: { studentId, status: "APPROVED", class: { teacherId: teacher.id } },
            include: { student: { include: { user: true, parent: { include: { user: true } } } } }
        });
        if (!enrollment) {
            return NextResponse.json({ success: false, error: "Student not in your class" }, { status: 403 });
        }

        // Create parental contact request
        const contactRequest = await prisma.parentalContactRequest.create({
            data: {
                teacherId: teacher.id,
                studentId,
                classId: classId || null,
                reason,
                details: details || null,
                status: "PENDING"
            }
        });

        // If parent exists, send them a notification
        const parent = enrollment.student.parent;
        if (parent) {
            await prisma.notification.create({
                data: {
                    userId: parent.userId,
                    title: "Teacher Requests Contact",
                    message: `Your child's teacher has requested to contact you regarding: ${reason}`,
                    type: "warning",
                    link: `/dashboard/parent`
                }
            });
        }

        return NextResponse.json({ success: true, data: contactRequest });

    } catch (error) {
        console.error("Parental contact error:", error);
        return NextResponse.json({ success: false, error: "Failed to create contact request" }, { status: 500 });
    }
}
