import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse, successResponse, rateLimit } from "@/lib/api/helpers"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    const rl = await rateLimit(session.id, "ai-chat", 20, 60000)
    if (!rl.success) return errorResponse("Too many requests", 429)

    const { message } = await req.json()
    if (!message) return errorResponse("Message required")

    // Get student data for context
    let context = ""
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.id },
        include: {
          classEnrollments: { where: { status: "APPROVED" }, include: { class: { select: { name: true, subject: true } } } },
          performance: { orderBy: { createdAt: "desc" }, take: 3 },
          attendances: { take: 20, include: { session: true } },
        },
      })
      if (student) {
        const classNames = student.classEnrollments.map(e => e.class.subject).join(", ")
        const latestPerf = student.performance[0]
        context = `Student: ${session.name}. Classes: ${classNames || "None"}. `
        if (latestPerf) {
          context += `Latest performance - Attendance: ${latestPerf.attendanceRate || 0}%, Assignment Rate: ${latestPerf.assignmentRate || 0}%, Exam Avg: ${latestPerf.examAverage || 0}%, Overall: ${latestPerf.overallScore || 0}%. `
        }
        const presentCount = student.attendances.filter(a => a.status === "PRESENT").length
        context += `Recent attendance: ${presentCount}/${student.attendances.length} present. `
      }
    }

    // AI Response (without external API - using rule-based responses)
    const response = generateAIResponse(message, context)

    return successResponse({ response })
  } catch (error) {
    console.error("AI chat error:", error)
    return errorResponse("Internal server error", 500)
  }
}

function generateAIResponse(message: string, context: string): string {
  const msg = message.toLowerCase()

  if (msg.includes("perform") || msg.includes("score") || msg.includes("grade")) {
    return `Based on your academic data:\n\n${context || "I don't have enough data to analyze yet."}\n\n📊 **Recommendations:**\n1. Review your weakest subjects regularly\n2. Aim for consistent attendance above 90%\n3. Submit assignments before deadlines\n4. Practice past exam papers\n5. Create a daily study schedule\n\nWould you like more specific advice on any subject?`
  }

  if (msg.includes("attendance")) {
    return `Here's your attendance analysis:\n\n${context || "No attendance data available yet."}\n\n✅ **Tips to improve attendance:**\n1. Set daily reminders for classes\n2. Prepare materials the night before\n3. Find a study buddy for accountability\n4. Communicate with teachers if you need to miss class\n\nConsistent attendance is strongly correlated with better grades!`
  }

  if (msg.includes("study") || msg.includes("plan") || msg.includes("schedule")) {
    return `📅 **Recommended Study Plan:**\n\n**Morning (8-10 AM):** Review previous day's notes\n**Mid-morning (10-12 PM):** Focus on challenging subjects\n**Afternoon (2-4 PM):** Practice problems and assignments\n**Evening (6-8 PM):** Light revision and reading\n\n**Weekly Strategy:**\n- Monday-Thursday: Subject-focused study\n- Friday: Practice tests and past papers\n- Saturday: Group study and discussion\n- Sunday: Light review and rest\n\n💡 Remember: Quality > Quantity. Take 10-minute breaks every hour.`
  }

  if (msg.includes("exam") || msg.includes("prepare") || msg.includes("test")) {
    return `📝 **Exam Preparation Guide:**\n\n1. **2 weeks before:** Create a topic checklist\n2. **1 week before:** Focus on weak areas, solve previous papers\n3. **3 days before:** Quick revision of all topics\n4. **Day before:** Light review only, rest well\n5. **Exam day:** Read questions carefully, manage time\n\n**Study Techniques:**\n- Spaced repetition for memorization\n- Active recall over passive reading\n- Teach concepts to others\n- Use mind maps for complex topics\n\nWould you like help with a specific subject?`
  }

  if (msg.includes("focus") || msg.includes("area") || msg.includes("weak") || msg.includes("improve")) {
    return `🎯 **Areas to Focus On:**\n\n${context || "Join classes to get personalized recommendations."}\n\n**General Improvement Tips:**\n1. Identify your 2-3 weakest subjects\n2. Allocate extra study time to these areas\n3. Seek help from teachers during office hours\n4. Form study groups for difficult topics\n5. Use online resources for additional practice\n\nI can provide more specific guidance once I have more data from your classes and exams.`
  }

  return `I'd be happy to help you with your academics! Here are some things I can assist with:\n\n📊 **Performance Analysis** - "How am I performing?"\n📅 **Study Planning** - "Suggest a study plan"\n📝 **Exam Prep** - "How to prepare for exams?"\n✅ **Attendance** - "Analyze my attendance"\n🎯 **Focus Areas** - "What should I improve?"\n\nJust ask me anything about your academic journey!`
}
