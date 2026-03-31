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

        const exams = await prisma.exam.findMany({
            where: {
                classId: id,
                class: { teacherId: teacher.id }
            },
            include: {
                _count: {
                    select: { attempts: true }
                }
            },
            orderBy: { startTime: "asc" }
        });

        return NextResponse.json({ success: true, data: exams });

    } catch (error) {
        console.error("Error fetching class exams:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch class exams" }, { status: 500 });
    }
}
