import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse, successResponse, rateLimit } from "@/lib/api/helpers"

// ── Local Python AI Server Endpoint ──────────────────────────────────────────
// ── Local Python AI Server Endpoint ──────────────────────────────────────────
const LOCAL_AI_URL = process.env.LOCAL_AI_URL || "http://127.0.0.1:8000/chat"

// ── GET: list all sessions for current user ──────────────────────────────────
export async function GET() {
    try {
        const session = await getSession()
        if (!session) return errorResponse("Unauthorized", 401)

        const sessions = await prisma.aIChatSession.findMany({
            where: { userId: session.id },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { messages: true } },
            },
        })

        return successResponse(sessions)
    } catch (err) {
        console.error("[AI] GET sessions error:", err)
        return errorResponse("Failed to load sessions", 500)
    }
}

// ── POST: user sends message → persist → call OpenAI → persist reply ─────────
export async function POST(req: NextRequest) {
    try {
        const userSession = await getSession()
        if (!userSession) return errorResponse("Unauthorized", 401)

        const rl = await rateLimit(userSession.id, "chatbot", 50, 60000)
        if (!rl.success) return errorResponse("Rate limit exceeded. Please wait.", 429)

        const { message, sessionId, userRole } = await req.json()
        if (!message?.trim()) return errorResponse("Message is required")

        const botRole: "STUDENT" | "TEACHER" = userRole === "TEACHER" ? "TEACHER" : "STUDENT"

        // ── Find or create chat session ──────────────────────────────────────────
        let chatSession = sessionId
            ? await prisma.aIChatSession.findFirst({
                where: { id: sessionId, userId: userSession.id },
                include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
            })
            : null

        if (!chatSession) {
            chatSession = await prisma.aIChatSession.create({
                data: {
                    userId: userSession.id,
                    role: botRole,
                    title: message.slice(0, 60),
                },
                include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
            })
        }

        // ── Save user message ────────────────────────────────────────────────────
        await prisma.aIChatMessage.create({
            data: { sessionId: chatSession.id, role: "user", content: message },
        })

        // ── Build system prompt (full platform context) ──────────────────────────
        const systemPrompt = await buildComprehensiveSystemPrompt(
            userSession.id,
            userSession.name ?? "User",
            botRole
        )

        // ── Retrieve few-shot examples from positive-feedback messages ───────────
        const fewShot = await getFewShotExamples(botRole)

        // ── Build messages array for OpenAI ─────────────────────────────────────
        const history = (chatSession.messages ?? []).map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }))

        // ── Call Local Python AI Server ─────────────────────────────────────────
        const aiRequestPayload = {
            system_prompt: systemPrompt + (fewShot.length > 0 ? `\n\nEXAMPLES FROM HELPFUL PAST RESPONSES:\n${fewShot.join("\n---\n")}` : ""),
            messages: [...history, { role: "user", content: message }]
        }

        const aiResponse = await fetch(LOCAL_AI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(aiRequestPayload)
        })

        if (!aiResponse.ok) {
            console.error("[AI] Local Python API Error:", await aiResponse.text())
            throw new Error(`Local AI server responded with ${aiResponse.status}`)
        }

        const aiData = await aiResponse.json()
        const aiContent = aiData.response?.trim() || "I couldn't generate a response. Please try again."
        const tokenCount = null // Local server doesn't track tokens yet

        // ── Save AI reply ────────────────────────────────────────────────────────
        const savedReply = await prisma.aIChatMessage.create({
            data: {
                sessionId: chatSession.id,
                role: "assistant",
                content: aiContent,
                tokenCount,
            },
        })

        await prisma.aIChatSession.update({
            where: { id: chatSession.id },
            data: { updatedAt: new Date() },
        })

        return successResponse({
            sessionId: chatSession.id,
            messageId: savedReply.id,
            response: aiContent,
        })
    } catch (err) {
        console.error("[AI] POST sessions error:", err)
        const msg = err instanceof Error ? err.message : "Unknown error"
        return errorResponse(`AI error: ${msg}`, 500)
    }
}

// ── Few-shot learning: pull top-rated assistant messages to guide the model ──
async function getFewShotExamples(role: "STUDENT" | "TEACHER"): Promise<string[]> {
    try {
        const topMessages = await prisma.aIChatMessage.findMany({
            where: {
                role: "assistant",
                feedback: "up",
                session: { role },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { content: true },
        })
        return topMessages.map((m) => m.content)
    } catch {
        return []
    }
}

// ── FULL platform context system prompt ──────────────────────────────────────
async function buildComprehensiveSystemPrompt(
    userId: string,
    userName: string,
    role: "STUDENT" | "TEACHER"
): Promise<string> {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // ── Shared: upcoming platform events ────────────────────────────────────────
    const upcomingEvents = await prisma.event.findMany({
        where: { startDate: { gte: now } },
        orderBy: { startDate: "asc" },
        take: 10,
        select: { title: true, type: true, startDate: true, endDate: true, location: true, description: true },
    })

    // ── Shared: pending user notifications ──────────────────────────────────────
    const notifications = await prisma.notification.findMany({
        where: { userId, read: false },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { title: true, message: true, type: true, createdAt: true },
    })

    // ── Shared: pending tasks ────────────────────────────────────────────────────
    const userTasks = await prisma.task.findMany({
        where: { userId, status: { not: "COMPLETED" } },
        orderBy: { dueDate: "asc" },
        take: 10,
        select: { title: true, status: true, dueDate: true, priority: true },
    })

    const eventsSummary = upcomingEvents.length > 0
        ? upcomingEvents.map((e) =>
            `  - [${e.type}] ${e.title} on ${e.startDate.toLocaleDateString()}${e.location ? ` at ${e.location}` : ""}${e.description ? ` — ${e.description}` : ""}`
        ).join("\n")
        : "  None upcoming"

    const notifSummary = notifications.length > 0
        ? notifications.map((n) => `  - [${n.type}] ${n.title}: ${n.message}`).join("\n")
        : "  No unread notifications"

    const tasksSummary = userTasks.length > 0
        ? userTasks.map((t) =>
            `  - "${t.title}" [${t.status}]${t.priority ? ` priority: ${t.priority}` : ""}${t.dueDate ? ` due: ${t.dueDate.toLocaleDateString()}` : ""}`
        ).join("\n")
        : "  No pending tasks"

    if (role === "STUDENT") {
        // ── Fetch ALL relevant student data ─────────────────────────────────────
        const student = await prisma.student.findUnique({
            where: { userId },
            include: {
                classEnrollments: {
                    where: { status: "APPROVED" },
                    include: {
                        class: {
                            include: {
                                teacher: { include: { user: { select: { name: true } } } },
                                announcements: {
                                    orderBy: { createdAt: "desc" },
                                    take: 5,
                                    select: { title: true, content: true, priority: true, createdAt: true },
                                },
                                materials: {
                                    take: 5,
                                    select: { title: true, type: true, description: true },
                                },
                                assignments: {
                                    where: { isActive: true, dueDate: { gte: now } },
                                    orderBy: { dueDate: "asc" },
                                    take: 5,
                                    select: { title: true, dueDate: true, totalMarks: true },
                                },
                                exams: {
                                    where: { isActive: true, endTime: { gte: now } },
                                    orderBy: { startTime: "asc" },
                                    take: 5,
                                    select: { title: true, type: true, startTime: true, endTime: true, totalMarks: true, passingMarks: true, duration: true },
                                },
                            },
                        },
                    },
                },
                submissions: {
                    take: 30,
                    orderBy: { createdAt: "desc" },
                    select: { status: true, marks: true, submittedAt: true, feedback: true, assignment: { select: { title: true, totalMarks: true, dueDate: true } } },
                },
                examAttempts: {
                    take: 15,
                    orderBy: { createdAt: "desc" },
                    select: { status: true, percentage: true, obtainedMarks: true, totalMarks: true, exam: { select: { title: true, type: true } } },
                },
                attendances: {
                    take: 60,
                    orderBy: { createdAt: "desc" },
                    select: { status: true, session: { select: { date: true, topic: true } } },
                },
                performance: {
                    orderBy: [{ year: "desc" }, { month: "desc" }],
                    take: 6,
                    select: { month: true, year: true, attendanceRate: true, assignmentRate: true, examAverage: true, overallScore: true, rank: true },
                },
            },
        })

        if (!student) {
            return buildBasePrompt(userName, "student") +
                "\n\nNote: This student has no profile data yet. Provide general academic guidance."
        }

        // Calculate metrics
        const allAtt = student.attendances
        const presentAtt = allAtt.filter((a) => a.status === "PRESENT").length
        const attRate = allAtt.length > 0 ? Math.round((presentAtt / allAtt.length) * 100) : 0

        const recentAtt = allAtt.filter((a) => a.session.date && new Date(a.session.date) > thirtyDaysAgo)
        const recentPresent = recentAtt.filter((a) => a.status === "PRESENT").length
        const recentAttRate = recentAtt.length > 0 ? Math.round((recentPresent / recentAtt.length) * 100) : null

        const gradedSubs = student.submissions.filter((s) => s.marks !== null)
        const avgMarks = gradedSubs.length > 0
            ? Math.round(gradedSubs.reduce((a, s) => a + (s.marks ?? 0), 0) / gradedSubs.length)
            : null
        const lateCount = student.submissions.filter((s) => s.status === "LATE").length
        const pendingSubs = student.submissions.filter((s) => s.status === "PENDING").length

        const gradedExams = student.examAttempts.filter((e) => e.status === "SUBMITTED" || e.status === "GRADED")
        const avgExam = gradedExams.length > 0
            ? Math.round(gradedExams.reduce((a, e) => a + (e.percentage ?? 0), 0) / gradedExams.length)
            : null
        const passedExams = gradedExams.filter((e) => (e.percentage ?? 0) >= 50).length

        const latestPerf = student.performance[0]
        const perfTrend = student.performance.length >= 2
            ? (student.performance[0].overallScore ?? 0) - (student.performance[1].overallScore ?? 0)
            : null

        // Build class sections
        const classDetails = student.classEnrollments.map((e) => {
            const cls = e.class
            const upcoming = cls.assignments.map((a) =>
                `    - Assignment: "${a.title}" due ${a.dueDate.toLocaleDateString()} (${a.totalMarks} marks)`
            ).join("\n")
            const upcomingExams = cls.exams.map((ex) =>
                `    - ${ex.type}: "${ex.title}" on ${ex.startTime.toLocaleDateString()} (${ex.duration}min, ${ex.totalMarks} marks, pass: ${ex.passingMarks ?? "N/A"})`
            ).join("\n")
            const ann = cls.announcements.map((a) =>
                `    - [${a.priority}] ${a.title}: ${a.content.slice(0, 100)}`
            ).join("\n")
            const mats = cls.materials.map((m) => `    - [${m.type}] ${m.title}`).join("\n")

            return `  ▸ ${cls.name} (${cls.subject}) — Teacher: ${cls.teacher.user.name}
${upcoming ? `  Upcoming assignments:\n${upcoming}` : "  No pending assignments"}
${upcomingExams ? `  Upcoming exams:\n${upcomingExams}` : "  No upcoming exams"}
${ann ? `  Recent announcements:\n${ann}` : ""}
${mats ? `  Materials available:\n${mats}` : ""}`
        }).join("\n\n")

        // Recent submission feedback
        const recentFeedback = gradedSubs.filter((s) => s.feedback)
            .slice(0, 3)
            .map((s) => `  - "${s.assignment.title}": ${s.feedback}`)
            .join("\n")

        return `${buildBasePrompt(userName, "student")}

STUDENT ACADEMIC PROFILE:
- Name: ${userName}
- Department: ${student.department ?? "Not set"} | Semester: ${student.semester ?? "?"} | Batch: ${student.batch ?? "?"}
- Enrolled in ${student.classEnrollments.length} class(es)

REAL-TIME ATTENDANCE:
- Overall: ${presentAtt}/${allAtt.length} sessions (${attRate}%)
${recentAttRate !== null ? `- Last 30 days: ${recentAttRate}%` : ""}
- Status: ${attRate >= 90 ? "✓ Excellent" : attRate >= 75 ? "⚠ Acceptable" : "✗ CRITICAL — below 75% minimum"}

ASSIGNMENT PERFORMANCE:
- Total submissions: ${student.submissions.length} (${lateCount} late, ${pendingSubs} pending)
- Average marks: ${avgMarks !== null ? `${avgMarks}%` : "No graded work yet"}
${recentFeedback ? `- Teacher feedback on recent work:\n${recentFeedback}` : ""}

EXAM PERFORMANCE:
- Attempted: ${student.examAttempts.length} exams | Graded: ${gradedExams.length}
- Average score: ${avgExam !== null ? `${avgExam}%` : "No exams graded yet"}
- Pass rate: ${gradedExams.length > 0 ? `${passedExams}/${gradedExams.length} exams passed` : "N/A"}
${gradedExams.slice(0, 3).map((e) => `  - ${e.exam.title} [${e.exam.type}]: ${e.percentage?.toFixed(1) ?? "N/A"}%`).join("\n")}

PERFORMANCE TREND:
${latestPerf ? `- Latest overall score: ${latestPerf.overallScore ?? "N/A"} | Rank: ${latestPerf.rank ?? "Unranked"}` : "- No performance data yet"}
${perfTrend !== null ? `- Trend: ${perfTrend > 0 ? `↑ Improving (+${perfTrend.toFixed(1)})` : perfTrend < 0 ? `↓ Declining (${perfTrend.toFixed(1)})` : "→ Stable"}` : ""}

ENROLLED CLASSES & CONTENT:
${classDetails || "No classes enrolled"}

UPCOMING EVENTS ON PLATFORM:
${eventsSummary}

PENDING NOTIFICATIONS (${notifications.length}):
${notifSummary}

YOUR PENDING TASKS (${userTasks.length}):
${tasksSummary}

${buildInstructions("student")}`
    } else {
        // TEACHER
        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                classes: {
                    where: { isActive: true },
                    include: {
                        enrollments: {
                            where: { status: "APPROVED" },
                            include: {
                                student: {
                                    include: {
                                        user: { select: { name: true, email: true } },
                                        attendances: {
                                            take: 30,
                                            orderBy: { createdAt: "desc" },
                                            select: { status: true, session: { select: { date: true } } },
                                        },
                                        submissions: {
                                            take: 15,
                                            orderBy: { createdAt: "desc" },
                                            select: { status: true, marks: true, submittedAt: true, assignment: { select: { title: true, dueDate: true } } },
                                        },
                                        examAttempts: {
                                            take: 8,
                                            orderBy: { createdAt: "desc" },
                                            select: { status: true, percentage: true, exam: { select: { title: true, type: true } } },
                                        },
                                        performance: {
                                            take: 1,
                                            orderBy: [{ year: "desc" }, { month: "desc" }],
                                            select: { overallScore: true, rank: true },
                                        },
                                    },
                                },
                            },
                        },
                        announcements: {
                            orderBy: { createdAt: "desc" },
                            take: 3,
                            select: { title: true, content: true, priority: true },
                        },
                        assignments: {
                            where: { isActive: true },
                            take: 5,
                            select: { title: true, dueDate: true, totalMarks: true, submissions: { select: { status: true } } },
                        },
                        exams: {
                            where: { isActive: true },
                            take: 5,
                            select: { title: true, type: true, startTime: true, endTime: true, attempts: { select: { status: true, percentage: true } } },
                        },
                    },
                    take: 5,
                },
                announcements: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    select: { title: true, content: true, priority: true, createdAt: true },
                },
            },
        })

        if (!teacher) {
            return buildBasePrompt(userName, "teacher") +
                "\n\nNote: This teacher has no profile data yet. Provide general teaching guidance."
        }

        const classData = teacher.classes.map((cls) => {
            const students = cls.enrollments.map(({ student: s }) => {
                const attTotal = s.attendances.length
                const attPresent = s.attendances.filter((a) => a.status === "PRESENT").length
                const attRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0
                const recentAtt = s.attendances.filter((a) => a.session.date && new Date(a.session.date) > sevenDaysAgo)
                const recentPresent = recentAtt.filter((a) => a.status === "PRESENT").length
                const recentRate = recentAtt.length > 0 ? Math.round((recentPresent / recentAtt.length) * 100) : null
                const lateCount = s.submissions.filter((sub) => sub.status === "LATE").length
                const recentSubs = s.submissions.filter((sub) => sub.submittedAt && new Date(sub.submittedAt) > sevenDaysAgo).length
                const gradedExams = s.examAttempts.filter((e) => e.status === "SUBMITTED" || e.status === "GRADED")
                const avgExam = gradedExams.length > 0
                    ? Math.round(gradedExams.reduce((a, e) => a + (e.percentage ?? 0), 0) / gradedExams.length)
                    : null
                const overallScore = s.performance[0]?.overallScore ?? null
                const risk =
                    attRate < 60 || (avgExam !== null && avgExam < 40)
                        ? "HIGH"
                        : attRate < 75 || lateCount > 3
                            ? "MEDIUM"
                            : "LOW"
                return {
                    name: s.user.name,
                    email: s.user.email,
                    attRate,
                    recentRate,
                    lateCount,
                    recentSubs,
                    avgExam,
                    overallScore,
                    risk,
                }
            })

            const classAttAvg = students.length > 0
                ? Math.round(students.reduce((a, s) => a + s.attRate, 0) / students.length)
                : 0
            const atRiskStudents = students.filter((s) => s.risk === "HIGH")
            const mediumRiskStudents = students.filter((s) => s.risk === "MEDIUM")
            const inactiveStudents = students.filter((s) => s.recentSubs === 0 && s.attRate < 70)

            // Assignment stats
            const assignmentStats = cls.assignments.map((a) => {
                const total = a.submissions.length
                const submitted = a.submissions.filter((s) => s.status !== "PENDING").length
                return `    - "${a.title}": ${submitted}/${total} submitted, due ${a.dueDate.toLocaleDateString()}`
            }).join("\n")

            // Exam stats
            const examStats = cls.exams.map((e) => {
                const taken = e.attempts.filter((a) => a.status !== "IN_PROGRESS").length
                const avgPct = e.attempts.length > 0
                    ? Math.round(e.attempts.reduce((a, at) => a + (at.percentage ?? 0), 0) / e.attempts.length)
                    : null
                return `    - "${e.title}" [${e.type}]: ${taken} attempted, avg ${avgPct ?? "N/A"}%`
            }).join("\n")

            const studentRows = students
                .sort((a, b) => (a.risk === "HIGH" ? -1 : b.risk === "HIGH" ? 1 : 0))
                .map((s) =>
                    `    • ${s.name} | Att: ${s.attRate}%${s.recentRate !== null ? ` (recent: ${s.recentRate}%)` : ""} | Late: ${s.lateCount} | Exam avg: ${s.avgExam ?? "N/A"}% | Score: ${s.overallScore?.toFixed(0) ?? "N/A"} | Risk: ${s.risk}`
                )
                .join("\n")

            return `  ▸ ${cls.name} (${cls.subject}) — ${students.length} students | Avg attendance: ${classAttAvg}%
  🔴 HIGH risk (${atRiskStudents.length}): ${atRiskStudents.map((s) => s.name).join(", ") || "None"}
  🟡 MEDIUM risk (${mediumRiskStudents.length}): ${mediumRiskStudents.map((s) => s.name).join(", ") || "None"}
  😴 Inactive (${inactiveStudents.length}): ${inactiveStudents.map((s) => s.name).join(", ") || "None"}
  Assignments:\n${assignmentStats || "    None active"}
  Exams:\n${examStats || "    None active"}
  Student breakdown:\n${studentRows}`
        }).join("\n\n")

        const announcementSummary = teacher.announcements.length > 0
            ? teacher.announcements.map((a) => `  - [${a.priority}] ${a.title}: ${a.content.slice(0, 120)}`).join("\n")
            : "  No recent announcements"

        return `${buildBasePrompt(userName, "teacher")}

TEACHER PROFILE:
- Name: ${userName}
- Department: ${teacher.department} | Subject: ${teacher.subject}
- University: ${teacher.university}
- Experience: ${teacher.experience ? `${teacher.experience} years` : "Not specified"}
- Active classes: ${teacher.classes.length}

YOUR CLASS & STUDENT ANALYTICS:
${classData || "No active classes"}

YOUR RECENT ANNOUNCEMENTS:
${announcementSummary}

UPCOMING PLATFORM EVENTS:
${eventsSummary}

PENDING NOTIFICATIONS (${notifications.length}):
${notifSummary}

YOUR PENDING TASKS (${userTasks.length}):
${tasksSummary}

${buildInstructions("teacher")}`
    }
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function buildBasePrompt(name: string, role: "student" | "teacher"): string {
    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
    return `You are EduConnect AI — the intelligent academic assistant built into the EduConnect learning management platform.
Today is ${today}.
You are speaking with ${name} (${role.toUpperCase()}).
You have been given REAL, LIVE data from the EduConnect database below. Use it to give precise, personalized, actionable responses.`
}

function buildInstructions(role: "student" | "teacher"): string {
    const common = `RESPONSE GUIDELINES:
- Use the EXACT numbers from the data above — never make up statistics.
- Use markdown formatting: **bold** for key figures, numbered lists for steps, bullet lists for items.
- For study questions (math, science, history, programming, etc.) — answer directly and clearly.
- Be concise but complete. Avoid unnecessary padding.`

    if (role === "student") {
        return `${common}
- Identify risks early and give concrete improvement steps with specific targets.
- When discussing upcoming deadlines, always mention the exact date.
- Predict performance and be honest about failing risks while staying encouraging.
- If asked about study topics, provide full educational explanations.`
    } else {
        return `${common}
- Always name specific students when flagging issues — this is private data only the teacher can see.
- Rank interventions by severity (RED > YELLOW > GREEN).
- Suggest specific teaching strategies backed by pedagogical research.
- For curriculum or study topic questions, answer as an expert educator.`
    }
}
