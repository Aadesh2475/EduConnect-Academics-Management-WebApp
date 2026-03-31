import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await getSession();

        if (!session || session.role !== "TEACHER") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const classId = searchParams.get("classId");

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id }
        });

        if (!teacher) {
            return NextResponse.json(
                { success: false, error: "Teacher profile not found" },
                { status: 404 }
            );
        }

        // Get all classes for this teacher
        const classes = await prisma.class.findMany({
            where: { teacherId: teacher.id },
            select: { id: true }
        });

        const classIds = classes.map(c => c.id);

        if (classIds.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Build query
        const where: any = {
            assignment: {
                classId: classId ? classId : { in: classIds }
            }
        };

        if (status) {
            where.status = status;
        } else {
            // Default to showing submitted and graded, maybe not pending if not relevant?
            // Actually usually we want everything that IS submitted
            where.status = { in: ["SUBMITTED", "GRADED"] };
        }

        const submissions = await prisma.submission.findMany({
            where,
            include: {
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        totalMarks: true,
                        class: {
                            select: { name: true, code: true }
                        }
                    }
                },
                student: {
                    include: {
                        user: {
                            select: { name: true, email: true, image: true }
                        }
                    }
                }
            },
            orderBy: { submittedAt: "desc" }
        });

        return NextResponse.json({
            success: true,
            data: submissions.map(sub => ({
                id: sub.id,
                status: sub.status,
                submittedAt: sub.submittedAt,
                marks: sub.marks,
                feedback: sub.feedback,
                assignment: {
                    id: sub.assignment.id,
                    title: sub.assignment.title,
                    totalMarks: sub.assignment.totalMarks,
                    className: sub.assignment.class.name,
                    classCode: sub.assignment.class.code,
                },
                student: {
                    id: sub.student.id,
                    name: sub.student.user.name,
                    email: sub.student.user.email,
                    image: sub.student.user.image,
                }
            }))
        });

    } catch (error) {
        console.error("Error fetching submissions:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch submissions" },
            { status: 500 }
        );
    }
}
