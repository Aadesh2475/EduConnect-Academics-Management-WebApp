import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string; subId: string }> }
) {
    try {
        const params = await props.params
        const session = await getSession()
        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const teacher = await prisma.teacher.findUnique({ where: { userId: session.id } })
        if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 })

        // Fetch the submission with the assignment details and any rubrics
        const submission = await prisma.submission.findUnique({
            where: { id: params.subId },
            include: {
                assignment: {
                    include: { rubrics: true }
                },
                student: {
                    include: { user: { select: { name: true } } }
                }
            }
        })

        if (!submission) {
            return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 })
        }

        const { assignment } = submission
        const content = submission.content || ""
        const totalMarks = assignment.totalMarks || 100

        // --- AI Grading Logic (Rule-based engine, ready for AI API swap-in) ---
        // This heuristic can be replaced with a real OpenAI/Anthropic API call.
        let suggestedMarks = 0
        let feedback = ""

        const wordCount = content.trim().split(/\s+/).length
        const hasRubrics = assignment.rubrics.length > 0

        if (hasRubrics) {
            // Grade based on rubric: check if answer mentions key criteria keywords
            const rubricEvaluation = assignment.rubrics.map(rubric => {
                const criteriaWords = rubric.criteria.toLowerCase().split(/\s+/)
                const contentLower = content.toLowerCase()
                const matchCount = criteriaWords.filter(w => w.length > 4 && contentLower.includes(w)).length
                const coverage = Math.min(matchCount / Math.max(criteriaWords.length, 1), 1)
                const awarded = Math.round(rubric.maxPoints * (0.4 + coverage * 0.6))
                return { criteria: rubric.criteria, max: rubric.maxPoints, awarded }
            })

            suggestedMarks = rubricEvaluation.reduce((sum, r) => sum + r.awarded, 0)
            feedback = rubricEvaluation.map(r => `[${r.criteria}]: ${r.awarded}/${r.max} marks.`).join(" ")
            feedback += ` Overall, the submission addresses the main criteria.`
        } else {
            // Fallback: grade based on content length and effort
            if (wordCount < 20) suggestedMarks = Math.round(totalMarks * 0.3)
            else if (wordCount < 80) suggestedMarks = Math.round(totalMarks * 0.55)
            else if (wordCount < 200) suggestedMarks = Math.round(totalMarks * 0.72)
            else suggestedMarks = Math.round(totalMarks * 0.85)

            if (wordCount < 20) {
                feedback = "The submission is very brief. More detail and explanation are needed to fully answer the question."
            } else if (wordCount < 80) {
                feedback = "The answer covers the basics but could benefit from more depth and supporting examples."
            } else if (wordCount < 200) {
                feedback = "Good effort! The answer demonstrates understanding. Consider adding more specific examples or elaboration."
            } else {
                feedback = "Excellent and detailed response. The submission demonstrates a solid understanding of the topic."
            }
        }

        // Cap at totalMarks just in case
        suggestedMarks = Math.min(suggestedMarks, totalMarks)

        return NextResponse.json({
            success: true,
            data: {
                suggestedMarks,
                suggestedGrade: `${suggestedMarks}/${totalMarks}`,
                feedback,
                wordCount,
                confidence: hasRubrics ? "HIGH" : "MEDIUM"
            }
        })
    } catch (error) {
        console.error("AI Grading Error:", error)
        return NextResponse.json({ success: false, error: "AI grading failed" }, { status: 500 })
    }
}
