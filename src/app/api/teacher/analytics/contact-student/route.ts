import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { studentUserId, message, type } = body; // type: "DIRECT" | "NOTIFICATION"

        if (!studentUserId || !message) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // Find or create a direct chat room between teacher and student
        const teacherUserId = session.id;
        const studentUser = await prisma.user.findUnique({ where: { id: studentUserId } });
        if (!studentUser) return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });

        // Check for existing direct room
        let chatRoom = await prisma.chatRoom.findFirst({
            where: {
                type: "DIRECT",
                members: {
                    every: {
                        userId: { in: [teacherUserId, studentUserId] }
                    }
                }
            },
            include: { members: true }
        });

        if (!chatRoom || chatRoom.members.length !== 2) {
            // Create new direct room
            chatRoom = await prisma.chatRoom.create({
                data: {
                    type: "DIRECT",
                    members: {
                        create: [
                            { userId: teacherUserId, role: "ADMIN" },
                            { userId: studentUserId, role: "MEMBER" }
                        ]
                    }
                },
                include: { members: true }
            });
        }

        // Send the message
        const newMessage = await prisma.message.create({
            data: {
                content: message,
                senderId: teacherUserId,
                receiverId: studentUserId,
                roomId: chatRoom.id,
            }
        });

        // Create notification for student
        await prisma.notification.create({
            data: {
                userId: studentUserId,
                title: "New Message from Teacher",
                message: message.length > 100 ? message.substring(0, 100) + "..." : message,
                type: "info",
                link: `/dashboard/student/messages`
            }
        });

        return NextResponse.json({
            success: true,
            data: { message: newMessage, roomId: chatRoom.id }
        });

    } catch (error) {
        console.error("Contact student error:", error);
        return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
    }
}
