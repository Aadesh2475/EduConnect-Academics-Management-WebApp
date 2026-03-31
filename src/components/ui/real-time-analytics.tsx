"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

interface DataPoint {
    time: number
    value: number
}

export function RealTimeAnalytics() {
    const [data, setData] = useState<DataPoint[]>([])
    const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null)
    const svgRef = useRef<SVGSVGElement>(null)

    const maxPoints = 30
    const width = 800
    const height = 220
    const padding = { top: 20, right: 20, bottom: 40, left: 50 }

    useEffect(() => {
        const initial: DataPoint[] = []
        for (let i = 0; i < 20; i++) {
            initial.push({
                time: Date.now() - (20 - i) * 1000,
                value: 60 + Math.random() * 30,
            })
        }
        setData(initial)

        const interval = setInterval(() => {
            setData((prev) => {
                const last = prev[prev.length - 1]?.value ?? 75
                const newPoint: DataPoint = {
                    time: Date.now(),
                    value: Math.max(30, Math.min(98, last + (Math.random() - 0.5) * 15)),
                }
                return [...prev, newPoint].slice(-maxPoints)
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const getX = (time: number) => {
        if (data.length < 2) return padding.left
        const minTime = data[0]?.time ?? 0
        const maxTime = data[data.length - 1]?.time ?? 1
        const range = maxTime - minTime || 1
        return padding.left + ((time - minTime) / range) * (width - padding.left - padding.right)
    }

    const getY = (value: number) =>
        padding.top + (1 - value / 100) * (height - padding.top - padding.bottom)

    const getPath = () => {
        if (data.length < 2) return ""
        return data
            .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(p.time)},${getY(p.value)}`)
            .join(" ")
    }

    const getAreaPath = () => {
        if (data.length < 2) return ""
        const line = getPath()
        const lastX = getX(data[data.length - 1].time)
        const firstX = getX(data[0].time)
        const bottomY = height - padding.bottom
        return `${line} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!svgRef.current) return
        const rect = svgRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        let closest: DataPoint | null = null
        let minDist = Infinity
        data.forEach((point) => {
            const dist = Math.abs(getX(point.time) - x)
            if (dist < minDist && dist < 30) { minDist = dist; closest = point }
        })
        setHoveredPoint(closest)
    }

    const currentValue = data[data.length - 1]?.value ?? 0
    const avgValue = data.length ? data.reduce((a, b) => a + b.value, 0) / data.length : 0
    const peakValue = data.length ? Math.max(...data.map((d) => d.value)) : 0

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
                <div>
                    <h3 className="text-base font-semibold text-white">Live Student Performance</h3>
                    <p className="text-xs text-indigo-300/70 mt-0.5">Real-time class activity feed</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-slate-400">Live</span>
                    <span className="text-lg font-bold text-white ml-1">{currentValue.toFixed(1)}%</span>
                </div>
            </div>

            {/* Chart */}
            <div className="px-4 py-3 relative">
                <svg
                    ref={svgRef}
                    width="100%"
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-crosshair"
                >
                    <defs>
                        <linearGradient id="aiLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1">
                                <animate attributeName="stop-color" values="#6366f1;#8b5cf6;#6366f1" dur="3s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="50%" stopColor="#8b5cf6">
                                <animate attributeName="stop-color" values="#8b5cf6;#a855f7;#8b5cf6" dur="3s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="100%" stopColor="#a855f7">
                                <animate attributeName="stop-color" values="#a855f7;#6366f1;#a855f7" dur="3s" repeatCount="indefinite" />
                            </stop>
                        </linearGradient>
                        <linearGradient id="aiAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[25, 50, 75, 100].map((val) => (
                        <g key={val}>
                            <line x1={padding.left} y1={getY(val)} x2={width - padding.right} y2={getY(val)}
                                stroke="#334155" strokeDasharray="4 4" />
                            <text x={padding.left - 8} y={getY(val)} fill="#64748b" fontSize="11"
                                textAnchor="end" dominantBaseline="middle">{val}%</text>
                        </g>
                    ))}

                    {/* Area fill */}
                    <path d={getAreaPath()} fill="url(#aiAreaGradient)" />

                    {/* Main line */}
                    <path d={getPath()} fill="none" stroke="url(#aiLineGradient)"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ filter: "drop-shadow(0 0 6px rgba(99,102,241,0.5))" }} />

                    {/* Data dots */}
                    {data.map((point, i) => (
                        <circle key={point.time}
                            cx={getX(point.time)} cy={getY(point.value)}
                            r={i === data.length - 1 ? 5 : 2.5}
                            fill={i === data.length - 1 ? "#a855f7" : "#6366f1"}
                            opacity={hoveredPoint?.time === point.time ? 1 : 0.7} />
                    ))}

                    {/* Hover crosshair */}
                    {hoveredPoint && (
                        <>
                            <line x1={getX(hoveredPoint.time)} y1={padding.top}
                                x2={getX(hoveredPoint.time)} y2={height - padding.bottom}
                                stroke="#6366f1" strokeDasharray="4 4" opacity="0.5" />
                            <circle cx={getX(hoveredPoint.time)} cy={getY(hoveredPoint.value)}
                                r="7" fill="none" stroke="#a855f7" strokeWidth="2" />
                        </>
                    )}
                </svg>

                {/* Tooltip */}
                {hoveredPoint && (
                    <div className="absolute pointer-events-none z-10 bg-slate-900 border border-indigo-500 rounded-lg px-3 py-2 -translate-x-1/2"
                        style={{ left: getX(hoveredPoint.time), top: getY(hoveredPoint.value) - 56 }}>
                        <p className="text-white font-semibold text-sm">{hoveredPoint.value.toFixed(1)}%</p>
                        <p className="text-slate-400 text-xs">{new Date(hoveredPoint.time).toLocaleTimeString()}</p>
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 px-4 pb-4">
                {[
                    { label: "Average Score", value: `${avgValue.toFixed(1)}%` },
                    { label: "Peak Score", value: `${peakValue.toFixed(1)}%` },
                    { label: "Data Points", value: data.length.toString() },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/[0.06]">
                        <p className="text-[11px] text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-white font-semibold text-base">{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
