import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id },
      select: { id: true }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student profile not found" },
        { status: 404 }
      );
    }

    // @ts-ignore
    const certificates = await prisma.certificate.findMany({
      where: { studentId: student.id },
      include: {
        class: { select: { name: true, code: true, subject: true } },
        teacher: { include: { user: { select: { name: true } } } }
      },
      orderBy: { issueDate: "desc" }
    });

    return NextResponse.json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    console.error("Fetch certificates error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}
