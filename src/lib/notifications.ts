import { prisma } from "@/lib/prisma";

export type NotificationType = "info" | "success" | "warning" | "error";

interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
}

/**
 * Create a new notification for a user
 */
export async function createNotification({
    userId,
    title,
    message,
    type = "info",
    link,
}: CreateNotificationParams) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                link,
                read: false,
            },
        });
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        // Don't throw error to prevent blocking main flow
        return null;
    }
}

/**
 * Create multiple notifications (bulk)
 */
export async function createNotifications(notifications: CreateNotificationParams[]) {
    try {
        const result = await prisma.notification.createMany({
            data: notifications.map(n => ({
                userId: n.userId,
                title: n.title,
                message: n.message,
                type: n.type || "info",
                link: n.link,
                read: false,
            })),
        });
        return result.count;
    } catch (error) {
        console.error("Error creating notifications:", error);
        return 0;
    }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
    try {
        await prisma.notification.update({
            where: {
                id: notificationId,
                userId, // Security check: ensure notification belongs to user
            },
            data: {
                read: true,
            },
        });
        return true;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return false;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
    try {
        await prisma.notification.updateMany({
            where: {
                userId,
                read: false,
            },
            data: {
                read: true,
            },
        });
        return true;
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
    }
}

/**
 * Delete old notifications (older than 7 days)
 */
export async function deleteOldNotifications() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: sevenDaysAgo,
                },
            },
        });
        return result.count;
    } catch (error) {
        console.error("Error deleting old notifications:", error);
        return 0;
    }
}

/**
 * Delete a single notification by id (with ownership check)
 */
export async function deleteNotificationById(notificationId: string, userId: string) {
    try {
        await prisma.notification.delete({
            where: {
                id: notificationId,
                userId, // Security: only delete if it belongs to the user
            },
        });
        return true;
    } catch (error) {
        console.error("Error deleting notification:", error);
        return false;
    }
}

/**
 * Delete all read notifications for a user
 */
export async function deleteAllReadNotifications(userId: string) {
    try {
        const result = await prisma.notification.deleteMany({
            where: {
                userId,
                read: true,
            },
        });
        return result.count;
    } catch (error) {
        console.error("Error deleting read notifications:", error);
        return 0;
    }
}

