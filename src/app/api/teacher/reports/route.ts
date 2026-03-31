import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

// GET: teacher views all issues raised by students in their classes
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const teacher = await prisma.teacher.findUnique({ where: { userId: session.id } });
        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const status = searchParams.get("status");
        const classId = searchParams.get("classId");

        // Get all class IDs the teacher owns
        const classes = await prisma.class.findMany({
            where: { teacherId: teacher.id },
            select: { id: true }
        });
        const classIds = classes.map(c => c.id);

        // Get all student IDs enrolled in those classes to show general reports
        const enrollments = await prisma.classEnrollment.findMany({
            where: { classId: { in: classIds }, status: "APPROVED" },
            select: { studentId: true }
        });
        const enrolledStudentIds = Array.from(new Set(enrollments.map(e => e.studentId)));

        // Build filter: 
        // 1. Issues specifically assigned to this teacher
        // 2. Issues linked to one of this teacher's classes
        // 3. General issues from students enrolled in this teacher's classes
        const where: any = {
            OR: [
                { teacherId: teacher.id },
                { classId: { in: classIds } },
                { studentId: { in: enrolledStudentIds }, teacherId: null, classId: null }
            ],
            ...(category ? { category } : {}),
            ...(status ? { status } : {}),
            ...(classId ? { classId } : {})
        };

        const issues = await prisma.studentIssue.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: { select: { id: true, name: true, email: true, image: true } }
                    }
                },
                class: { select: { name: true, code: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        // Group by category for summary counts
        const categoryCounts: Record<string, number> = {};
        const statusCounts: Record<string, number> = {};
        issues.forEach(issue => {
            categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
            statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
        });

        // Get class list for filter dropdown
        const allClasses = await prisma.class.findMany({
            where: { teacherId: teacher.id },
            select: { id: true, name: true, code: true }
        });

        return NextResponse.json({
            success: true,
            data: { issues, categoryCounts, statusCounts, classes: allClasses }
        });
    } catch (error) {
        console.error("Teacher reports error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch reports" }, { status: 500 });
    }
}
