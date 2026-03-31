"use client";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: "http://localhost:3000" // ensure this matches your env
});

export const { useSession } = authClient;

// Session user type
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  theme: string;
  onboarded: boolean;
}

// API response types
interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    theme?: string;
    onboarded?: boolean;
  };
  error?: string;
  message?: string;
}

interface SessionResponse {
  success: boolean;
  data: SessionUser | null;
}

// Login function
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "Network error. Please try again." };
  }
}

// Social Login function
export async function signInSocial(provider: "google" | "github"): Promise<void> {
  await authClient.signIn.social({
    provider: provider,
    callbackURL: "/dashboard" // or wherever you want them to land
  });
}

// Register function
export async function signUp(data: {
  email: string;
  password: string;
  name: string;
  role?: string;
  phone?: string;
  department?: string;
  subject?: string;
  university?: string;
}): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: "Network error. Please try again." };
  }
}

// Logout function
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error: "Network error. Please try again." };
  }
}

// Get current session
export async function getSession(): Promise<SessionUser | null> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      cache: "no-store",
    });

    const data: SessionResponse = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

// Update theme preference
export async function updateTheme(theme: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/user/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Update theme error:", error);
    return { success: false, error: "Failed to update theme" };
  }
}

// Get theme preference
export async function getTheme(): Promise<string> {
  try {
    const response = await fetch("/api/user/theme", {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();
    return data.theme || "light";
  } catch (error) {
    console.error("Get theme error:", error);
    return "light";
  }
}

// Helper function to get dashboard path based on role
export function getDashboardPath(role: string): string {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "/dashboard/admin";
    case "TEACHER":
      return "/dashboard/teacher";
    case "STUDENT":
    default:
      return "/dashboard/student";
  }
}

// Custom hook-like function to use session in components
export function useAuth() {
  return {
    signIn,
    signUp,
    signOut,
    getSession,
    updateTheme,
    getTheme,
    getDashboardPath,
  };
}

export default {
  signIn,
  signInSocial,
  signUp,
  signOut,
  getSession,
  updateTheme,
  getTheme,
  getDashboardPath,
};
