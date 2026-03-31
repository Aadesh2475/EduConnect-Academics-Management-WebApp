import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "TEACHER") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { subject, description, category } = await req.json();

        if (!subject || !description || !category) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const helpTicket = await prisma.helpTicket.create({
            data: {
                userId: session.id,
                subject,
                description,
                category,
                status: "OPEN",
                priority: "MEDIUM"
            },
        });

        return NextResponse.json({ success: true, data: helpTicket });
    } catch (error) {
        console.error("Failed to submit help ticket:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit help ticket" },
            { status: 500 }
        );
    }
}
