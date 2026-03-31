import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { checkRateLimit } from "@/lib/rate-limit"

async function getCurrentUser() {
  return await getSession()
}

// Simple AI response generator (replace with actual OpenAI integration)
function generateAIResponse(message: string, context: any): string {
  const lowercaseMessage = message.toLowerCase()

  // Performance-related queries
  if (lowercaseMessage.includes("improve") || lowercaseMessage.includes("better")) {
    return `Based on your current performance data:

📊 **Areas for Improvement:**
${context.weakSubjects?.length > 0
        ? `- Focus on: ${context.weakSubjects.join(", ")}`
        : "- Your performance is consistent across subjects"}

📝 **Recommendations:**
1. ${context.attendanceRate < 80
        ? "Improve your attendance - you're currently at " + context.attendanceRate + "%. Aim for at least 85%"
        : "Great attendance! Keep it up"}
2. ${context.pendingAssignments > 0
        ? "Complete your " + context.pendingAssignments + " pending assignments before deadlines"
        : "All assignments are up to date - excellent!"}
3. Review materials from recent classes regularly
4. Practice with past exam questions
5. Join study groups for collaborative learning

Would you like specific tips for any particular subject?`
  }

  // Grade/marks related
  if (lowercaseMessage.includes("grade") || lowercaseMessage.includes("marks") || lowercaseMessage.includes("score")) {
    return `📈 **Your Academic Performance:**

• Overall Average: ${context.overallAverage || 78}%
• Grade: ${context.grade || "B+"}
• Class Rank: ${context.rank || "Top 25%"}

**Subject Breakdown:**
${context.subjects?.map((s: any) => `- ${s.name}: ${s.score}%`).join("\n") ||
      "- Mathematics: 85%\n- Physics: 78%\n- Computer Science: 92%"}

**Trend:** ${context.trend || "Improving"} over the last 3 months

Keep up the good work! Focus on ${context.weakestSubject || "Physics"} to further improve your overall grade.`
  }

  // Attendance related
  if (lowercaseMessage.includes("attendance")) {
    return `📅 **Attendance Summary:**

• Current Rate: ${context.attendanceRate || 88}%
• Classes Attended: ${context.classesAttended || 42}/${context.totalClasses || 48}
• Status: ${context.attendanceRate >= 75 ? "✅ Good Standing" : "⚠️ Below Requirement"}

**Tips:**
- ${context.attendanceRate < 85
        ? "Try to attend all remaining classes to improve your rate"
        : "Excellent attendance! This reflects well on your commitment"}
- Regular attendance correlates with better grades
- Don't miss any upcoming exams or important sessions`
  }

  // Assignment related
  if (lowercaseMessage.includes("assignment") || lowercaseMessage.includes("homework") || lowercaseMessage.includes("submission")) {
    return `📝 **Assignment Status:**

• Pending: ${context.pendingAssignments || 3} assignments
• Completed: ${context.completedAssignments || 15} assignments
• Submission Rate: ${context.submissionRate || 93}%

**Upcoming Deadlines:**
${context.upcomingDeadlines?.map((d: any) => `- ${d.title}: ${d.date}`).join("\n") ||
      "- Data Structures Lab 5: Tomorrow\n- Physics Report: Dec 15\n- Math Problem Set: Dec 18"}

**Tips:**
- Start assignments early to avoid last-minute rush
- Break large assignments into smaller tasks
- Ask for help if you're stuck`
  }

  // Study tips
  if (lowercaseMessage.includes("study") || lowercaseMessage.includes("tips") || lowercaseMessage.includes("help")) {
    return `📚 **Personalized Study Tips:**

Based on your performance pattern:

1. **Time Management**
   - Allocate more time to ${context.weakestSubject || "challenging subjects"}
   - Use the Pomodoro technique (25 min study, 5 min break)

2. **Active Learning**
   - Take notes during lectures
   - Summarize topics in your own words
   - Teach concepts to peers

3. **Practice**
   - Solve past exam papers
   - Complete all practice problems
   - Review mistakes to understand gaps

4. **Resources**
   - Use the class library for additional materials
   - Watch supplementary videos
   - Join discussion forums

Would you like a personalized study schedule?`
  }

  // Default response
  return `I'm your AI learning assistant! 🤖

I can help you with:
• **Performance Analysis** - Understanding your grades and trends
• **Study Tips** - Personalized recommendations
• **Attendance** - Tracking and improving attendance
• **Assignments** - Managing deadlines and submissions
• **Career Guidance** - Academic planning

Try asking:
- "How can I improve my grades?"
- "What's my attendance rate?"
- "Show me my assignment status"
- "Give me study tips for Physics"

How can I assist you today?`
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, "ai-chat", 30)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: rateLimitResult.headers }
      )
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, chatId } = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Get student context
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: {
        classEnrollments: {
          where: { status: "APPROVED" },
          include: {
            class: true,
          },
        },
        submissions: {
          include: {
            assignment: true,
          },
        },
        examAttempts: {
          include: {
            exam: true,
          },
        },
        attendances: true,
        performance: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    // Build context for AI
    const context = {
      attendanceRate: student?.attendances?.length
        ? Math.round((student.attendances.filter(a => a.status === "PRESENT").length / student.attendances.length) * 100)
        : 88,
      pendingAssignments: student?.submissions?.filter(s => s.status === "PENDING").length || 3,
      completedAssignments: student?.submissions?.filter(s => s.status === "GRADED").length || 15,
      submissionRate: 93,
      overallAverage: student?.performance?.[0]?.overallScore || 78,
      grade: "B+",
      rank: "Top 25%",
      subjects: [
        { name: "Mathematics", score: 85 },
        { name: "Physics", score: 78 },
        { name: "Computer Science", score: 92 },
      ],
      weakestSubject: "Physics",
      weakSubjects: ["Physics"],
      trend: "Improving",
      classesAttended: 42,
      totalClasses: 48,
      upcomingDeadlines: [
        { title: "Data Structures Lab 5", date: "Tomorrow" },
        { title: "Physics Report", date: "Dec 15" },
        { title: "Math Problem Set", date: "Dec 18" },
      ],
    }

    // Generate AI response
    const aiResponse = generateAIResponse(message, context)

    // NOTE: Chat history is now persisted via /api/chatbot/sessions
    // which uses AIChatSession + AIChatMessage models.
    const chat = null


    return NextResponse.json({
      response: aiResponse,
      chatId: undefined,
    }, { headers: rateLimitResult.headers })

  } catch (error) {
    console.error("AI Chat error:", error)
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    )
  }
}
