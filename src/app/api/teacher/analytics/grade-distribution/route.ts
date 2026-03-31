import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (session.role !== "TEACHER") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const classFilter = searchParams.get("classId") || "all";
        const search = searchParams.get("search") || "";

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            select: { id: true, classes: { where: { isActive: true }, select: { id: true, name: true, code: true, department: true, semester: true } } }
        });

        if (!teacher) return NextResponse.json({ success: true, data: { students: [], classes: [] } });

        const teacherClassIds = teacher.classes.map((c: any) => c.id);
        const filteredClassIds = classFilter !== "all"
            ? teacherClassIds.filter((id: string) => id === classFilter)
            : teacherClassIds;

        if (filteredClassIds.length === 0)
            return NextResponse.json({ success: true, data: { students: [], classes: teacher.classes } });

        // Fetch each enrolled student with their submissions and exam attempts
        const enrollments = await prisma.classEnrollment.findMany({
            where: { classId: { in: filteredClassIds }, status: "APPROVED" },
            select: {
                classId: true,
                student: {
                    select: {
                        id: true,
                        department: true,
                        semester: true,
                        user: { select: { name: true, email: true, image: true } },
                        submissions: {
                            where: { assignment: { classId: { in: filteredClassIds } } },
                            select: {
                                status: true,
                                marks: true,
                                assignment: { select: { classId: true, totalMarks: true, title: true } }
                            }
                        },
                        examAttempts: {
                            where: { status: "SUBMITTED", exam: { classId: { in: filteredClassIds } } },
                            select: {
                                percentage: true,
                                obtainedMarks: true,
                                totalMarks: true,
                                exam: { select: { classId: true, title: true, totalMarks: true } }
                            }
                        },
                        attendances: {
                            where: { session: { classId: { in: filteredClassIds } } },
                            select: { status: true, session: { select: { classId: true } } }
                        },
                        externalExams: {
                            where: { classId: { in: filteredClassIds } },
                            select: { obtainedMarks: true, totalMarks: true, percentage: true, classId: true }
                        }
                    }
                }
            }
        });

        // Build a map of classId → class info
        const classMap = new Map(teacher.classes.map((c: any) => [c.id, c]));

        // Aggregate by studentId
        const studentAggregator = new Map<string, any>();

        for (const enr of enrollments) {
            const cls = classMap.get(enr.classId) as any;
            if (!cls) continue;

            const student = enr.student;
            
            if (search && !student.user.name.toLowerCase().includes(search.toLowerCase()) &&
                !student.user.email.toLowerCase().includes(search.toLowerCase())) continue;

            if (!studentAggregator.has(student.id)) {
                studentAggregator.set(student.id, {
                    studentId: student.id,
                    name: student.user.name,
                    email: student.user.email,
                    image: student.user.image,
                    classes: [],
                    department: student.department || cls.department,
                    semester: student.semester ?? cls.semester,
                    totalGradedSubs: 0,
                    totalSubScore: 0,
                    totalExamScores: [],
                    totalAttended: 0,
                    totalSessions: 0,
                    totalExamsCount: 0
                });
            }

            const agg = studentAggregator.get(student.id);
            agg.classes.push({ id: enr.classId, name: cls.name, code: cls.code });

            // --- Assignment info for this specific class ---
            const classSubs = student.submissions.filter((s: any) => s.assignment.classId === enr.classId);
            const gradedSubs = classSubs.filter((s: any) => s.status === "GRADED" && s.marks != null);
            gradedSubs.forEach((s: any) => {
                const total = s.assignment.totalMarks && s.assignment.totalMarks > 0 ? s.assignment.totalMarks : 100;
                agg.totalSubScore += (s.marks / total) * 100;
                agg.totalGradedSubs++;
            });

            // --- Exam info for this specific class ---
            const classAttempts = student.examAttempts.filter((a: any) => a.exam.classId === enr.classId);
            agg.totalExamsCount += classAttempts.length;
            classAttempts.forEach((a: any) => {
                if (a.percentage != null) agg.totalExamScores.push(a.percentage);
                else {
                    const tm = a.totalMarks ?? a.exam.totalMarks;
                    if (a.obtainedMarks != null && tm && tm > 0) agg.totalExamScores.push((a.obtainedMarks / tm) * 100);
                }
            });

            // External exams
            const externalAttempts = student.externalExams.filter((e: any) => e.classId === enr.classId);
            externalAttempts.forEach((e: any) => {
                if (e.percentage != null) agg.totalExamScores.push(e.percentage);
                else if (e.obtainedMarks != null && e.totalMarks && e.totalMarks > 0)
                    agg.totalExamScores.push((e.obtainedMarks / e.totalMarks) * 100);
            });

            // --- Attendance info for this specific class ---
            const classAtts = student.attendances.filter((a: any) => a.session.classId === enr.classId);
            agg.totalAttended += classAtts.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length;
            agg.totalSessions += classAtts.length;
        }

        const students = Array.from(studentAggregator.values()).map(agg => {
            const assignmentAvg = agg.totalGradedSubs > 0 ? Math.round(agg.totalSubScore / agg.totalGradedSubs * 10) / 10 : null;
            const examAvg = agg.totalExamScores.length > 0 ? Math.round(agg.totalExamScores.reduce((s: number, v: number) => s + v, 0) / agg.totalExamScores.length * 10) / 10 : null;
            const attendanceRate = agg.totalSessions > 0 ? Math.round(agg.totalAttended / agg.totalSessions * 1000) / 10 : 0;

            let overallPerformance: number;
            if (examAvg !== null && assignmentAvg !== null) {
                overallPerformance = Math.round((examAvg * 0.5 + attendanceRate * 0.3 + assignmentAvg * 0.2) * 10) / 10;
            } else if (examAvg !== null) {
                overallPerformance = Math.round((examAvg * 0.7 + attendanceRate * 0.3) * 10) / 10;
            } else if (assignmentAvg !== null) {
                overallPerformance = Math.round((assignmentAvg * 0.7 + attendanceRate * 0.3) * 10) / 10;
            } else {
                overallPerformance = attendanceRate;
            }

            const assignmentLetterGrade = assignmentAvg === null ? "N/A"
                : assignmentAvg >= 90 ? "A" : assignmentAvg >= 80 ? "B" : assignmentAvg >= 70 ? "C" : assignmentAvg >= 60 ? "D" : "F";
            
            const examLetterGrade = examAvg === null ? "N/A"
                : examAvg >= 90 ? "A" : examAvg >= 80 ? "B" : examAvg >= 70 ? "C" : examAvg >= 60 ? "D" : "F";

            return {
                studentId: agg.studentId,
                name: agg.name,
                email: agg.email,
                image: agg.image,
                classId: classFilter === "all" ? "multiple" : agg.classes[0].id,
                className: classFilter === "all" ? agg.classes.map((c: any) => c.name).join(", ") : agg.classes[0].name,
                classCode: classFilter === "all" ? agg.classes.map((c: any) => c.code).join(", ") : agg.classes[0].code,
                department: agg.department,
                semester: agg.semester,
                assignmentAvg,
                assignmentLetterGrade,
                assignmentCount: agg.totalGradedSubs,
                examAvg,
                examLetterGrade,
                examCount: agg.totalExamsCount,
                attendanceRate,
                overallPerformance
            };
        });

        // Sort by overallPerformance desc
        students.sort((a, b) => b.overallPerformance - a.overallPerformance);

        return NextResponse.json({
            success: true,
            data: { students, classes: teacher.classes }
        });

    } catch (error) {
        console.error("Grade distribution error:", error);
        return NextResponse.json({ success: false, error: "Failed to load grade distribution" }, { status: 500 });
    }
}
