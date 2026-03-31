import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

// DELETE: teacher deletes an issue
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ issueId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const { issueId } = await params;

        const teacher = await prisma.teacher.findUnique({ where: { userId: session.id } });
        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

        const issue = await prisma.studentIssue.findUnique({
            where: { id: issueId },
            include: { student: true }
        });
        if (!issue) return NextResponse.json({ success: false, error: "Issue not found" }, { status: 404 });

        // Build teacher identification logic:
        // Teacher can delete if:
        // 1. They are the target teacher (issue.teacherId)
        // 2. The issue is linked to one of their classes (issue.classId)
        // 3. The student is enrolled in one of their classes (general issues)
        
        let canDelete = false;
        if (issue.teacherId === teacher.id) {
            canDelete = true;
        } else if (issue.classId) {
            const cls = await prisma.class.findUnique({ where: { id: issue.classId } });
            if (cls?.teacherId === teacher.id) canDelete = true;
        } else {
            // General issue: check if student is enrolled in any of this teacher's classes
            const classes = await prisma.class.findMany({
                where: { teacherId: teacher.id },
                select: { id: true }
            });
            const classIds = classes.map(c => c.id);
            const enrollment = await prisma.classEnrollment.findFirst({
                where: { studentId: issue.studentId, classId: { in: classIds }, status: "APPROVED" }
            });
            if (enrollment) canDelete = true;
        }

        if (!canDelete) {
            return NextResponse.json({ success: false, error: "You do not have permission to delete this issue" }, { status: 403 });
        }

        await prisma.studentIssue.delete({ where: { id: issueId } });

        return NextResponse.json({ success: true, message: "Issue deleted" });
    } catch (error) {
        console.error("Delete teacher report error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete issue" }, { status: 500 });
    }
}
