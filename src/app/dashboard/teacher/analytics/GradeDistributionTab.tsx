"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Loader2, Search, BookOpen, FileText, Users, TrendingUp, PieChart, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface GradeStudent {
    studentId: string
    name: string
    email: string
    image?: string | null
    classId: string
    className: string
    classCode: string
    department: string
    semester: number
    assignmentAvg: number | null
    assignmentLetterGrade: string
    assignmentCount: number
    examAvg: number | null
    examLetterGrade: string
    examCount: number
    attendanceRate: number
    overallPerformance: number
    performanceRate: number // Added for new UI
    currentGrade: string // Added for new UI
}

interface ClassOption { id: string; name: string; code: string }

const GRADE_COLORS: Record<string, string> = {
    "A": "text-white",
    "B": "text-[#3b82f6]",
    "C": "text-[#FACC15]",
    "D": "text-[#FB923C]",
    "E": "text-[#F87171]",
    "F": "text-[#F87171]",
}

const PERF_COLOR = (v: number) => {
    if (v >= 80) return "text-green-600 dark:text-green-400"
    if (v >= 60) return "text-blue-600 dark:text-blue-400"
    if (v >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
}

const PERF_BAR_COLOR = (v: number) => {
    if (v >= 80) return "bg-green-500"
    if (v >= 60) return "bg-blue-500"
    if (v >= 40) return "bg-yellow-500"
    return "bg-red-500"
}

export default function GradeDistributionTab() {
    const [students, setStudents] = useState<GradeStudent[]>([])
    const [classes, setClasses] = useState<ClassOption[]>([])
    const [loading, setLoading] = useState(true)
    const [classFilter, setClassFilter] = useState("all")
    const [search, setSearch] = useState("")

    // Placeholder for new data structure required by the new UI
    const [data, setData] = useState({
        distribution: [
            { grade: "A", count: 0, percentage: 0 },
            { grade: "B", count: 0, percentage: 0 },
            { grade: "C", count: 0, percentage: 0 },
            { grade: "D", count: 0, percentage: 0 },
            { grade: "E", count: 0, percentage: 0 },
            { grade: "F", count: 0, percentage: 0 },
        ],
        summary: {
            averageGrade: 0,
            averageLetter: "N/A",
            maxGrade: 0,
            passRate: 0,
        }
    })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (classFilter !== "all") params.set("classId", classFilter)
            if (search) params.set("search", search)
            const res = await fetch(`/api/teacher/analytics/grade-distribution?${params}`)
            const json = await res.json()
            if (json.success) {
                setStudents(json.data.students)
                setClasses(json.data.classes)
                // Assuming the API now returns the new data structure
                // If not, this part needs to be adapted to calculate `data` from `students`
                if (json.data.distribution && json.data.summary) {
                    setData({
                        distribution: json.data.distribution,
                        summary: json.data.summary
                    })
                } else {
                    // Fallback/calculation if API doesn't provide it directly
                    const totalStudents = json.data.students.length;
                    const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
                    let totalOverallPerformance = 0;
                    let maxOverallPerformance = 0;
                    let passedStudents = 0;

                    json.data.students.forEach((s: GradeStudent) => {
                        const grade = s.currentGrade || getLetterGrade(s.overallPerformance) || "F";
                        gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
                        totalOverallPerformance += s.overallPerformance;
                        if (s.overallPerformance > maxOverallPerformance) {
                            maxOverallPerformance = s.overallPerformance;
                        }
                        if (s.overallPerformance >= 60) {
                            passedStudents++;
                        }
                    });

                    const distribution = ["A", "B", "C", "D", "E", "F"].map(grade => ({
                        grade,
                        count: gradeCounts[grade] || 0,
                        percentage: totalStudents > 0 ? parseFloat((((gradeCounts[grade] || 0) / totalStudents) * 100).toFixed(1)) : 0
                    }));

                    const averageGrade = totalStudents > 0 ? parseFloat((totalOverallPerformance / totalStudents).toFixed(1)) : 0;
                    const averageLetter = getLetterGrade(averageGrade);
                    const passRate = totalStudents > 0 ? parseFloat(((passedStudents / totalStudents) * 100).toFixed(1)) : 0;

                    setData({
                        distribution,
                        summary: {
                            averageGrade,
                            averageLetter,
                            maxGrade: maxOverallPerformance,
                            passRate,
                        }
                    });
                }
            }
        } finally { setLoading(false) }
    }, [classFilter, search])

    useEffect(() => { fetchData() }, [fetchData])

    const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

    const getLetterGrade = (score: number): string => {
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        if (score >= 60) return "D";
        if (score >= 50) return "E"; // Assuming E for 50-59
        return "F";
    };

    const getPerformanceColor = (performanceRate: number) => {
        if (performanceRate >= 85) return "bg-[#00E599]/20 text-[#00E599]";
        if (performanceRate >= 70) return "bg-[#3b82f6]/20 text-[#3b82f6]";
        return "bg-[#F87171]/20 text-[#F87171]";
    };

    return (
        <div className="space-y-6">
            {/* Grade Distribution Summary */}
            <Card className="bg-[#161616] border-[#1C1C1C] rounded-[2rem] overflow-hidden relative z-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-12 -mt-12 pointer-events-none" />
                <CardHeader className="p-8 border-b border-[#1C1C1C]">
                    <CardTitle className="flex items-center gap-2 text-white text-sm font-bold uppercase tracking-widest">
                        <PieChart className="w-4 h-4 text-[#A855F7]" /> Grade Distribution Analysis
                    </CardTitle>
                    <CardDescription className="text-[11px] text-[#555] font-medium uppercase tracking-tighter mt-1">Cross-class performance breakdown by letter grade</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {data.distribution.map(d => (
                            <div key={d.grade} className="p-5 rounded-2xl bg-black/40 border border-[#1C1C1C] text-center group hover:border-white/20 hover:bg-white/[0.04] transition-all relative overflow-hidden">
                                <div className={cn("absolute inset-x-0 bottom-0 h-1 opacity-20", 
                                    d.grade === "A" ? "bg-[#00E599]" : 
                                    d.grade === "B" ? "bg-[#3b82f6]" : 
                                    d.grade === "C" ? "bg-[#FACC15]" : 
                                    d.grade === "D" ? "bg-[#FB923C]" : "bg-[#F87171]"
                                )} />
                                <p className={cn("text-3xl font-bold mb-1 tracking-tight", GRADE_COLORS[d.grade] || "text-white")}>{d.grade}</p>
                                <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest">{d.count} Students</p>
                                <p className="text-[9px] text-[#333] mt-1 font-bold uppercase tracking-tighter">{d.percentage}% of total</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="p-5 rounded-xl bg-[#000] border border-[#1C1C1C] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#A855F7]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2 px-1">Average Grade</p>
                            <div className="flex items-end gap-2 px-1">
                                <p className="text-4xl font-bold text-white tracking-tight">{data.summary.averageGrade}%</p>
                                <span className={cn("text-sm font-bold mb-1.5", GRADE_COLORS[data.summary.averageLetter] || "text-white")}>({data.summary.averageLetter})</span>
                            </div>
                        </div>
                        <div className="p-5 rounded-xl bg-[#000] border border-[#1C1C1C] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#00E599]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2 px-1">Top Score</p>
                            <div className="flex items-end gap-2 px-1">
                                <p className="text-4xl font-bold text-[#00E599] tracking-tight">{data.summary.maxGrade}%</p>
                                <Trophy className="w-5 h-5 text-[#FACC15] mb-2" />
                            </div>
                        </div>
                        <div className="p-5 rounded-xl bg-[#000] border border-[#1C1C1C] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#3b82f6]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2 px-1">Pass Rate</p>
                            <div className="flex items-end gap-2 px-1">
                                <p className="text-4xl font-bold text-[#3b82f6] tracking-tight">{data.summary.passRate}%</p>
                                <span className="text-[10px] text-[#444] font-bold uppercase mb-2">Success Rate</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Individual Student Grades Table */}
            <Card className="bg-[#161616] border-[#1C1C1C] rounded-[2rem] overflow-hidden">
                <CardHeader className="p-8 border-b border-[#1C1C1C]">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                            <CardTitle className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#A855F7]" /> Performance Records
                            </CardTitle>
                            <CardDescription className="text-[11px] text-[#555] font-medium uppercase tracking-tighter mt-1">Student scores and performance</CardDescription>
                        </div>
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] group-focus-within:text-[#A855F7] transition-all duration-300" />
                            <Input 
                                placeholder="Search students by name or email..." 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                className="pl-10 h-11 bg-[#000]/50 border-white/5 focus:border-[#A855F7]/30 rounded-xl text-sm transition-all"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-[#A855F7]" />
                            <p className="text-[10px] text-[#444] font-black uppercase tracking-widest">Loading student records...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <p className="text-center text-[#444] py-24 text-sm font-medium">No student records found</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#1C1C1C] bg-[#000]/30">
                                        {["Student Name", "Class Profile", "Exam Performance", "Performance", "Current Grade"].map(h => (
                                            <th key={h} className="py-4 px-6 text-left text-[10px] font-bold uppercase tracking-widest text-[#555]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1C1C1C]">
                                    {students.map((s, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border border-[#1C1C1C] group-hover:border-[#A855F7]/40 transition-all rounded-xl">
                                                        <AvatarImage src={s.image || undefined} />
                                                        <AvatarFallback className="text-xs font-bold bg-[#111] text-[#A855F7]">{s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-white group-hover:text-[#A855F7] transition-colors truncate tracking-tight">{s.name}</p>
                                                        <p className="text-[11px] text-[#555] font-medium truncate">{s.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight bg-white/5 border-white/10 text-[#CCC] w-fit">{s.classCode}</Badge>
                                                    <span className="text-[9px] text-[#666] font-medium italic truncate max-w-[120px]">{s.className}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-[10px] font-black text-white mb-0.5">
                                                        <span>{s.examAvg}%</span>
                                                    </div>
                                                    <Progress value={s.examAvg || 0} className="h-1 bg-white/5" indicatorClassName={cn("transition-all", (s.examAvg || 0) >= 80 ? "bg-[#00E599]" : (s.examAvg || 0) >= 50 ? "bg-[#3b82f6]" : "bg-[#F87171]")} />
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge className={cn("text-[10px] font-black uppercase tracking-widest border-0 px-3", getPerformanceColor(s.performanceRate))}>
                                                    {s.performanceRate >= 85 ? "Excellent" : s.performanceRate >= 70 ? "Good" : "Needs Improvement"}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={cn("text-xl font-black", GRADE_COLORS[s.currentGrade] || "text-white")}>{s.currentGrade}</span>
                                                    <span className="text-[9px] text-[#444] font-bold uppercase tracking-tighter">Current</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
