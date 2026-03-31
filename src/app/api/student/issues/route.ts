import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

// GET: list student's own issues
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "STUDENT") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const student = await prisma.student.findUnique({ where: { userId: session.id } });
        if (!student) return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });

        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category"); // optional filter

        const issues = await prisma.studentIssue.findMany({
            where: { studentId: student.id, ...(category ? { category } : {}) },
            include: {
                teacher: { select: { user: { select: { name: true } } } },
                class: { select: { name: true, code: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ success: true, data: issues });
    } catch (error) {
        console.error("Get student issues error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch issues" }, { status: 500 });
    }
}

// POST: student raises a new issue/report
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "STUDENT") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { category, title, description, classId, teacherId, entityId, entityType, priority = "MEDIUM" } = body;

        if (!category || !title || !description) {
            return NextResponse.json({ success: false, error: "category, title, and description are required" }, { status: 400 });
        }

        const student = await prisma.student.findUnique({ where: { userId: session.id } });
        if (!student) return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });

        // Resolve the teacher to notify:
        // If no teacherId given but classId given, get the class teacher
        let resolvedTeacherId = teacherId || null;
        let resolvedTeacherUserId: string | null = null;

        if (!resolvedTeacherId && classId) {
            const cls = await prisma.class.findUnique({
                where: { id: classId },
                include: { teacher: { select: { id: true, userId: true } } }
            });
            if (cls?.teacher) {
                resolvedTeacherId = cls.teacher.id;
                resolvedTeacherUserId = cls.teacher.userId;
            }
        } else if (resolvedTeacherId) {
            const t = await prisma.teacher.findUnique({ where: { id: resolvedTeacherId }, select: { userId: true } });
            resolvedTeacherUserId = t?.userId || null;
        }

        const issue = await prisma.studentIssue.create({
            data: {
                studentId: student.id,
                teacherId: resolvedTeacherId,
                classId: classId || null,
                category,
                title,
                description,
                entityId: entityId || null,
                entityType: entityType || null,
                priority,
                status: "OPEN"
            }
        });

        // Log activity
        await prisma.studentActivityLog.create({
            data: {
                studentId: student.id,
                type: "COMPLAINT_RAISED",
                description: `Raised ${category} issue: ${title}`,
                classId: classId || null
            }
        }).catch(() => { }); // non-blocking

        // Notify teacher if found
        if (resolvedTeacherUserId) {
            await prisma.notification.create({
                data: {
                    userId: resolvedTeacherUserId,
                    title: `New ${category} Report from ${session.name}`,
                    message: title,
                    type: "warning",
                    link: `/dashboard/teacher/reports`
                }
            }).catch(() => { });
        }

        return NextResponse.json({ success: true, data: issue });
    } catch (error) {
        console.error("Create student issue error:", error);
        return NextResponse.json({ success: false, error: "Failed to create issue" }, { status: 500 });
    }
}

// DELETE: student deletes their own issue
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "STUDENT") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const issueId = searchParams.get("issueId");

        if (!issueId) return NextResponse.json({ success: false, error: "issueId is required" }, { status: 400 });

        const student = await prisma.student.findUnique({ where: { userId: session.id } });
        if (!student) return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });

        const issue = await prisma.studentIssue.findUnique({ where: { id: issueId } });
        if (!issue) return NextResponse.json({ success: false, error: "Issue not found" }, { status: 404 });

        if (issue.studentId !== student.id) {
            return NextResponse.json({ success: false, error: "You can only delete your own issues" }, { status: 403 });
        }

        await prisma.studentIssue.delete({ where: { id: issueId } });

        return NextResponse.json({ success: true, message: "Issue deleted" });
    } catch (error) {
        console.error("Delete student issue error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete issue" }, { status: 500 });
    }
}
