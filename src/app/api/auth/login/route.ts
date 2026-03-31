import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth-utils";
import { sanitizeEmail, sanitizeString } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate-limit: max 5 login attempts per minute per IP
    const rl = await checkRateLimit(request, "auth/login", 5);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again in a minute." },
        { status: 429, headers: rl.headers }
      );
    }

    const body = await request.json();

    // Sanitise inputs before any processing
    const email = sanitizeEmail(body.email);
    // Remove null bytes from password (could corrupt bcrypt) but don't strip other chars
    const rawPassword: string = typeof body.password === "string"
      ? body.password.replace(/\x00/g, "").slice(0, 128)
      : "";

    // Validate input
    if (!email || !rawPassword) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (rawPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user has password (not OAuth-only user)
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: "This account uses social login. Please sign in with Google or GitHub.",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(rawPassword, user.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = await createSession(user.id);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        theme: user.theme,
        onboarded: user.onboarded,
      },
      message: "Login successful",
    });

    // Set session cookie
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Log login activity for students
    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (student) {
        await prisma.studentActivityLog.create({
          data: {
            studentId: student.id,
            type: "LOGIN",
            description: "Student logged into the platform",
          },
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
