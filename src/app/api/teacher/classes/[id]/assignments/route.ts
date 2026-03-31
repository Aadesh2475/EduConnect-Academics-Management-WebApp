import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const { id } = await params;

        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id }
        });

        if (!teacher) {
            return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 });
        }

        const assignments = await prisma.assignment.findMany({
            where: {
                classId: id,
                class: { teacherId: teacher.id }
            },
            include: {
                _count: {
                    select: { submissions: true }
                }
            },
            orderBy: { dueDate: "asc" }
        });

        return NextResponse.json({ success: true, data: assignments });

    } catch (error) {
        console.error("Error fetching class assignments:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch class assignments" }, { status: 500 });
    }
}
