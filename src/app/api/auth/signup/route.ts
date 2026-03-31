import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSession, emailExists } from "@/lib/auth-utils";
import { sendWelcomeEmail } from "@/lib/email";
import { sanitizeEmail, sanitizeString } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";


export async function POST(request: NextRequest) {
  try {
    // Rate-limit: max 3 signups per minute per IP (prevents mass account creation)
    const rl = await checkRateLimit(request, "auth/signup", 3);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many signup attempts. Please try again in a minute." },
        { status: 429, headers: rl.headers }
      );
    }

    const body = await request.json();

    // Sanitise all string inputs before processing
    const email    = sanitizeEmail(body.email);
    const name     = sanitizeString(body.name,       100);
    const role     = sanitizeString(body.role,        20);
    const phone    = sanitizeString(body.phone,       20);
    const department = sanitizeString(body.department, 100);
    const subject    = sanitizeString(body.subject,    100);
    const university = sanitizeString(body.university, 200);
    // Remove null bytes from password but otherwise preserve it for bcrypt
    const password: string = typeof body.password === "string"
      ? body.password.replace(/\x00/g, "").slice(0, 128)
      : "";

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length (min 8 per NIST SP 800-63B)
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (await emailExists(email)) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Validate role — ADMIN cannot be self-assigned during registration.
    // Admin accounts must be created via the admin panel or directly in the DB.
    const SELF_SIGNUP_ROLES = ["STUDENT", "TEACHER"];
    const userRole = role && SELF_SIGNUP_ROLES.includes(role.toUpperCase()) ? role.toUpperCase() : "STUDENT";

    // Additional validation for teacher
    if (userRole === "TEACHER") {
      if (!department || !subject || !university) {
        return NextResponse.json(
          { success: false, error: "Department, subject, and university are required for teachers" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with transaction to ensure data consistency
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          password: hashedPassword,
          role: userRole,
          provider: "CREDENTIALS",
        },
      });

      // Create role-specific profile
      if (userRole === "STUDENT") {
        await tx.student.create({
          data: {
            userId: newUser.id,
            phone: phone || null,
          },
        });
      } else if (userRole === "TEACHER") {
        await tx.teacher.create({
          data: {
            userId: newUser.id,
            department,
            subject,
            university,
            phone: phone || null,
          },
        });
      }

      return newUser;
    });

    // Fire welcome email (non-blocking — email failure should never block signup)
    sendWelcomeEmail(user.name, user.email, user.role).catch((err) =>
      console.error("[Email] Welcome email failed:", err)
    );

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
        onboarded: user.onboarded,
      },
      message: "Account created successfully",
    });

    // Set session cookie
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
