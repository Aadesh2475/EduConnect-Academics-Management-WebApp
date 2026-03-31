import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { after } from "next/server";
import { withPerformanceLogging } from "@/lib/performance";

export async function POST(req: Request) {
  return withPerformanceLogging("GENERATE_CERTIFICATE", async () => {
    try {
      const session = await getSession();

      if (!session || session.role !== "TEACHER") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const { studentId, classId, templateType, grade, metadata } = await req.json();

      if (!studentId || !classId) {
        return NextResponse.json(
          { success: false, error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Get teacher and verify ownership of the class
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.id },
        include: { classes: { where: { id: classId } } }
      });

      if (!teacher || teacher.classes.length === 0) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: You do not teach this class" },
          { status: 403 }
        );
      }

      // Generate unique certificate number
      const year = new Date().getFullYear();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const certificateNo = `EDU-${year}-${classId.substring(0, 3).toUpperCase()}-${randomSuffix}`;

      // Create the certificate
      // @ts-ignore - Ignoring due to potential prisma generate lag
      const certificate = await prisma.certificate.create({
        data: {
          certificateNo,
          studentId,
          classId,
          teacherId: teacher.id,
          templateType: templateType || "COMPLETION",
          grade,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
        include: {
          student: { include: { user: { select: { name: true } } } },
          class: { select: { name: true } },
        }
      });

      // Offload notification to background
      after(async () => {
        await withPerformanceLogging("CERTIFICATE_NOTIFICATION", async () => {
          const studentUser = await prisma.student.findUnique({
            where: { id: studentId },
            select: { userId: true }
          });

          if (studentUser) {
            await prisma.notification.create({
              data: {
                userId: studentUser.userId,
                title: "Certificate Issued! 🎓",
                message: `Congratulations! You've been awarded a certificate for ${certificate.class.name}.`,
                type: "success",
                link: `/dashboard/student/certificates`,
              }
            });
          }
        });
      });

      return NextResponse.json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      console.error("Certificate generation error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to generate certificate" },
        { status: 500 }
      );
    }
  });
}
