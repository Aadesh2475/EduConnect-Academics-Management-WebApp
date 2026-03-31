import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { errorResponse } from "@/lib/api/helpers"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403)
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, role, image } = body

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        image,
      },
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error) {
    console.error("Update user error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403)
    }

    const { id } = await params

    // Prevent deleting self
    if (id === session.id) {
      return errorResponse("Cannot delete your own account", 400)
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return errorResponse("Internal server error", 500)
  }
}
