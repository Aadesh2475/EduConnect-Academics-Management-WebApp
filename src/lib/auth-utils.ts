import { cookies, headers } from "next/headers";
import { cache } from "react";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { auth } from "./auth";

// Constants
const SESSION_COOKIE_NAME = "session_token";
const SESSION_EXPIRY_DAYS = 30;

// Types
export interface SessionUser {
  id: string;
  userId: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  theme: string;
  onboarded: boolean;
}

// Get current session from either Better Auth or custom cookie
// Wrapped in cache() so the DB is only queried once per server request,
// even if multiple Server Components (layout + page) call getSession().
export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    // 1. Try Better Auth first
    const betterSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (betterSession?.user) {
      // Get additional info (role, theme) from DB
      const dbUser = await prisma.user.findUnique({
        where: { id: betterSession.user.id },
        select: { role: true, theme: true, onboarded: true }
      });

      return {
        id: betterSession.user.id,
        userId: betterSession.user.id,
        email: betterSession.user.email || "",
        name: betterSession.user.name || "",
        image: betterSession.user.image || null,
        role: dbUser?.role || "STUDENT",
        theme: dbUser?.theme || "light",
        onboarded: dbUser?.onboarded || false,
      };
    }

    // 2. Fallback to custom cookie session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    // Find session and validate
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            theme: true,
            onboarded: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      // Delete expired session
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return null;
    }

    return {
      id: session.user.id,
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: session.user.role,
      theme: session.user.theme,
      onboarded: session.user.onboarded,
    };
  } catch (error: any) {
    // Re-throw DB connection errors (e.g. Prisma P1001 Neon cold-start).
    // Returning null here would make the layout think "no session" and redirect
    // to /auth/login, which middleware then bounces back to /dashboard → infinite loop.
    const isDbConnectionError =
      error?.code === "P1001" ||
      error?.message?.includes("Can't reach database") ||
      error?.message?.includes("ECONNRESET") ||
      error?.message?.includes("connect ECONNREFUSED");

    if (isDbConnectionError) {
      throw error; // Let the layout/page handle this gracefully
    }

    console.error("Error getting session:", error);
    return null;
  }
});

// Create a new session
export async function createSession(userId: string): Promise<string> {
  const sessionToken = uuidv4();
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_EXPIRY_DAYS);

  await prisma.session.create({
    data: {
      token: sessionToken,
      userId,
      expiresAt: expires,
    },
  });

  return sessionToken;
}

// Delete session
export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      await prisma.session.deleteMany({ where: { token: sessionToken } });
    }
  } catch (error) {
    console.error("Error deleting session:", error);
  }
}

// Delete all sessions for a user
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Require authentication - throws if not authenticated
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

// Require specific role - throws if not authorized
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

// Get user by email
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

// Check if email exists
export async function emailExists(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  return !!user;
}

// Update user theme preference
export async function updateUserTheme(
  userId: string,
  theme: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { theme },
  });
}

// Get user with profile
export async function getUserWithProfile(userId: string, role: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: role === "STUDENT",
      teacher: role === "TEACHER",
    },
  });
  return user;
}

// Ensure student profile exists
export async function ensureStudentProfile(userId: string): Promise<any> {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    // Create default student profile
    return await prisma.student.create({
      data: {
        userId,
      },
    });
  }

  return student;
}
