import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403);
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        });

        if (!teacher) {
            return errorResponse("Teacher profile not found", 404);
        }

        const announcements = await prisma.announcement.findMany({
            where: { teacherId: teacher.id },
            include: {
                class: {
                    select: {
                        name: true,
                        code: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ success: true, data: announcements });
    } catch (error) {
        console.error("Fetch announcements error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "TEACHER") {
            return errorResponse("Forbidden", 403);
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.userId }
        });

        if (!teacher) {
            return errorResponse("Teacher profile not found", 404);
        }

        const { title, content, classIds, isGlobal, priority } = await request.json();

        if (!title || !content) {
            return errorResponse("Title and content are required", 400);
        }

        if (isGlobal) {
            await prisma.announcement.create({
                data: {
                    title,
                    content,
                    teacherId: teacher.id,
                    isGlobal: true,
                    priority: priority || "NORMAL",
                }
            });
        } else if (classIds && Array.isArray(classIds)) {
            // Create one record per class as requested by the schema
            const creations = classIds.map(classId =>
                prisma.announcement.create({
                    data: {
                        title,
                        content,
                        teacherId: teacher.id,
                        classId,
                        isGlobal: false,
                        priority: priority || "NORMAL",
                    }
                })
            );
            await Promise.all(creations);
        }

        return NextResponse.json({ success: true, message: "Announcement(s) created successfully" });
    } catch (error) {
        console.error("Create announcement error:", error);
        return errorResponse("Internal server error", 500);
    }
}
