import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

// PATCH: teacher updates status/note on an issue
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ issueId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const { issueId } = await params;
        const body = await request.json();
        const { status, teacherNote } = body;

        const teacher = await prisma.teacher.findUnique({ where: { userId: session.id } });
        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

        const issue = await prisma.studentIssue.findUnique({
            where: { id: issueId },
            include: { student: { include: { user: { select: { id: true, name: true } } } } }
        });
        if (!issue) return NextResponse.json({ success: false, error: "Issue not found" }, { status: 404 });

        const updated = await prisma.studentIssue.update({
            where: { id: issueId },
            data: {
                ...(status ? { status } : {}),
                ...(teacherNote !== undefined ? { teacherNote } : {}),
                ...(status === "RESOLVED" ? { resolvedAt: new Date() } : {})
            }
        });

        // Notify student
        await prisma.notification.create({
            data: {
                userId: issue.student.user.id,
                title: `Your ${issue.category} report has been ${status || "updated"}`,
                message: teacherNote || `Your issue "${issue.title}" status changed to ${status}`,
                type: status === "RESOLVED" ? "success" : "info",
                link: `/dashboard/student/issues`
            }
        }).catch(() => { });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Update issue error:", error);
        return NextResponse.json({ success: false, error: "Failed to update issue" }, { status: 500 });
    }
}
