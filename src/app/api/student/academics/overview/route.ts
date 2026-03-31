import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession, ensureStudentProfile } from "@/lib/auth-utils"
import { errorResponse } from "@/lib/api/helpers"
import { cache } from "@/lib/cache"
import { withPerformanceLogging } from "@/lib/performance"

export async function GET(req: NextRequest) {
    return withPerformanceLogging("STUDENT_ACADEMICS_OVERVIEW", async () => {
        try {
            const session = await getSession()
            if (!session) return errorResponse("Unauthorized", 401)
            if (session.role !== "STUDENT") return errorResponse("Forbidden", 403)

            const cacheKey = `student_academics_overview_${session.id}`;
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                return NextResponse.json({ success: true, data: cachedData });
            }

            const student = await ensureStudentProfile(session.userId)
            if (!student) return errorResponse("Failed to load student profile", 500)

            // 1. Fetch Student Details
            const studentInfo = {
                name: session.name,
                email: session.email,
                department: student.department || "General",
                semester: student.semester || 1,
                section: student.section || "A",
                enrollmentNo: student.enrollmentNo || "N/A"
            }

            // 2. Fetch Enrolled Classes & Tutors
            const enrollments = await prisma.classEnrollment.findMany({
                where: { studentId: student.id, status: "APPROVED" },
                include: {
                    class: {
                        include: {
                            teacher: {
                                include: { user: { select: { name: true, image: true } } }
                            }
                        }
                    }
                }
            })

            const classes = enrollments.map(e => ({
                id: e.class.id,
                name: e.class.name,
                code: e.class.code,
                teacher: e.class.teacher.user.name
            }))
            const classIds = classes.map(c => c.id)

            // 3. Exam Overview
            const exams = await prisma.exam.findMany({
                where: { classId: { in: classIds }, isActive: true },
                include: {
                    attempts: { where: { studentId: student.id } }
                }
            })

            let totalExamScore = 0
            let totalPossibleExamScore = 0
            let examsAttempted = 0

            exams.forEach(exam => {
                const attempt = exam.attempts[0]
                if (attempt && attempt.obtainedMarks !== null) {
                    examsAttempted++
                    totalExamScore += attempt.obtainedMarks
                    totalPossibleExamScore += exam.totalMarks
                }
            })

            const examAvg = totalPossibleExamScore > 0 ? Math.round((totalExamScore / totalPossibleExamScore) * 100) : 0

            // 4. Assignments Overview 
            const assignments = await prisma.assignment.findMany({
                where: { classId: { in: classIds }, isActive: true },
                include: {
                    submissions: { where: { studentId: student.id } }
                }
            })

            const totalAssignments = assignments.length
            let submittedAssignments = 0
            let totalAssignmentScore = 0
            let possibleAssignmentScore = 0

            assignments.forEach(assignment => {
                const submission = assignment.submissions[0]
                if (submission) {
                    submittedAssignments++
                    if (submission.marks !== null) {
                        totalAssignmentScore += submission.marks
                        possibleAssignmentScore += assignment.totalMarks
                    }
                }
            })

            const pendingAssignments = totalAssignments - submittedAssignments
            const assignmentAvg = possibleAssignmentScore > 0 ? Math.round((totalAssignmentScore / possibleAssignmentScore) * 100) : 0

            // 5. Attendance Overview
            const attendanceRecords = await prisma.attendance.findMany({
                where: { studentId: student.id }
            })

            const totalClassesCount = attendanceRecords.length
            const presentClasses = attendanceRecords.filter(a => a.status === "PRESENT").length
            const attendanceRate = totalClassesCount > 0 ? Math.round((presentClasses / totalClassesCount) * 100) : 100 // default 100 if no records

            // 6. External Exams
            const externalExams = await prisma.externalExamReport.findMany({
                where: { studentId: student.id },
                include: { class: { select: { name: true, code: true } } }
            })

            let combinedExamScore = totalExamScore
            let combinedPossibleExamScore = totalPossibleExamScore

            externalExams.forEach((e: any) => {
                combinedExamScore += e.obtainedMarks
                combinedPossibleExamScore += e.totalMarks
            })

            const combinedExamAvg = combinedPossibleExamScore > 0 ? Math.round((combinedExamScore / combinedPossibleExamScore) * 100) : examAvg

            // 6. Upcoming Events
            const now = new Date()
            const upcomingEvents = await prisma.event.findMany({
                where: {
                    OR: [
                        { classId: { in: classIds } },
                        { isGlobal: true }
                    ],
                    startDate: { gte: now }
                },
                orderBy: { startDate: "asc" },
                take: 5
            })

            const finalData = {
                student: studentInfo,
                classes,
                examStats: {
                    total: exams.length + externalExams.length,
                    attempted: examsAttempted + externalExams.length,
                    average: combinedExamAvg
                },
                externalExams: externalExams.map((e: any) => ({
                    id: e.id,
                    examType: e.examType,
                    testName: e.testName,
                    obtainedMarks: e.obtainedMarks,
                    totalMarks: e.totalMarks,
                    percentage: e.percentage,
                    note: e.note,
                    className: e.class.name,
                    classCode: e.class.code,
                    createdAt: e.createdAt
                })),
                assignmentStats: {
                    total: totalAssignments,
                    submitted: submittedAssignments,
                    pending: pendingAssignments,
                    average: assignmentAvg
                },
                attendanceStats: {
                    total: totalClassesCount,
                    present: presentClasses,
                    rate: attendanceRate
                },
                upcomingEvents: upcomingEvents.map(e => ({
                    id: e.id,
                    title: e.title,
                    type: e.type,
                    startDate: e.startDate
                }))
            };

            await cache.set(cacheKey, finalData, 300); // 5 minute cache

            return NextResponse.json({
                success: true,
                data: finalData
            })
        } catch (error) {
            console.error("Student academics overview API error:", error)
            return errorResponse("Internal server error", 500)
        }
    });
}
