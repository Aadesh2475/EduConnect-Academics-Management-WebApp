import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { examType, testName, totalMarks, obtainedMarks, note } = body;

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            select: { id: true }
        });

        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

        const report = await prisma.externalExamReport.findUnique({
            where: { id: params.id }
        });

        if (!report) return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
        if (report.teacherId !== teacher.id) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const percentage = Math.round((obtainedMarks / totalMarks) * 100 * 10) / 10;

        const updatedReport = await prisma.externalExamReport.update({
             where: { id: params.id },
            data: {
                examType,
                testName,
                totalMarks,
                obtainedMarks,
                percentage,
                note
            }
        });

        return NextResponse.json({ success: true, data: updatedReport });
    } catch (error) {
        console.error("External exam update error:", error);
        return NextResponse.json({ success: false, error: "Failed to update report" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            select: { id: true }
        });

        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

        const report = await prisma.externalExamReport.findUnique({
            where: { id: params.id }
        });

        if (!report) return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
        if (report.teacherId !== teacher.id) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        await prisma.externalExamReport.delete({
             where: { id: params.id }
         });

        return NextResponse.json({ success: true, message: "Report deleted successfully" });
    } catch (error) {
        console.error("External exam delete error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete report" }, { status: 500 });
    }
}
