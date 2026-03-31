import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse, parsePagination } from "@/lib/api/helpers"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return errorResponse("Forbidden", 403)
    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || "all"
    const where: Record<string, unknown> = {}
    if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }]
    if (role !== "all") where.role = role
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where: where as never, select: { id: true, name: true, email: true, role: true, image: true, createdAt: true }, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.user.count({ where: where as never }),
    ])
    return NextResponse.json({ success: true, data: users, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("Admin users error:", error)
    return errorResponse("Internal server error", 500)
  }
}
