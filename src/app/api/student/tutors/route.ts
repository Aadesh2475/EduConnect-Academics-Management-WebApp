import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET() {
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
        });

        if (!student) {
            return NextResponse.json(
                { success: false, error: "Student profile not found" },
                { status: 404 }
            );
        }

        // Fetch all classes the student is enrolled in with teacher info
        const enrollments = await prisma.classEnrollment.findMany({
            where: {
                studentId: student.id,
                status: "APPROVED" // Only show teachers from approved classes
            },
            include: {
                class: {
                    include: {
                        teacher: {
                            include: {
                                user: {
                                    select: { name: true, email: true, image: true, id: true }
                                },
                                teacherRatings: true // Include ratings to calculate average
                            }
                        }
                    }
                }
            }
        });

        // Extract unique tutors and calculate their stats
        const uniqueTutors = new Map();

        for (const enrollment of enrollments) {
            const teacher = enrollment.class.teacher;
            if (!teacher || !teacher.user) continue;

            if (!uniqueTutors.has(teacher.id)) {
                // Calculate average rating across ALL ratings for this teacher
                let avgRating = 4.5; // Default if no ratings exist
                let ratingCount = 0;

                if (teacher.teacherRatings && teacher.teacherRatings.length > 0) {
                    const sum = teacher.teacherRatings.reduce((acc: number, curr: any) => acc + curr.rating, 0);
                    avgRating = Number((sum / teacher.teacherRatings.length).toFixed(1));
                    ratingCount = teacher.teacherRatings.length;
                }

                const studentRatingEntry = teacher.teacherRatings.find((r: any) => r.studentId === student.id);

                uniqueTutors.set(teacher.id, {
                    id: teacher.id,
                    userId: teacher.userId, // User ID needed for messaging
                    name: teacher.user.name,
                    email: teacher.user.email,
                    image: teacher.user.image,
                    department: teacher.department || "General",
                    subject: teacher.subject || "Various",
                    rating: avgRating,
                    ratingCount: ratingCount,
                    classesCount: 1,
                    myRating: studentRatingEntry?.rating || 0,
                    myReview: studentRatingEntry?.review || ""
                });
            } else {
                // Just increment class count if already added
                const existing = uniqueTutors.get(teacher.id);
                existing.classesCount++;
            }
        }

        return NextResponse.json({
            success: true,
            data: Array.from(uniqueTutors.values())
        });

    } catch (error) {
        console.error("Failed to load tutors:", error);
        return NextResponse.json(
            { success: false, error: "Failed to load tutors" },
            { status: 500 }
        );
    }
}
