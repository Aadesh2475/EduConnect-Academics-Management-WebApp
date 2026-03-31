import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { deleteOldNotifications } from "@/lib/notifications";

export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const count = await deleteOldNotifications();

        return NextResponse.json({
            success: true,
            message: `Deleted ${count} old notifications`,
            count,
        });
    } catch (error) {
        console.error("Error cleaning up notifications:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
