import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";
import { errorResponse } from "@/lib/api/helpers";

type RouteParams = { params: Promise<{ roomId: string }> };

// POST /api/teacher/messages/[roomId]/report
// Body: { messageId, reason }
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await getSession();
        if (!session) return errorResponse("Unauthorized", 401);

        const { roomId } = await params;
        const { messageId, reason } = await req.json();

        if (!messageId || !reason?.trim()) {
            return errorResponse("messageId and reason are required", 400);
        }

        // Verify the message exists in this room and the reporter is a member
        const [message, membership] = await Promise.all([
            prisma.message.findFirst({ where: { id: messageId, roomId }, include: { sender: { select: { name: true } } } }),
            prisma.chatRoomMember.findFirst({ where: { roomId, userId: session.id } }),
        ]);

        if (!membership) return errorResponse("Not a member of this room", 403);
        if (!message) return errorResponse("Message not found", 404);

        // Store the report as a Notification to all admin users
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
        });

        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.id,
                    title: "Message Reported",
                    message: `User ${session.name} reported a message from ${message.sender.name}: "${message.content.slice(0, 100)}${message.content.length > 100 ? "..." : ""}". Reason: ${reason.trim()}`,
                    type: "warning",
                    link: "/dashboard/admin",
                })),
            });
        }

        return NextResponse.json({ success: true, message: "Report submitted. An admin will review it." });
    } catch (error) {
        console.error("Report message error:", error);
        return errorResponse("Internal server error", 500);
    }
}
