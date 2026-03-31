import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession, ensureStudentProfile } from "@/lib/auth-utils"
import { errorResponse } from "@/lib/api/helpers"
import { cache } from "@/lib/cache"
import { withPerformanceLogging } from "@/lib/performance"

// GET /api/student/exams/[id] - Get specific exam details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withPerformanceLogging("GET_EXAM_DETAIL", async () => {
        try {
            const session = await getSession()
            if (!session) return errorResponse("Unauthorized", 401)
            if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

            const resolvedParams = await params
            const examId = resolvedParams.id
            if (!examId) return errorResponse("Exam ID is required", 400)

            const cacheKey = `student_exam_detail_${session.userId}_${examId}`;
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                return NextResponse.json({ success: true, data: cachedData });
            }

            const student = await ensureStudentProfile(session.userId)
            if (!student) return errorResponse("Failed to load student profile", 500)

            // Fetch the exam and verify the student is enrolled in its class
            const exam = await prisma.exam.findUnique({
                where: { id: examId },
                include: {
                    class: {
                        include: {
                            enrollments: {
                                where: { studentId: student.id, status: "APPROVED" }
                            },
                            teacher: {
                                include: {
                                    user: { select: { name: true, image: true } }
                                }
                            }
                        }
                    },
                    attempts: {
                        where: { studentId: student.id }
                    },
                    _count: {
                        select: { questions: true }
                    }
                }
            })

            if (!exam) {
                return errorResponse("Exam not found", 404)
            }

            if (exam.class.enrollments.length === 0) {
                return errorResponse("You don't have access to this exam", 403)
            }

            const attempt = exam.attempts.length > 0 ? exam.attempts[0] : null

            // Determine the status identical to the list view logic
            const now = new Date()
            let status: string
            if (attempt) {
                if (attempt.status === "GRADED" || attempt.submittedAt) {
                    status = "COMPLETED"
                } else {
                    status = "IN_PROGRESS"
                }
            } else if (new Date(exam.endTime) < now) {
                status = "MISSED"
            } else if (new Date(exam.startTime) <= now && new Date(exam.endTime) >= now) {
                status = "AVAILABLE"
            } else {
                status = "UPCOMING"
            }

            const responseData = {
                id: exam.id,
                title: exam.title,
                description: exam.description,
                type: exam.type,
                duration: exam.duration,
                totalMarks: exam.totalMarks,
                passingMarks: exam.passingMarks,
                startTime: exam.startTime,
                endTime: exam.endTime,
                className: exam.class.name,
                classCode: exam.class.code,
                subject: exam.class.subject,
                teacher: exam.class.teacher.user,
                questionsCount: exam._count.questions,
                status,
                attempt: attempt ? {
                    id: attempt.id,
                    status: attempt.status,
                    startedAt: attempt.startedAt,
                    submittedAt: attempt.submittedAt,
                    obtainedMarks: attempt.obtainedMarks,
                    percentage: attempt.percentage,
                } : null
            };

            await cache.set(cacheKey, responseData, 60); // 1 minute cache for details

            return NextResponse.json({
                success: true,
                data: responseData
            })
        } catch (error) {
            console.error("Student single exam API error:", error)
            return errorResponse("Internal server error", 500)
        }
    });
}
