import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteOldNotifications,
  deleteNotificationById,
  deleteAllReadNotifications,
} from "@/lib/notifications";


// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: User can request to clean up their old notifications
    const searchParams = request.nextUrl.searchParams;
    if (searchParams.get("cleanup") === "true") {
      // Run cleanup async (don't wait)
      deleteOldNotifications().catch(err => console.error("Cleanup error:", err));
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to recent 50
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.userId,
        read: false
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await markAllNotificationsAsRead(session.userId);
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (notificationId) {
      await markNotificationAsRead(notificationId, session.userId);
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a single notification or all read notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    // Delete single notification by id
    if (id) {
      const success = await deleteNotificationById(id, session.userId);
      if (!success) {
        return NextResponse.json({ error: "Notification not found or access denied" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Notification deleted" });
    }

    // Delete all read notifications for the user
    if (all === "true") {
      const count = await deleteAllReadNotifications(session.userId);
      return NextResponse.json({ success: true, message: `Deleted ${count} read notifications`, count });
    }

    return NextResponse.json({ error: "Provide ?id=<id> or ?all=true" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
