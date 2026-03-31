import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";
import { errorResponse } from "@/lib/api/helpers";

// GET /api/teacher/messages — List all chat rooms for the teacher
export async function GET() {
    try {
        const session = await getSession();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.role !== "TEACHER") return errorResponse("Forbidden", 403);

        const rooms = await prisma.chatRoom.findMany({
            where: { members: { some: { userId: session.id } } },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, image: true, role: true } },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                    include: { sender: { select: { name: true } } },
                },
                _count: {
                    select: {
                        messages: { where: { read: false, senderId: { not: session.id } } },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        const formatted = rooms.map((room) => {
            const otherMembers = room.members.filter((m) => m.userId !== session.id);
            const lastMsg = room.messages[0] || null;
            return {
                id: room.id,
                name: room.name || otherMembers.map((m) => m.user.name).join(", ") || "Chat",
                type: room.type,
                classId: room.classId,
                members: otherMembers.map((m) => ({
                    id: m.user.id, name: m.user.name, image: m.user.image, role: m.user.role,
                })),
                lastMessage: lastMsg
                    ? { content: lastMsg.content, senderName: lastMsg.sender.name, createdAt: lastMsg.createdAt }
                    : null,
                unreadCount: room._count.messages,
                updatedAt: room.updatedAt,
            };
        });

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        console.error("Teacher messages GET error:", error);
        return errorResponse("Internal server error", 500);
    }
}

// POST /api/teacher/messages
// action=create_direct  { recipientId }               – start/get direct chat
// action=create_class   { classId }                   – start/get class chat
// action=create_group   { name, memberIds: string[] } – create custom group
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return errorResponse("Unauthorized", 401);
        if (session.role !== "TEACHER") return errorResponse("Forbidden", 403);

        const body = await req.json();
        const { action, recipientId, classId, name, memberIds } = body;

        // ── Direct chat ────────────────────────────────────────────────
        if (action === "create_direct") {
            if (!recipientId) return errorResponse("recipientId required", 400);

            const recipient = await prisma.user.findUnique({
                where: { id: recipientId }, select: { id: true, name: true },
            });
            if (!recipient) return errorResponse("Recipient not found", 404);

            const existing = await prisma.chatRoom.findFirst({
                where: {
                    type: "DIRECT",
                    AND: [
                        { members: { some: { userId: session.id } } },
                        { members: { some: { userId: recipientId } } },
                    ],
                },
            });

            if (existing) return NextResponse.json({ success: true, data: { roomId: existing.id }, existing: true });

            const room = await prisma.chatRoom.create({
                data: {
                    type: "DIRECT",
                    members: { create: [{ userId: session.id }, { userId: recipientId }] },
                },
            });
            return NextResponse.json({ success: true, data: { roomId: room.id } });
        }

        // ── Class chat ─────────────────────────────────────────────────
        if (action === "create_class") {
            if (!classId) return errorResponse("classId required", 400);

            const teacher = await prisma.teacher.findUnique({ where: { userId: session.id } });
            if (!teacher) return errorResponse("Teacher profile not found", 404);

            const cls = await prisma.class.findFirst({
                where: { id: classId, teacherId: teacher.id },
                include: {
                    enrollments: {
                        where: { status: "APPROVED" },
                        select: { student: { select: { userId: true } } },
                    },
                },
            });
            if (!cls) return errorResponse("Class not found or not yours", 404);

            const existing = await prisma.chatRoom.findFirst({ where: { type: "CLASS", classId } });
            if (existing) return NextResponse.json({ success: true, data: { roomId: existing.id }, existing: true });

            const allMemberIds = [session.id, ...cls.enrollments.map((e) => e.student.userId)];

            const room = await prisma.chatRoom.create({
                data: {
                    type: "CLASS",
                    name: cls.name,
                    classId,
                    members: {
                        create: allMemberIds.map((uid, idx) => ({
                            userId: uid, role: idx === 0 ? "ADMIN" : "MEMBER",
                        })),
                    },
                },
            });
            return NextResponse.json({ success: true, data: { roomId: room.id } });
        }

        // ── Custom group ───────────────────────────────────────────────
        if (action === "create_group") {
            if (!name?.trim()) return errorResponse("Group name required", 400);
            if (!Array.isArray(memberIds) || memberIds.length === 0) {
                return errorResponse("At least one member required", 400);
            }

            // Validate all member user IDs exist
            const users = await prisma.user.findMany({
                where: { id: { in: memberIds } },
                select: { id: true },
            });
            if (users.length !== memberIds.length) return errorResponse("Some members were not found", 400);

            const room = await prisma.chatRoom.create({
                data: {
                    type: "GROUP",
                    name: name.trim(),
                    members: {
                        create: [
                            { userId: session.id, role: "ADMIN" },
                            ...memberIds.filter((id: string) => id !== session.id).map((uid: string) => ({
                                userId: uid, role: "MEMBER",
                            })),
                        ],
                    },
                },
            });
            return NextResponse.json({ success: true, data: { roomId: room.id } });
        }

        return errorResponse("Invalid action", 400);
    } catch (error) {
        console.error("Teacher messages POST error:", error);
        return errorResponse("Internal server error", 500);
    }
}
