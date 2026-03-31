import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "STUDENT") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const student = await prisma.student.findUnique({
            where: { userId: session.id },
            include: {
                badges: {
                    include: {
                        badge: true
                    },
                    orderBy: {
                        earnedAt: 'desc'
                    }
                }
            }
        })

        if (!student) {
            return NextResponse.json({ success: false, error: "Student profile not found" }, { status: 404 })
        }

        const gamificationStats = {
            points: student.points || 0,
            currentStreak: student.currentStreak || 0,
            longestStreak: student.longestStreak || 0,
            badges: student.badges.map(b => ({
                id: b.badge.id,
                name: b.badge.name,
                description: b.badge.description,
                icon: b.badge.icon,
                category: b.badge.category,
                earnedAt: b.earnedAt
            }))
        }

        return NextResponse.json({ success: true, data: gamificationStats })
    } catch (error) {
        console.error("Gamification API Error:", error)
        return NextResponse.json({ success: false, error: "Failed to load gamification stats" }, { status: 500 })
    }
}
