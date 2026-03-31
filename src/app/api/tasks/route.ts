import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { errorResponse, successResponse, rateLimit } from "@/lib/api/helpers"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    const tasks = await prisma.task.findMany({
      where: { userId: session.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    })
    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error("GET tasks error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    const rl = await rateLimit(session.id, "create-task", 30, 60000)
    if (!rl.success) return errorResponse("Too many requests", 429)
    const body = await req.json()
    const task = await prisma.task.create({
      data: { userId: session.id, title: body.title, description: body.description || null, priority: body.priority || "MEDIUM", dueDate: body.dueDate ? new Date(body.dueDate) : null },
    })
    return successResponse(task, "Task created")
  } catch (error) {
    console.error("POST task error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    const body = await req.json()
    const task = await prisma.task.update({
      where: { id: body.id, userId: session.id },
      data: { status: body.status, completedAt: body.status === "COMPLETED" ? new Date() : null },
    })
    return successResponse(task)
  } catch (error) {
    console.error("PUT task error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse("Unauthorized", 401)
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return errorResponse("Task ID required")
    await prisma.task.delete({ where: { id, userId: session.id } })
    return successResponse(null, "Deleted")
  } catch (error) {
    console.error("DELETE task error:", error)
    return errorResponse("Internal server error", 500)
  }
}
