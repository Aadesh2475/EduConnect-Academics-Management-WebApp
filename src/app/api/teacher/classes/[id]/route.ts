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
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id }
        });

        if (!teacher) {
            return NextResponse.json(
                { success: false, error: "Teacher profile not found" },
                { status: 404 }
            );
        }

        const classData = await prisma.class.findUnique({
            where: {
                id,
                teacherId: teacher.id
            },
            include: {
                _count: {
                    select: {
                        enrollments: { where: { status: "APPROVED" } },
                        assignments: true,
                        exams: true,
                        materials: true,
                    }
                },
                enrollments: {
                    where: { status: "APPROVED" },
                    take: 5,
                    orderBy: { createdAt: "desc" },
                    include: {
                        student: {
                            include: { user: { select: { name: true, email: true, image: true } } }
                        }
                    }
                },
                assignments: {
                    take: 5,
                    orderBy: { dueDate: "asc" },
                    where: { dueDate: { gte: new Date() } }
                },
                exams: {
                    take: 5,
                    orderBy: { startTime: "asc" },
                    where: { startTime: { gte: new Date() } }
                }
            }
        });

        if (!classData) {
            return NextResponse.json(
                { success: false, error: "Class not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...classData,
                studentCount: classData._count.enrollments,
                assignmentCount: classData._count.assignments,
                examCount: classData._count.exams,
                materialCount: classData._count.materials,
                recentStudents: classData.enrollments.map(e => ({
                    id: e.student.id,
                    name: e.student.user.name,
                    email: e.student.user.email,
                    image: e.student.user.image,
                })),
                ongoingAssignments: classData.assignments,
                upcomingExams: classData.exams
            }
        });

    } catch (error) {
        console.error("Error fetching class details:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch class details" },
            { status: 500 }
        );
    }
}

// PUT /api/teacher/classes/[id] - Update class details
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id }
        });

        if (!teacher) {
            return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 });
        }

        // Verify ownership
        const existingClass = await prisma.class.findUnique({
            where: { id, teacherId: teacher.id }
        });

        if (!existingClass) {
            return NextResponse.json({ success: false, error: "Class not found or unauthorized" }, { status: 404 });
        }

        const updatedClass = await prisma.class.update({
            where: { id },
            data: {
                name: body.name,
                description: body.description,
                department: body.department,
                semester: body.semester ? parseInt(body.semester) : undefined,
                subject: body.subject,
                isActive: body.isActive
            }
        });

        return NextResponse.json({ success: true, data: updatedClass });

    } catch (error) {
        console.error("Error updating class:", error);
        return NextResponse.json({ success: false, error: "Failed to update class" }, { status: 500 });
    }
}

// DELETE /api/teacher/classes/[id] - Delete a class
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id }
        });

        if (!teacher) {
            return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 });
        }

        // Verify ownership
        const existingClass = await prisma.class.findUnique({
            where: { id, teacherId: teacher.id }
        });

        if (!existingClass) {
            return NextResponse.json({ success: false, error: "Class not found or unauthorized" }, { status: 404 });
        }

        await prisma.class.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Class deleted successfully" });

    } catch (error) {
        console.error("Error deleting class:", error);
        return NextResponse.json({ success: false, error: "Failed to delete class" }, { status: 500 });
    }
}
