import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string, studentId: string }> }
) {
    try {
        const session = await getSession();
        const { id, studentId } = await params;

        if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        });

        if (!teacher) {
            return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 });
        }

        // Verify class ownership
        const classData = await prisma.class.findUnique({
            where: { id, teacherId: teacher.id }
        });

        if (!classData) {
            return NextResponse.json({ success: false, error: "Class not found or unauthorized" }, { status: 404 });
        }

        // Notify the student
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { user: { select: { id: true } } }
        });

        if (student) {
            const { createNotification } = await import("@/lib/notifications");
            await createNotification({
                userId: student.user.id,
                title: "Removed from Class",
                message: `You have been removed from the class: ${classData.name}`,
                type: "warning"
            });
        }

        // Delete the enrollment (unenroll student)
        await prisma.classEnrollment.delete({
            where: {
                classId_studentId: {
                    classId: id,
                    studentId: studentId
                }
            }
        });

        return NextResponse.json({ success: true, message: "Student unenrolled and notified successfully" });

    } catch (error) {
        console.error("Error unenrolling student:", error);
        return NextResponse.json({ success: false, error: "Failed to unenroll student" }, { status: 500 });
    }
}
