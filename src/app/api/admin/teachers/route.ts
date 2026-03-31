import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/helpers";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return errorResponse("Forbidden", 403);
        }

        const teachers = await prisma.teacher.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                user: {
                    name: "asc",
                },
            },
        });

        const formattedTeachers = teachers.map((t) => ({
            id: t.id,
            name: t.user.name,
            email: t.user.email,
        }));

        return NextResponse.json({ success: true, data: formattedTeachers });
    } catch (error) {
        console.error("Fetch teachers error:", error);
        return errorResponse("Internal server error", 500);
    }
}
