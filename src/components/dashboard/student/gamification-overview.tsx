"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Trophy, Flame, Star, Medal, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface GamificationData {
    points: number
    currentStreak: number
    longestStreak: number
    badges: Array<{
        id: string
        name: string
        description: string
        icon: string
        category: string
        earnedAt: string
    }>
}

export function GamificationOverview() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<GamificationData | null>(null)

    useEffect(() => {
        const fetchGamification = async () => {
            try {
                const res = await fetch("/api/student/gamification")
                const result = await res.json()
                if (result.success) {
                    setData(result.data)
                }
            } catch (error) {
                console.error("Failed to load gamification data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchGamification()
    }, [])

    if (loading) {
        return (
            <Card className="bg-[#161616] border-[#1C1C1C]">
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Skeleton className="h-20 flex-1 rounded-xl" />
                        <Skeleton className="h-20 flex-1 rounded-xl" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data) return null

    return (
        <Card className="bg-[#161616] border-[#1C1C1C] shadow-none">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Your Achievements
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1F1F1F] border border-[#1C1C1C] shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Points</p>
                            <p className="text-xl font-bold dark:text-white">{data.points}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1F1F1F] border border-[#1C1C1C] shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Day Streak</p>
                            <p className="text-xl font-bold dark:text-white">{data.currentStreak} 🔥</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Medal className="w-4 h-4 text-purple-500" /> Recent Badges
                    </h4>
                    {data.badges.length === 0 ? (
                        <div className="text-center py-4 border border-dashed rounded-lg border-[#1C1C1C]">
                            <Award className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">Complete assignments to earn badges!</p>
                        </div>
                    ) : (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                            {data.badges.map((badge, index) => (
                                <motion.div
                                    key={badge.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex-shrink-0 flex flex-col items-center p-2 w-20 text-center rounded-lg border border-[#1C1C1C] bg-[#1F1F1F]"
                                >
                                    <div className="text-2xl mb-1">{badge.icon || "🏆"}</div>
                                    <p className="text-[10px] font-medium leading-tight dark:text-gray-300 line-clamp-2">
                                        {badge.name}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
