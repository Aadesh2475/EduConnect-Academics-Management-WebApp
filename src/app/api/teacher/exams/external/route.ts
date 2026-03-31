import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const classId = searchParams.get("classId");
        const studentId = searchParams.get("studentId");

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            select: { id: true }
        });

        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

        const where: any = { teacherId: teacher.id };
        if (classId && classId !== "all") where.classId = classId;
        if (studentId) where.studentId = studentId;

        const reports = await prisma.externalExamReport.findMany({
            where,
            include: {
                student: { select: { user: { select: { name: true, image: true } } } },
                class: { select: { name: true, code: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ success: true, data: reports });
    } catch (error) {
        console.error("External exam reports error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch reports" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { studentId, classId, examType, testName, totalMarks, obtainedMarks, note } = body;

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            select: { id: true }
        });

        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

        const percentage = Math.round((obtainedMarks / totalMarks) * 100 * 10) / 10;

        const report = await prisma.externalExamReport.create({
            data: {
                studentId,
                classId,
                teacherId: teacher.id,
                examType,
                testName,
                totalMarks,
                obtainedMarks,
                percentage,
                note
            },
            include: {
                student: { select: { user: { select: { name: true } } } },
                class: { select: { name: true } }
            }
        });

        return NextResponse.json({ success: true, data: report });
    } catch (error) {
        console.error("External exam create error:", error);
        return NextResponse.json({ success: false, error: "Failed to create report" }, { status: 500 });
    }
}
