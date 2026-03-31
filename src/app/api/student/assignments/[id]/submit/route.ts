import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await getSession()
        if (!session || session.role !== "STUDENT") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const assignmentId = params.id
        if (!assignmentId) return NextResponse.json({ success: false, error: "Assignment ID required" }, { status: 400 })

        const { content, attachments } = await request.json()

        if (!content) {
            return NextResponse.json({ success: false, error: "Submission content is required" }, { status: 400 })
        }

        const student = await prisma.student.findUnique({
            where: { userId: session.id },
            include: {
                classEnrollments: {
                    where: { status: "APPROVED" },
                    select: { classId: true }
                }
            }
        })

        if (!student) {
            return NextResponse.json({ success: false, error: "Student profile not found" }, { status: 404 })
        }

        // Verify assignment exists and student is in the class
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                class: {
                    select: {
                        teacher: {
                            select: { userId: true }
                        }
                    }
                }
            }
        })

        if (!assignment || !assignment.isActive) {
            return NextResponse.json({ success: false, error: "Assignment not found or inactive" }, { status: 404 })
        }

        const isEnrolled = student.classEnrollments.some((e: { classId: string }) => e.classId === assignment.classId)
        if (!isEnrolled) {
            return NextResponse.json({ success: false, error: "Not enrolled in this class" }, { status: 403 })
        }

        // Check if past due date
        if (new Date(assignment.dueDate) < new Date()) {
            return NextResponse.json({ success: false, error: "Assignment deadline has passed" }, { status: 400 })
        }

        // Calculate gamification streak
        const now = new Date();
        let newStreak = 1;
        if (student.lastActivityDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const lastActivityDay = new Date(student.lastActivityDate);
            lastActivityDay.setHours(0, 0, 0, 0);

            const diffDays = Math.round((today.getTime() - lastActivityDay.getTime()) / (1000 * 3600 * 24));

            if (diffDays === 1) {
                newStreak = (student.currentStreak || 0) + 1;
            } else if (diffDays === 0) {
                newStreak = student.currentStreak || 1;
            } else {
                newStreak = 1;
            }
        }

        const longestStreak = Math.max(student.longestStreak || 0, newStreak);

        // Check if already submitted
        const existingSubmission = await prisma.submission.findFirst({
            where: {
                assignmentId,
                studentId: student.id
            }
        })

        if (existingSubmission) {
            // Update existing if not graded
            if (existingSubmission.status === "GRADED") {
                return NextResponse.json({ success: false, error: "Cannot modify a graded assignment" }, { status: 400 })
            }

            const [updated] = await prisma.$transaction([
                prisma.submission.update({
                    where: { id: existingSubmission.id },
                    data: {
                        content,
                        attachments: attachments ? JSON.stringify(attachments) : null,
                        submittedAt: now
                    }
                }),
                prisma.student.update({
                    where: { id: student.id },
                    data: {
                        currentStreak: newStreak,
                        longestStreak: longestStreak,
                        lastActivityDate: now
                    }
                }),
                prisma.notification.create({
                    data: {
                        userId: assignment.class.teacher.userId,
                        title: "Assignment Updated",
                        message: `${session.name || 'A student'} has updated their submission for: ${assignment.title}`,
                        type: "info",
                        link: `/dashboard/teacher/assignments/${assignment.id}`
                    }
                })
            ]);
            return NextResponse.json({ success: true, data: updated })
        }

        // Create new submission with points logic
        const earnedPoints = 50; // Base points for new submission

        const [newSubmission] = await prisma.$transaction([
            prisma.submission.create({
                data: {
                    assignmentId,
                    studentId: student.id,
                    content,
                    attachments: attachments ? JSON.stringify(attachments) : null,
                    status: "SUBMITTED",
                    submittedAt: now
                }
            }),
            prisma.student.update({
                where: { id: student.id },
                data: {
                    points: { increment: earnedPoints },
                    currentStreak: newStreak,
                    longestStreak: longestStreak,
                    lastActivityDate: now
                }
            }),
            prisma.notification.create({
                data: {
                    userId: assignment.class.teacher.userId,
                    title: "New Assignment Submission",
                    message: `${session.name || 'A student'} has submitted the assignment: ${assignment.title}`,
                    type: "success",
                    link: `/dashboard/teacher/assignments/${assignment.id}`
                }
            })
        ]);

        return NextResponse.json({ success: true, data: newSubmission, pointsEarned: earnedPoints }, { status: 201 })
    } catch (error) {
        console.error("Error submitting assignment:", error)
        return NextResponse.json({ success: false, error: "Failed to submit assignment" }, { status: 500 })
    }
}
